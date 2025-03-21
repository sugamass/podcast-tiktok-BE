import { components } from "../type/script";
import {
  convertScriptToPostScriptResponse,
  convertPostCreateScriptRequestToScript,
} from "../converter/ScriptConverter";
import { postScript } from "@/application/usecase/ScriptUsecase";

export type PostCreateScriptRequest =
  components["schemas"]["PostCreateScriptRequest"];
export type PostCreateScriptResponse =
  components["schemas"]["PostCreateScriptResponse"];

export const postScriptController = async (
  req: PostCreateScriptRequest
): Promise<PostCreateScriptResponse> => {
  const script = convertPostCreateScriptRequestToScript(req);

  const scriptResult = await postScript(script);
  const res = convertScriptToPostScriptResponse(scriptResult);

  return res;
};
