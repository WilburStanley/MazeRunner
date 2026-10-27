// s-maxage lets the Vercel CDN reuse the response, max-age lets browsers reuse it
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, s-maxage=31536000, immutable";
export const DAILY_CACHE_CONTROL = "public, max-age=60, s-maxage=60";
export const NO_STORE_CACHE_CONTROL = "no-store";

export const jsonResponse = (body: unknown, cacheControl: string, status = 200): Response =>
  Response.json(body, { status, headers: { "Cache-Control": cacheControl } });

export const jsonError = (status: number, error: string): Response =>
  jsonResponse({ error }, NO_STORE_CACHE_CONTROL, status);

export const readJsonObject = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    const body: unknown = await request.json();
    const isPlainObject = typeof body === "object" && body !== null && !Array.isArray(body);
    return isPlainObject ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};