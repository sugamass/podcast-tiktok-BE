import { ScriptData } from "./Audio";

export type Script = {
  title: string;
  description?: string;
  reference?: string[];
  originalPrompt: string;
  prompt: string;
  script: ScriptData[];
  previousScript?: ScriptData[];
};

export type PostScriptRequest = {
  prompt: string;
  previousScript?: PromptScriptData[];
  reference?: string[];
  isSearch?: boolean;
  speakers?: string[];
  wordCount?: number;
};

export type PostScriptResponse = {
  newScript: PromptScriptData;
  previousScript?: PromptScriptData[];
};

export type PromptScriptData = {
  prompt: string;
  script?: ScriptData[];
  reference?: string[];
};
