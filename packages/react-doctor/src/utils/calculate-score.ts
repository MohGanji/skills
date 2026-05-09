import type { Diagnostic, ScoreResult } from "../types.js";
import { calculateScoreLocally } from "./calculate-score-locally.js";
import { tryScoreFromApi } from "./try-score-from-api.js";
import { proxyFetch } from "./proxy-fetch.js";

export { calculateScoreLocally } from "./calculate-score-locally.js";

export const calculateScore = async (diagnostics: Diagnostic[]): Promise<ScoreResult | null> =>
  (await tryScoreFromApi(diagnostics, proxyFetch)) ?? calculateScoreLocally(diagnostics);
