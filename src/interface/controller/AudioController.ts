import {
  postAudio,
  getAudio,
  postAudioTest,
  postNewAudio,
} from "@/application/usecase/AudioUsecase";
import type { components } from "../type/audio";
import {
  convertAudioDataToResponse,
  convertRequestToPodcastScript,
  convertAudioDataListToResponse,
  convertRequestToScriptDataForTest,
  convertRequestToAudioData,
} from "../converter/AudioConverter";
import { AudioData } from "@/domain/Audio";
import { Pool } from "pg";
import { get } from "http";

export type PostAudioForRequest = components["schemas"]["PostAudioForRequest"];
export type AudioDataForResponse = components["schemas"]["AudioData"];
export type AudioTestRequest = components["schemas"]["AudioTestRequest"];
export type AudioTestResponse = components["schemas"]["AudioTestResponse"];
export type PostNewAudioForRequest =
  components["schemas"]["PostNewAudioRequest"];

export const postAudioController = async (
  req: PostAudioForRequest,
  postgrespool: Pool
): Promise<AudioDataForResponse> => {
  const podcastScript = convertRequestToPodcastScript(req);
  const audioData = await postAudio(podcastScript, postgrespool);

  const res = convertAudioDataToResponse(audioData);
  return res;
};

export const postAudioTestController = async (
  req: AudioTestRequest
): Promise<AudioTestResponse> => {
  const podcastScriptForTest = convertRequestToScriptDataForTest(req);
  const audioData = await postAudioTest(podcastScriptForTest);

  const res: AudioTestResponse = {
    m3u8_url: audioData.m3u8_url,
    mp3_urls: audioData.mp3_urls,
    script_id: audioData.script_id,
  };
  return res;
};

export const postNewAudioController = async (
  req: PostNewAudioForRequest,
  postgrespool: Pool
): Promise<AudioDataForResponse> => {
  const audioData = convertRequestToAudioData(req);
  const res = await postNewAudio(audioData, postgrespool);
  return convertAudioDataToResponse(res);
};

export const getAudioController = async (
  postgrespool: Pool,
  type?: string,
  user_id?: string
): Promise<AudioDataForResponse[]> => {
  const audioDataList = await getAudio(postgrespool, type, user_id);
  const res = convertAudioDataListToResponse(audioDataList);
  return res;
};
