"use client";

import { useEffect } from "react";

export function ControlTowerPerf() {
  useEffect(() => {
    const startedAt = performance.getEntriesByType("navigation")[0]?.startTime ?? 0;
    navigator.sendBeacon?.(
      "/api/telemetry/dashboard",
      new Blob([JSON.stringify({ metric: "control_tower_widget_load_ms", value: performance.now() - startedAt })], { type: "application/json" })
    );
  }, []);

  return null;
}
