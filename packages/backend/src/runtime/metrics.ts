const counters = new Map<string, number>();
const gauges = new Map<string, number>();
const durations = new Map<string, number[]>();

export function incrementMetric(name: string, value = 1): void {
  counters.set(name, (counters.get(name) ?? 0) + value);
}

export function setGauge(name: string, value: number): void {
  gauges.set(name, value);
}

export function recordDuration(name: string, ms: number): void {
  const values = durations.get(name) ?? [];
  values.push(ms);
  if (values.length > 200) {
    values.shift();
  }
  durations.set(name, values);
}

function durationLines(name: string, values: number[]): string[] {
  const count = values.length;
  const sum = values.reduce((total, value) => total + value, 0);
  const max = values.length ? Math.max(...values) : 0;
  return [
    `# TYPE ${name}_count counter`,
    `${name}_count ${count}`,
    `# TYPE ${name}_sum gauge`,
    `${name}_sum ${sum}`,
    `# TYPE ${name}_max gauge`,
    `${name}_max ${max}`
  ];
}

export function renderInfrastructureMetrics(): string {
  const lines: string[] = [];

  for (const [name, value] of counters) {
    lines.push(`# TYPE ${name} counter`, `${name} ${value}`);
  }

  for (const [name, value] of gauges) {
    lines.push(`# TYPE ${name} gauge`, `${name} ${value}`);
  }

  for (const [name, values] of durations) {
    lines.push(...durationLines(name, values));
  }

  return `${lines.join("\n")}\n`;
}

export function resetInfrastructureMetrics(): void {
  counters.clear();
  gauges.clear();
  durations.clear();
}
