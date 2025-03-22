import {
  PodcastScript,
  ScriptData,
  AudioData,
  ScriptDataForTest,
  AudioUrlsForTest,
} from "@/domain/Audio";
import { v4 as uuidv4 } from "uuid";
import fsPromise from "fs/promises";
import fs from "fs";
import path from "path";
import {
  GraphAI,
  AgentFilterFunction,
  GraphData,
  ResultData,
  DefaultResultData,
} from "graphai";
import * as agents from "@graphai/agents";
import { pathUtilsAgent } from "@graphai/vanilla_node_agents";
import { ttsOpenaiAgent } from "@graphai/tts_openai_agent";
import ttsNijivoiceAgent from "@/graphaiTools/agent/tts_nijivoice_agent";
import addBGMAgent from "@/graphaiTools/agent/add_bgm_agent";
import combineFilesAgent from "@/graphaiTools/agent/combine_files_agent";
import createDataForHlsAgent from "@/graphaiTools/agent/create_data_for_hls_agent";
import savePostgresqlAgent from "@/graphaiTools/agent/save_postgresql_agent";
import waitForFileAgent from "@/graphaiTools/agent/wait_for_file_agent";
import { Pool } from "pg";
import {
  getAudioDao,
  getMypostDao,
  postAudioDao,
} from "@/infrastructure/dao/AudioDao";
import { nijivoiceActor } from "@/service/nijivoice";

export const postAudio = async (
  podcastScript: PodcastScript,
  postgrePool: Pool
): Promise<AudioData> => {
  const id = uuidv4();
  podcastScript.id = id;

  podcastScript.filename = id.replace(/-/g, "_");

  podcastScript.script.forEach((element: ScriptData, index: number) => {
    element.filename = podcastScript.filename + index;
  });

  const timestamp = Date.now();
  podcastScript.created_at = new Date(timestamp);

  let ttsApiKey: string;
  if (podcastScript.tts === "nijivoice") {
    ttsApiKey = process.env.NIJIVOICE_API_KEY ?? "";
  } else {
    ttsApiKey = process.env.OPENAI_API_KEY ?? "";
  }

  let podcasterConcurrency = 8;
  if (podcastScript.tts === "nijivoice") {
    podcasterConcurrency = 1;
    podcastScript.voices = podcastScript.voices?.map((actor) => {
      return nijivoiceActor[actor];
    });
    podcastScript.ttsAgent = "ttsNijivoiceAgent";
  } else {
    podcastScript.voices = podcastScript.voices ?? ["shimmer", "echo"];
    podcastScript.ttsAgent = "ttsOpenaiAgent";
  }

  podcastScript.voicemap = podcastScript.speakers?.reduce(
    (map: any, speaker: string, index: number) => {
      map[speaker] = podcastScript.voices![index];
      return map;
    },
    {}
  );
  console.log("voicemap:", podcastScript.voicemap);

  const fileUrl =
    process.env.STORAGE_URL ??
    "http://localhost:3000/" + "stream/" + podcastScript.filename + ".m3u8";

  const openaiTtsModel = "gpt-4o-mini-tts"; //最新版のモデル

  const graphTts: GraphData = {
    nodes: {
      path: {
        agent: "pathUtilsAgent",
        params: {
          method: "resolve",
        },
        inputs: {
          dirs: ["src/graphaiTools/tmp/scratchpad", "${:row.filename}.mp3"],
        },
      },
      voice: {
        agent: (namedInputs: any) => {
          const { speaker, voicemap, voice0 } = namedInputs;
          return voicemap[speaker] ?? voice0;
        },
        inputs: {
          speaker: ":row.speaker",
          voicemap: ":script.voicemap",
          voice0: ":script.voices.$0",
        },
      },
      tts: {
        agent: ":script.ttsAgent",
        inputs: {
          text: ":row.text",
          file: ":path.path",
        },
        params: {
          throwError: true,
          voice: ":voice",
          apiKey: ttsApiKey,
          model: openaiTtsModel,
          // speed: ":row.speed",
          // speed_global: ":script.speed",
        },
      },
    },
  };

  const graphPodcaster: GraphData = {
    version: 0.6,
    concurrency: podcasterConcurrency,
    nodes: {
      // script: {
      //   value: {},
      //   update: ":scriptForNest",
      // },
      map: {
        agent: "mapAgent",
        inputs: { rows: ":script.script", script: ":script" },
        graph: graphTts,
      },
      combineFiles: {
        agent: "combineFilesAgent",
        inputs: { map: ":map", script: ":script" },
        isResult: true,
      },
      addBGM: {
        agent: "addBGMAgent",
        params: {
          musicFileName:
            process.env.PATH_BGM ?? "src/graphaiTools/music/StarsBeyondEx.mp3",
        },
        inputs: {
          voiceFile: ":combineFiles",
          outFileName:
            "src/graphaiTools/tmp/output/${:script.filename}_bgm.mp3",
          script: ":script",
        },
        isResult: true,
      },
      title: {
        agent: "copyAgent",
        params: {
          namedKey: "title",
        },
        console: {
          after: true,
        },
        inputs: {
          title:
            "\n${:script.title}\n\n${:script.description}\nReference: ${:script.reference}\n",
          waitFor: ":addBGM",
        },
        isResult: true,
      },
    },
  };

  const podcastGraphDataForPost: GraphData = {
    version: 0.6,
    concurrency: 8,
    nodes: {
      script: {
        value: {},
      },
      postgresqlPool: {
        value: {},
      },
      aiPodcaster: {
        agent: "nestedAgent",
        inputs: {
          script: ":script",
        },
        graph: graphPodcaster,
      },
      convertData: {
        agent: "createDataForHlsAgent",
        params: {
          outputDir:
            process.env.TS_OUTPUT_DIR ??
            path.resolve(process.cwd(), "src", "tmpStorage"),
          isDeleteInput: true,
          // isDeleteInput: false,
        },
        inputs: {
          inputFilePath: ":aiPodcaster.addBGM",
          outputBaseName: ":script.filename",
        },
        // isResult: true,
      },
      postgresql: {
        agent: "savePostgresqlAgent",
        params: { pool: ":postgresqlPool" },
        inputs: { meta: ":script", url: fileUrl },
        isResult: true,
      },
      waitForOutput: {
        agent: "waitForFileAgent",
        params: {
          outputDir:
            process.env.TS_OUTPUT_DIR ??
            path.resolve(process.cwd(), "src", "tmpStorage"),
          timeout: 5000,
        },
        inputs: { fileName: ":convertData.fileName" },
      },
      output: {
        agent: (namedInputs: any) => {
          // const { outputDir } = params;
          const { fileName } = namedInputs;
          // console.log("outputDir:", outputDir);
          console.log("fileName:", fileName);
          return fileName;
        },
        inputs: {
          fileName: ":convertData.fileName",
          waitfor: ":waitForOutput",
        },
        if: ":waitForOutput",
        isResult: true,
      },
    },
  };

  const fileCacheAgentFilter: AgentFilterFunction = async (context, next) => {
    const { namedInputs } = context;
    const { file } = namedInputs;
    try {
      await fsPromise.access(file);
      console.log("cache hit: " + file, namedInputs.text.slice(0, 10));
      return true;
    } catch (__e) {
      const output = (await next(context)) as Record<string, any>;
      const buffer = output ? output["buffer"] : undefined;
      if (buffer) {
        console.log("writing: " + file);
        await fsPromise.writeFile(file, buffer);
        return true;
      }
      console.log("no cache, no buffer: " + file);
      return false;
    }
  };

  const agentFilters = [
    {
      name: "fileCacheAgentFilter",
      agent: fileCacheAgentFilter,
      nodeIds: ["tts"],
    },
  ];

  const podcastGraphForPost = new GraphAI(
    podcastGraphDataForPost,
    {
      ...agents,
      pathUtilsAgent,
      ttsOpenaiAgent,
      ttsNijivoiceAgent,
      addBGMAgent,
      combineFilesAgent,
      createDataForHlsAgent,
      savePostgresqlAgent,
      waitForFileAgent,
    },
    { agentFilters }
  );

  podcastGraphForPost.injectValue("script", podcastScript);
  podcastGraphForPost.injectValue("postgresqlPool", postgrePool);

  const graphResult = await podcastGraphForPost.run();
  const errors = podcastGraphForPost.errors();
  console.log("graphResult:", graphResult);

  let fileName = "";
  for (const key in graphResult) {
    if (typeof graphResult.output === "string") {
      fileName = graphResult.output;
    }
  }

  console.log("filePath:", fileName);
  console.log("errors:", errors);

  const audioData: AudioData = {
    id: id,
    url: fileUrl,
    title: podcastScript.title ?? "",
    description: podcastScript.description ?? "",
    reference: podcastScript.reference ?? [],
    tts: podcastScript.tts,
    voices: podcastScript.voices,
    speakers: podcastScript.speakers,
    script: podcastScript.script,
    created_at: podcastScript.created_at,
    created_by: podcastScript.created_by ?? "",
  };

  return audioData;
};

export const postAudioTest = async (
  scriptData: ScriptDataForTest
): Promise<AudioUrlsForTest> => {
  if (!scriptData.scriptId) {
    scriptData.scriptId = uuidv4();
  }

  const filename = scriptData.scriptId.replace(/-/g, "_");

  scriptData.script.forEach((element: ScriptData, index: number) => {
    element.filename = filename + index;
  });

  let ttsApiKey: string;
  if (scriptData.tts === "nijivoice") {
    ttsApiKey = process.env.NIJIVOICE_API_KEY ?? "";
  } else {
    ttsApiKey = process.env.OPENAI_API_KEY ?? "";
  }

  let podcasterConcurrency = 8;
  let ttsAgent: string;
  if (scriptData.tts === "nijivoice") {
    podcasterConcurrency = 1;
    scriptData.voices = scriptData.voices?.map((actor) => {
      return nijivoiceActor[actor];
    });
    ttsAgent = "ttsNijivoiceAgent";
  } else {
    scriptData.voices = scriptData.voices ?? ["shimmer", "echo"];
    ttsAgent = "ttsOpenaiAgent";
  }

  const voicemap = scriptData.speakers?.reduce(
    (map: any, speaker: string, index: number) => {
      map[speaker] = scriptData.voices![index];
      return map;
    },
    {}
  );

  const m3u8fileUrl =
    process.env.STORAGE_URL ??
    "http://localhost:3000/" + "stream/" + filename + ".m3u8";

  const openaiTtsModel = "gpt-4o-mini-tts"; //最新版のモデル

  const podcastScript: PodcastScript = {
    id: scriptData.scriptId,
    tts: scriptData.tts,
    voices: scriptData.voices,
    speakers: scriptData.speakers,
    script: scriptData.script,
    filename: filename,
    voicemap: voicemap,
    ttsAgent: ttsAgent,
    padding: undefined,
    aspectRatio: undefined,
    imageInfo: [],
  };

  const graphTts: GraphData = {
    nodes: {
      path: {
        agent: "pathUtilsAgent",
        params: {
          method: "resolve",
        },
        inputs: {
          dirs: ["src/graphaiTools/tmp/scratchpad", "${:row.filename}.mp3"],
        },
      },
      voice: {
        agent: (namedInputs: any) => {
          const { speaker, voicemap, voice0 } = namedInputs;
          return voicemap[speaker] ?? voice0;
        },
        inputs: {
          speaker: ":row.speaker",
          voicemap: ":script.voicemap",
          voice0: ":script.voices.$0",
        },
      },
      tts: {
        agent: ":script.ttsAgent",
        inputs: {
          text: ":row.text",
          file: ":path.path",
        },
        params: {
          throwError: true,
          voice: ":voice",
          apiKey: ttsApiKey,
          model: openaiTtsModel,
          // speed: ":row.speed",
          // speed_global: ":script.speed",
        },
      },
    },
  };

  const graphPodcaster: GraphData = {
    version: 0.6,
    concurrency: podcasterConcurrency,
    nodes: {
      // script: {
      //   value: {},
      //   update: ":scriptForNest",
      // },
      map: {
        agent: "mapAgent",
        inputs: { rows: ":script.script", script: ":script" },
        graph: graphTts,
      },
      combineFiles: {
        agent: "combineFilesAgent",
        inputs: { map: ":map", script: ":script" },
        isResult: true,
      },
      addBGM: {
        agent: "addBGMAgent",
        params: {
          musicFileName:
            process.env.PATH_BGM ?? "src/graphaiTools/music/StarsBeyondEx.mp3",
        },
        inputs: {
          voiceFile: ":combineFiles.outputFile",
          outFileName:
            "src/graphaiTools/tmp/output/${:script.filename}_bgm.mp3",
          script: ":script",
        },
        isResult: true,
      },
      title: {
        agent: "copyAgent",
        params: {
          namedKey: "title",
        },
        console: {
          after: true,
        },
        inputs: {
          title:
            "\n${:script.title}\n\n${:script.description}\nReference: ${:script.reference}\n",
          waitFor: ":addBGM",
        },
        isResult: true,
      },
    },
  };

  const podcastGraphDataForPost: GraphData = {
    version: 0.6,
    concurrency: 8,
    nodes: {
      script: {
        value: {},
      },
      aiPodcaster: {
        agent: "nestedAgent",
        inputs: {
          script: ":script",
        },
        graph: graphPodcaster,
      },
      convertData: {
        agent: "createDataForHlsAgent",
        params: {
          outputDir:
            process.env.TS_OUTPUT_DIR ??
            path.resolve(process.cwd(), "src", "tmpStorage"),
          isDeleteInput: true,
          // isDeleteInput: false,
        },
        inputs: {
          inputFilePath: ":aiPodcaster.addBGM",
          outputBaseName: ":script.filename",
        },
      },
      // postgresql: {
      //   agent: "savePostgresqlAgent",
      //   params: { pool: ":postgresqlPool" },
      //   inputs: { meta: ":script", url: fileUrl },
      //   isResult: true,
      // },
      waitForOutput: {
        agent: "waitForFileAgent",
        params: {
          outputDir:
            process.env.TS_OUTPUT_DIR ??
            path.resolve(process.cwd(), "src", "tmpStorage"),
          timeout: 5000,
        },
        inputs: { fileName: ":convertData.fileName" },
      },
      // TODO copy agentで十分
      output: {
        agent: (namedInputs: any) => {
          // const { outputDir } = params;
          const { fileName, mp3Urls } = namedInputs;
          // console.log("outputDir:", outputDir);
          console.log("fileName:", fileName);
          console.log("mp3Urls:", mp3Urls);
          return { fileName, mp3Urls };
        },
        inputs: {
          fileName: ":convertData.fileName",
          waitfor: ":waitForOutput",
          mp3Urls: ":aiPodcaster.combineFiles.mp3Urls",
        },
        if: ":waitForOutput",
        isResult: true,
      },
    },
  };

  const fileCacheAgentFilter: AgentFilterFunction = async (context, next) => {
    const { namedInputs } = context;
    const { file } = namedInputs;
    // try {
    //   await fsPromise.access(file);
    //   console.log("cache hit: " + file, namedInputs.text.slice(0, 10));
    //
    //   return true;
    // } catch (__e) {
    //   const output = (await next(context)) as Record<string, any>;
    //   const buffer = output ? output["buffer"] : undefined;
    //   if (buffer) {
    //     console.log("writing: " + file);
    //     await fsPromise.writeFile(file, buffer);
    //     return true;
    //   }
    //   console.log("no cache, no buffer: " + file);
    //   return false;
    // }
    try {
      await fsPromise.access(file);
      console.log(
        "cache hit (will overwrite): " + file,
        namedInputs.text.slice(0, 10)
      );
      // キャッシュがあっても処理を続ける（上書き用）
    } catch {
      console.log("no cache, creating new file: " + file);
    }

    // キャッシュの有無に関係なく next を実行して buffer を取得
    const output = (await next(context)) as Record<string, any>;
    const buffer = output ? output["buffer"] : undefined;

    if (buffer) {
      console.log("writing (overwriting): " + file);
      await fsPromise.writeFile(file, buffer);
      return true;
    }

    console.log("no buffer returned: " + file);
    return false;
  };

  const agentFilters = [
    {
      name: "fileCacheAgentFilter",
      agent: fileCacheAgentFilter,
      nodeIds: ["tts"],
    },
  ];

  const podcastGraphForPost = new GraphAI(
    podcastGraphDataForPost,
    {
      ...agents,
      pathUtilsAgent,
      ttsOpenaiAgent,
      ttsNijivoiceAgent,
      addBGMAgent,
      combineFilesAgent,
      createDataForHlsAgent,
      savePostgresqlAgent,
      waitForFileAgent,
    },
    { agentFilters }
  );

  podcastGraphForPost.injectValue("script", podcastScript);

  const graphResult = await podcastGraphForPost.run();
  const errors = podcastGraphForPost.errors();
  console.log("graphResult:", graphResult);

  let fileName = "";
  let mp3Urls = [];
  for (const [_, value] of Object.entries(graphResult)) {
    if (typeof value === "object") {
      for (const [key2, value2] of Object.entries(value)) {
        if (key2 == "fileName") {
          fileName = value2;
        } else if (key2 == "mp3Urls") {
          mp3Urls = value2;
        } else {
          throw new Error("data not found");
        }
      }
    }
  }

  return {
    m3u8_url: m3u8fileUrl,
    mp3_urls: mp3Urls,
    script_id: scriptData.scriptId,
  };
};

export const postNewAudio = async (audioData: AudioData, pool: Pool) => {
  const fileName = audioData.script_id?.replace(/-/g, "_") ?? "";
  // scratchpad削除
  const mp3FilePaths = audioData.script.map((element, index) => {
    const mp3FileName = fileName + index + ".mp3";
    return path.resolve("src/graphaiTools/tmp/scratchpad", fileName);
  });

  for (const filePath of mp3FilePaths) {
    try {
      await fsPromise.unlink(filePath);
      console.log(`Deleted: ${filePath}`);
    } catch (err) {
      console.error(`Failed to delete: ${filePath}`, err);
      throw new Error(`ファイル削除に失敗しました: ${filePath}`);
    }
  }

  // postgreSQLにメタデータ保存
  audioData.id = uuidv4();
  audioData.url =
    process.env.STORAGE_URL ??
    "http://localhost:3000/" + "stream/" + fileName + ".m3u8";
  const res = await postAudioDao(pool, audioData);
  return res;
};

export const getAudio = async (
  postgrePool: Pool,
  type?: string,
  userId?: string
): Promise<AudioData[]> => {
  let result = [];
  if (type === "myposts") {
    if (!userId) {
      throw new Error("userId is required.");
    }
    result = await getMypostDao(postgrePool, userId);
  } else {
    result = await getAudioDao(postgrePool);
  }
  return result;
};
