import { IMMUTABLE_CACHE_CONTROL, jsonError } from "@/lib/http";
import { generateMaze } from "@/lib/maze/generate";
import { encodeId, parseId } from "@/lib/maze/id";
import { parseChallengeOptions, resolveChallengeContent } from "@/lib/pdf/challenge-options";
import { buildChallengeSheet } from "@/lib/pdf/maze-sheet";
import { getSigningSecret, verifyToken } from "@/lib/tokens";

// The challenge sheet is only built from a verified result code (?code=). The name and time
// printed on it come from that signed code, never from the address. The other parameters
// (name, time, path, seed) are only on/off switches.
export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const resultCode = url.searchParams.get("code");
  if (resultCode === null) return jsonError(400, "missing-code");

  const result = verifyToken(resultCode, getSigningSecret(), "result");
  if (result === null) return jsonError(401, "invalid-token");
  const spec = parseId(result.mazeId);
  if (spec === null) return jsonError(401, "invalid-token");

  const mazeId = encodeId(spec);
  const content = resolveChallengeContent(result, parseChallengeOptions(url.searchParams));
  const pdfBytes = await buildChallengeSheet({
    spec,
    maze: generateMaze(spec),
    content,
    playUrl: `${url.origin}/play/${mazeId}`,
  });

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="challenge-${mazeId}.pdf"`,
      "Cache-Control": IMMUTABLE_CACHE_CONTROL,
    },
  });
};