import { Script, PostScriptRequest, PostScriptResponse } from "@/domain/Script";
import { ScriptData } from "@/domain/Audio";
import {
  PostCreateScriptResponse,
  PostCreateScriptRequest,
} from "../controller/ScriptController";

export const convertPostCreateScriptRequestToScript = (
  req: PostCreateScriptRequest
): PostScriptRequest => {
  return {
    prompt: req.prompt ?? "",
    previousScript: req.previous_script?.map((row) => {
      return {
        prompt: row.prompt,
        script: row.script?.map((s) => {
          return {
            speaker: s.speaker ?? "",
            text: s.text ?? "",
            caption: s.caption,
            duration: 0,
            filename: "",
            imagePrompt: "",
          };
        }),
        reference: row.reference ?? [],
      };
    }),
    reference: req.reference ?? [],
    isSearch: req.is_search ?? false,
    speakers: req.speakers ?? [],
    wordCount: req.word_count ?? 0,
  };
};

export const convertScriptToPostScriptResponse = (
  script: PostScriptResponse
): PostCreateScriptResponse => {
  return {
    new_script: script.newScript,
    previous_script: script.previousScript,
  };
};
