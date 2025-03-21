import { postAudio, getAudio } from "@/application/usecase/AudioUsecase";
import type { components } from "../type/audio";
import {
  convertAudioDataToResponse,
  convertRequestToPodcastScript,
  convertAudioDataListToResponse,
} from "../converter/AudioConverter";
import { AudioData } from "@/domain/Audio";
import { Pool } from "pg";
import { get } from "http";

export type PostAudioForRequest = components["schemas"]["PostAudioForRequest"];
export type AudioDataForResponse = components["schemas"]["AudioData"];

export const postAudioController = async (
  req: PostAudioForRequest,
  postgrespool: Pool
): Promise<AudioDataForResponse> => {
  const podcastScript = convertRequestToPodcastScript(req);
  const audioData = await postAudio(podcastScript, postgrespool);

  const res = convertAudioDataToResponse(audioData);
  return res;
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
