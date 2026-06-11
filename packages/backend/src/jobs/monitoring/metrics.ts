import { queueNames } from "../queues/definitions";
import { getQueue } from "../queues/factory";
import { setGauge } from "../../runtime/metrics";

export async function collectQueueMetrics(): Promise<void> {
  await Promise.all(queueNames.map(async (name) => {
    const counts = await getQueue(name).getJobCounts("waiting", "active", "completed", "failed", "delayed");
    const prefix = `salora_queue_${name.replaceAll("-", "_")}`;
    setGauge(`${prefix}_waiting`, counts.waiting ?? 0);
    setGauge(`${prefix}_active`, counts.active ?? 0);
    setGauge(`${prefix}_completed`, counts.completed ?? 0);
    setGauge(`${prefix}_failed`, counts.failed ?? 0);
    setGauge(`${prefix}_delayed`, counts.delayed ?? 0);
  }));
}
