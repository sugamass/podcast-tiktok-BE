import { AgentFunction, AgentFunctionInfo } from "graphai";
import ffmpeg from "fluent-ffmpeg";
import * as path from "path";
import fs from "fs";

const createDataForHlsAgent: AgentFunction = async ({
  params,
  namedInputs,
}) => {
  const { outputDir, isDeleteInput } = params;
  const { inputFilePath, outputBaseName } = namedInputs;
  const hlsOptions = {
    segmentTime: 10,
    listSize: 0,
    filePattern: `${outputBaseName}_%03d.ts`,
    playlistName: `${outputBaseName}.m3u8`,
    outputDir: outputDir,
  };

  // ffmpeg(inputFilePath)
  //   .outputOptions([
  //     "-codec: copy",
  //     `-hls_time ${hlsOptions.segmentTime}`,
  //     `-hls_list_size ${hlsOptions.listSize}`,
  //     `-hls_segment_filename ${path.join(
  //       hlsOptions.outputDir,
  //       hlsOptions.filePattern
  //     )}`,
  //   ])
  //   .output(path.join(hlsOptions.outputDir, hlsOptions.playlistName))
  //   .on("start", (commandLine) => {
  //     console.log("FFmpeg command:", commandLine);
  //   })
  //   .on("progress", (progress) => {
  //     console.log("progress:", progress);
  //   })
  //   .on("end", () => {
  //     console.log("end");
  //   })
  //   .on("error", (err) => {
  //     console.error("error:", err);
  //     return { error: err };
  //   })
  //   .run();

  const deleteInputFile = async () => {
    try {
      await fs.promises.unlink(inputFilePath);
      console.log(`Deleted input file: ${inputFilePath}`);
    } catch (err) {
      console.error(`Failed to delete input file: ${inputFilePath}`, err);
    }
  };

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .outputOptions([
          "-codec: copy",
          `-hls_time ${hlsOptions.segmentTime}`,
          `-hls_list_size ${hlsOptions.listSize}`,
          `-hls_segment_filename ${path.join(
            hlsOptions.outputDir,
            hlsOptions.filePattern
          )}`,
        ])
        .output(path.join(hlsOptions.outputDir, hlsOptions.playlistName))
        .on("start", (commandLine) => {
          console.log("FFmpeg command:", commandLine);
        })
        .on("progress", (progress) => {
          console.log("progress:", progress);
        })
        .on("end", () => {
          console.log("end");
          resolve({ fileName: hlsOptions.playlistName });
        })
        .on("error", (err) => {
          console.error("error:", err);
          reject(err);
        })
        .run();
    });
  } finally {
    if (isDeleteInput) {
      await deleteInputFile();
    }
  }

  return { fileName: hlsOptions.playlistName };
};

const sampleInput = {
  inputFilePath: "src/graphaiTools/agent/test/input/sample.mp3",
  outputBaseName: "sample",
};
const sampleParams = {
  outputDir: "src/graphaiTools/agent/test/output",
};
const sampleResult = {
  outputPath: "src/graphaiTools/agent/test/output/sample.m3u8",
};

const createDataForHlsAgentInfo: AgentFunctionInfo = {
  name: "createDataForHlsAgent",
  agent: createDataForHlsAgent,
  mock: createDataForHlsAgent,
  samples: [
    {
      inputs: sampleInput,
      params: sampleParams,
      result: sampleResult,
    },
  ],
  description: "Create data for HLS",
  category: ["ffmpeg"],
  author: "Kazumasa Sugawara",
  repository: "",
  license: "",
};

export default createDataForHlsAgentInfo;
