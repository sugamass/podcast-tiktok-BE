export type PodcastScript = {
  id: string;
  title: string;
  padding: number | undefined; // 音声前後の余白(ms)
  description: string;
  reference: string[]; //  配列にする
  tts: string; // default: openAI  "openAI" or "nijivoice"
  voices: string[];
  speakers: string[];
  script: ScriptData[];
  filename: string; // generated
  voicemap: Map<string, string>; // generated
  ttsAgent: string; // generated
  imageInfo: any[]; // generated
  aspectRatio: string | undefined; // "16:9" or "9:16"
  created_by: string;
  created_at: Date;
};

export type ScriptData = {
  speaker: string;
  text: string;
  caption: string | undefined;
  duration: number; // generated
  filename: string; // generated
  imagePrompt: string; // inserted by LLM
};

export type SpeakerType =
  | "host"
  | "guest"
  | "announcer"
  | "teacher"
  | "student"
  | "other";

export type ttsType = "openai" | "nijivoice";

export type ttsAgentType = "ttsOpenaiAgent" | "ttsNijivoiceAgent";

export type AudioData = {
  id: string;
  url: string; // 生成された音声ファイルのURL
  title: string;
  description: string;
  reference: string[];
  tts: string;
  voices: string[];
  speakers: string[];
  script: ScriptData[];
  created_by: string;
  created_at: Date;
};
