import type { AiGatewayRequest } from "../types";

export type AiEvaluation = {
  score: number;
  notes: string[];
};

export function evaluateAiResponse(request: AiGatewayRequest, answer: string): AiEvaluation {
  const notes: string[] = [];
  let score = 90;

  if (answer.length < 20) {
    score -= 15;
    notes.push("Answer may be too short.");
  }

  if (!/SALORA|drink|order|pairing|loyalty|product|menu/i.test(answer)) {
    score -= 10;
    notes.push("Answer may be weakly grounded in SALORA domain.");
  }

  if (request.intent.includes("order") && /paid|charged|payment/i.test(answer)) {
    score -= 20;
    notes.push("Order answer mentions payment, which is out of scope.");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    notes
  };
}
