const secretPatterns = [
  /api[_-]?key/i,
  /jwt/i,
  /secret/i,
  /token/i,
  /database_url/i,
  /redis_url/i,
  /system prompt/i,
  /ignore (all )?previous instructions/i
];

export type SafetyResult = {
  blocked: boolean;
  reasons: string[];
  sanitizedMessage: string;
};

export function inspectAiRequest(message: string): SafetyResult {
  const reasons = secretPatterns.filter((pattern) => pattern.test(message)).map((pattern) => `Matched unsafe pattern: ${pattern.source}`);
  return {
    blocked: reasons.length > 0,
    reasons,
    sanitizedMessage: redactSensitiveData(message)
  };
}

export function redactSensitiveData(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\+?\d[\d\s-]{7,}\d/g, "[redacted-phone]")
    .replace(/(api[_-]?key|token|secret|password)\s*[:=]\s*\S+/gi, "$1=[redacted]");
}

export function sanitizeAiOutput(value: string): string {
  return redactSensitiveData(value).replace(/system prompt/gi, "internal instructions");
}

export function safeRefusal(reasons: string[]): string {
  return `I cannot help with that request because it may expose private SALORA operational information. ${reasons.length ? "Please ask about menu guidance, ordering help, pairings, or loyalty instead." : ""}`.trim();
}
