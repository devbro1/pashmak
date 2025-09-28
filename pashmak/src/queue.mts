export * from "@devbro/neko-queue";
import { QueueTransportInterface } from "@devbro/neko-queue";
import { PostgresqlConnection } from "@devbro/neko-sql";
import { Query } from "@devbro/neko-sql";
import { db } from "./facades.mjs";

export type DatabaseTransportConfig = {
  listen_interval: number; // in milliseconds
  message_limit: number; // number of messages to process at a time
  max_retries: number; // maximum number of retries for a failed message
  db_connection: string; // database connection name
};
export class DatabaseTransport implements QueueTransportInterface {
  private config: DatabaseTransportConfig = {
    listen_interval: 60000,
    message_limit: 10,
    max_retries: 5,
    db_connection: "default",
  };

  private activeIntervals: Set<NodeJS.Timeout> = new Set();

  constructor(config: Partial<DatabaseTransportConfig> = {}) {
    this.config = { ...this.config, ...config };
  }

  setlisten_interval(interval: number): void {
    this.config.listen_interval = interval;
  }

  setmessage_limit(limit: number): void {
    this.config.message_limit = limit;
  }

  async dispatch(channel: string, message: string): Promise<void> {
    const conn = db(this.config.db_connection);
    try {
      await conn.connect();
      const q: Query = conn.getQuery();
      await q.table("queue_messages").insert({
        channel: channel,
        message: message,
        processed: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_tried_at: null,
        process_message: "",
      });
    } finally {
      await conn.disconnect();
    }
  }

  async listen(
    channel: string,
    callback: (message: string) => Promise<void>,
  ): Promise<void> {
    // create a promise that runs every minute
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        const conn = db(this.config.db_connection);
        try {
          await conn.connect();
          const q: Query = conn.getQuery();
          const messages = await q
            .table("queue_messages")
            .whereOp("channel", "=", channel)
            .whereNested((subQ) => {
              subQ.whereOp("status", "=", "pending", "or");
              subQ.whereOp("status", "=", "failed", "or");
            })
            .whereOp("retried_count", "<", this.config.max_retries)
            .limit(this.config.message_limit)
            .orderBy("last_tried_at", "asc")
            .get();
          for (const msg of messages) {
            try {
              await q
                .table("queue_messages")
                .whereOp("id", "=", msg.id)
                .update({
                  status: "processing",
                  retried_count: (msg.retried_count || 0) + 1,
                  updated_at: new Date(),
                });

              await callback(msg.message);

              // mark message as processed
              await q
                .table("queue_messages")
                .whereOp("id", "=", msg.id)
                .update({
                  status: "processed",
                  last_tried_at: new Date(),
                  process_message: "Processed successfully",
                  updated_at: new Date(),
                });
            } catch (error) {
              await q
                .table("queue_messages")
                .whereOp("id", "=", msg.id)
                .update({
                  status: "failed",
                  last_tried_at: new Date(),
                  process_message:
                    (error as Error).message || "Error processing message",
                });
            }
          }
        } catch (error) {
          // If there's an error with the interval itself, remove it from tracking
          this.activeIntervals.delete(intervalId);
          reject(error);
        } finally {
          await conn.disconnect();
        }
      }, this.config.listen_interval);

      // Track this interval
      this.activeIntervals.add(intervalId);
    });
  }

  async stopListening(): Promise<void> {
    // Clear all active intervals
    for (const intervalId of this.activeIntervals) {
      clearInterval(intervalId);
    }
    // Clear the set
    this.activeIntervals.clear();
  }
}
