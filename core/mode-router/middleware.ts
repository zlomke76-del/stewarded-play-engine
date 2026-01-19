import type { NextFunction, Request, Response } from "express";
import { routeMode } from "./index";

export function modeRouter() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const text = (req.body?.message ?? "").toString();
    const lastMode = (req.headers["x-last-mode"] as string | undefined) as any;
    const result = routeMode(text, { lastMode });

    // attach for downstream handlers
    (req as any).moral = { mode: result.mode, confidence: result.confidence, signals: result.signals, scores: result.scores };

    // minimal telemetry event (no PII)
    console.log(JSON.stringify({
      event: "mode_transition",
      from: lastMode || null,
      to: result.mode,
      confidence: result.confidence,
      context_id: req.headers["x-context-id"] || null,
      version: "canon-1.0.0",
      ts: new Date().toISOString()
    }));

    next();
  };
}
