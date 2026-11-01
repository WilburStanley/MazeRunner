import { IMMUTABLE_CACHE_CONTROL, jsonError } from "@/lib/http";
import { generateMaze } from "@/lib/maze/generate";
import { encodeId, parseId } from "@/lib/maze/id";
import { buildBlankSheet } from "@/lib/pdf/maze-sheet";

// The blank sheet: available for any valid maze ID. The PDF is a pure function of the ID,
// so it can be cached forever.
export const GET = async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const spec = parseId(id);
  if (spec === null) return jsonError(400, "invalid-maze-id");

  const pdfBytes = await buildBlankSheet({ spec, maze: generateMaze(spec) });
  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="maze-${encodeId(spec)}-blank.pdf"`,
      "Cache-Control": IMMUTABLE_CACHE_CONTROL,
    },
  });
};