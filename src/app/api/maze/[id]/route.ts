import { IMMUTABLE_CACHE_CONTROL, jsonError, jsonResponse } from "@/lib/http";
import { generateMaze } from "@/lib/maze/generate";
import { encodeId, parseId } from "@/lib/maze/id";

export const GET = async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const spec = parseId(id);
  if (spec === null) return jsonError(400, "invalid-maze-id");

  return jsonResponse({ id: encodeId(spec), maze: generateMaze(spec) }, IMMUTABLE_CACHE_CONTROL);
};