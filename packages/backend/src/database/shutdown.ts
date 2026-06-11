import { disconnectPrisma } from "./prisma";

let registered = false;

export function registerDatabaseShutdown(): void {
  if (registered || typeof process === "undefined") {
    return;
  }

  registered = true;
  const shutdown = async () => {
    await disconnectPrisma();
  };

  process.once("beforeExit", shutdown);
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
