import { DAILY_CACHE_CONTROL, jsonResponse } from "@/lib/http";
import { getDailyDateKey, getDailyId } from "@/lib/maze/daily";

export const dynamic = "force-dynamic";

export const GET = () => {
  const now = new Date();
  return jsonResponse({ date: getDailyDateKey(now), mazeId: getDailyId(now) }, DAILY_CACHE_CONTROL);
};