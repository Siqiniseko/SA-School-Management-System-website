import { ensureDatabaseSchema } from "@workspace/db";
import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

try {
  await ensureDatabaseSchema();
  await seedIfEmpty();

  app.listen(port, () => {
    logger.info({ port }, "Server listening");
  });
} catch (e) {
  logger.error({ err: e }, "Server startup failed");
  process.exit(1);
}
