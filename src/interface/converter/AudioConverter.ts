import type {
  PostAudioForRequest,
  AudioDataForResponse,
  AudioTestRequest,
  AudioTestResponse,
} from "../controller/AudioController";
import type {
  PodcastScript,
  AudioData,
  ScriptDataForTest,
  AudioUrlsForTest,
} from "@/domain/Audio";

export const convertRequestToPodcastScript = (
  req: PostAudioForRequest
): PodcastScript => {
  const podcastScript: PodcastScript = {
    id: "",
    title: req.title,
    padding: undefined,
    description: req.description ?? "",
    reference: req.reference ?? [],
    tts: req.tts,
    voices: req.voices,
    speakers: req.speakers,
    script: req.script.map((row) => {
      return {
        speaker: row.speaker,
        text: row.text,
        caption: undefined,
        duration: 0,
        filename: "",
        imagePrompt: "",
      };
    }),
    filename: "",
    voicemap: new Map<string, string>(),
    ttsAgent: "",
    imageInfo: [],
    aspectRatio: "16:9",
    created_at: new Date(),
    created_by: req.user_id,
  };

  return podcastScript;
};

export const convertAudioDataToResponse = (
  audioData: AudioData
): AudioDataForResponse => {
  const res: AudioDataForResponse = {
    id: audioData.id,
    title: audioData.title,
    description: audioData.description,
    reference: audioData.reference,
    tts: audioData.tts,
    voices: audioData.voices,
    speakers: audioData.speakers,
    script: audioData.script,
    created_at: audioData.created_at.toISOString(),
    created_by: audioData.created_by,
    url: audioData.url,
  };

  return res;
};

export const convertRequestToScriptDataForTest = (
  req: AudioTestRequest
): ScriptDataForTest => {
  const scriptDataForTest: ScriptDataForTest = {
    script:
      req.script?.map((row) => {
        return {
          speaker: row.speaker,
          text: row.text,
          caption: undefined,
          duration: 0,
          filename: "",
          imagePrompt: "",
        };
      }) ?? [],
    tts: req?.tts ?? "openAI",
    voices: req.voices ?? [],
    speakers: req.speakers ?? [],
  };

  return scriptDataForTest;
};

export const convertAudioDataListToResponse = (
  audioData: AudioData[]
): AudioDataForResponse[] => {
  const res: AudioDataForResponse[] = audioData.map((audio) =>
    convertAudioDataToResponse(audio)
  );
  return res;
};
