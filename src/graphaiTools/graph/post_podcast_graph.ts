import "dotenv/config";
import fsPromise from "fs/promises";
import fs from "fs";
import path from "path";
import {
  GraphAI,
  AgentFilterFunction,
  GraphData,
  // ComputedNodeData,
  // StaticNodeData,
} from "graphai";
import * as agents from "@graphai/agents";
import { ttsOpenaiAgent } from "@graphai/tts_openai_agent";
import ttsNijivoiceAgent from "@/graphaiTools/agent/tts_nijivoice_agent";
import addBGMAgent from "@/graphaiTools/agent/add_bgm_agent";
import combineFilesAgent from "@/graphaiTools/agent/combine_files_agent";
import { pathUtilsAgent } from "@graphai/vanilla_node_agents";
import { ScriptData, PodcastScript } from "@/graphaiTools/agent/type";
import createDataForHlsAgent from "@/graphaiTools/agent/create_data_for_hls_agent";
import savePostgresqlAgent from "@/graphaiTools/agent/save_postgresql_agent";

const rion_takanashi_voice = "b9277ce3-ba1c-4f6f-9a65-c05ca102ded0"; // たかなし りおん
const ben_carter_voice = "bc06c63f-fef6-43b6-92f7-67f919bd5dae"; // ベン・カーター

export const graphTts: GraphData = {
  nodes: {
    path: {
      agent: "pathUtilsAgent",
      params: {
        method: "resolve",
      },
      inputs: {
        dirs: ["@/graphaiTools/tmp/scratchpad", "${:row.filename}.mp3"],
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
        speed: ":row.speed",
        speed_global: ":script.speed",
      },
    },
  },
};

export const graphPodcaster: GraphData = {
  version: 0.6,
  concurrency: 8,
  nodes: {
    script: {
      value: {},
      update: ":scriptForNest",
    },
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
        musicFileName: process.env.PATH_BGM ?? "./music/StarsBeyondEx.mp3",
      },
      inputs: {
        voiceFile: ":combineFiles",
        outFileName: "src/graphaiTools/tmp/output/${:script.id}_bgm.mp3",
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
    },
    output: {
      agent: "copyAgent",
      inputs: {
        outputFilePath: "src/graphaiTools/tmp/output/${:script.id}_bgm.mp3",
        waitFor: ":addBGM",
      },
      isResult: true,
    },
  },
};

export const podcastGraphDataForPost: GraphData = {
  version: 0.6,
  concurrency: 8,
  nodes: {
    script: {
      value: {},
    },
    postgresqlPool: {
      value: {},
    },
    postgresqlInput: {
      value: {},
    },
    aiPodcaster: {
      agent: "nestedAgent",
      inputs: {
        // PodcastScript型を渡す
        scriptForNest: ":script",
      },
      graph: graphPodcaster,
    },
    convertData: {
      agent: "savePostgresqlAgent",
      params: { outputDir: "src/graphaiTools/tmp/output" },
      inputs: {
        inputFilePath: ":aiPodcaster.output.outputFilePath",
        outputBaseName: ":script.filename",
      },
      isResult: true,
    },
    postgresql: {
      agent: "savePostgresqlAgent",
      params: { pool: ":postgresqlPool" },
      inputs: { meta: ":postgresqlInput" },
    },
  },
};

export const fileCacheAgentFilter: AgentFilterFunction = async (
  context,
  next
) => {
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

export const agentFilters = [
  {
    name: "fileCacheAgentFilter",
    agent: fileCacheAgentFilter,
    nodeIds: ["tts"],
  },
];
