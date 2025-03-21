import { AgentFunction, AgentFunctionInfo } from "graphai";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { PodcastScript } from "./type";

const combineFilesAgent: AgentFunction<
  null,
  string,
  { script: PodcastScript }
> = async ({ namedInputs }) => {
  const { script } = namedInputs;
  const outputFile = path.resolve(
    "src/graphaiTools/tmp/output/" + script.filename + ".mp3"
  );
  const silentPath = path.resolve("src/graphaiTools/music/silent300.mp3");
  const silentLastPath = path.resolve("src/graphaiTools/music/silent800.mp3");
  const scratchpadDir = path.resolve("src/graphaiTools/tmp/scratchpad");
  const scratchpadFilePaths: string[] = [];

  const command = ffmpeg();
  script.script.forEach((element: any, index: number) => {
    const filePath = path.resolve(
      "src/graphaiTools/tmp/scratchpad/" + element.filename + ".mp3"
    );
    scratchpadFilePaths.push(filePath);
    const isLast = index === script.script.length - 2;
    command.input(filePath);
    command.input(isLast ? silentLastPath : silentPath);
    // Measure and log the timestamp of each section
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error("Error while getting metadata:", err);
      } else {
        element["duration"] = metadata.format.duration! + (isLast ? 0.8 : 0.3);
      }
    });
  });

  // const promise = new Promise((resolve, reject) => {
  //   command
  //     .on("end", () => {
  //       console.log("MP3 files have been successfully combined.");
  //       resolve(0);
  //     })
  //     .on("error", (err: any) => {
  //       console.error("Error while combining MP3 files:", err);
  //       reject(err);
  //     })
  //     .mergeToFile(outputFile, path.dirname(outputFile));
  // });

  // await promise;

  // // json出力
  // // const outputScript = path.resolve(
  // //   "src/graphaiTools/tmp/output/" + script.filename + ".json"
  // // );
  // // fs.writeFileSync(outputScript, JSON.stringify(script, null, 2));

  // return outputFile;

  try {
    await new Promise((resolve, reject) => {
      command
        .on("end", () => {
          console.log("MP3 files have been successfully combined.");
          resolve(0);
        })
        .on("error", (err: any) => {
          console.error("Error while combining MP3 files:", err);
          reject(err);
        })
        .mergeToFile(outputFile, path.dirname(outputFile));
    });
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    // scratchpad 内のファイルを削除
    try {
      await Promise.all(
        scratchpadFilePaths.map(async (file) => {
          try {
            await fs.promises.unlink(file);
            console.log(`Deleted: ${file}`);
          } catch (unlinkError) {
            console.error(`Error deleting file ${file}:`, unlinkError);
          }
        })
      );
    } catch (cleanupError) {
      console.error("Error while cleaning up scratchpad files:", cleanupError);
    }
  }

  return outputFile;
};

const combineFilesAgentInfo: AgentFunctionInfo = {
  name: "combineFilesAgent",
  agent: combineFilesAgent,
  mock: combineFilesAgent,
  samples: [],
  description: "combineFilesAgent",
  category: ["ffmpeg"],
  author: "satoshi nakajima",
  repository: "https://github.com/snakajima/ai-podcaster",
  license: "MIT",
};

export default combineFilesAgentInfo;
