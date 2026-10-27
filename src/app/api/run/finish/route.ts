import { NO_STORE_CACHE_CONTROL, jsonError, jsonResponse, readJsonObject } from "@/lib/http";
import { RUN_ERROR_STATUS, finishRun } from "@/lib/run";
import { getSigningSecret } from "@/lib/tokens";

export const POST = async (request: Request) => {
  const body = await readJsonObject(request);
  if (body === null) return jsonError(400, "invalid-json");

  const result = finishRun(
    { runToken: body.runToken, moves: body.moves, nickname: body.nickname },
    Date.now(),
    getSigningSecret(),
  );
  if (!result.ok) return jsonError(RUN_ERROR_STATUS[result.error], result.error);

  const { ok: _ok, ...responseBody } = result;
  return jsonResponse(responseBody, NO_STORE_CACHE_CONTROL);
};