import { NO_STORE_CACHE_CONTROL, jsonError, jsonResponse, readJsonObject } from "@/lib/http";
import { RUN_ERROR_STATUS, startRun } from "@/lib/run";
import { getSigningSecret } from "@/lib/tokens";

export const POST = async (request: Request) => {
  const body = await readJsonObject(request);
  if (body === null) return jsonError(400, "invalid-json");

  const result = startRun(body.mazeId, Date.now(), getSigningSecret());
  if (!result.ok) return jsonError(RUN_ERROR_STATUS[result.error], result.error);

  return jsonResponse({ mazeId: result.mazeId, runToken: result.runToken }, NO_STORE_CACHE_CONTROL);
};