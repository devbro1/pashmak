export * from "@devbro/neko-queue";
import { QueueTransportInterface } from "@devbro/neko-queue";
import { PostgresqlConnection } from "@devbro/neko-sql";
import { Query } from "@devbro/neko-sql";
import { db, logger } from "./facades.mts";

type DatabaseTransportConfig = {
  queue_table: string;
  db_connection: string;
  listen_interval: number;
  message_limit: number;
};

export class DatabaseTransport implements QueueTransportInterface {
  private activeIntervals: Set<NodeJS.Timeout> = new Set();
  private config: DatabaseTransportConfig = {
    queue_table: "queue_messages",
    db_connection: "default",
    listen_interval: 60, // seconds
    message_limit: 10, // messages per each fetch
  };

  constructor(config: Partial<DatabaseTransportConfig>) {
    this.config = { ...this.config, ...config };
  }

  setListenInterval(interval: number): void {
    this.config.listen_interval = interval;
  }

  setMessageLimit(limit: number): void {
    this.config.message_limit = limit;
  }

  async dispatch(channel: string, message: string): Promise<void> {
    const conn = db(this.config.db_connection);
    try {
      await conn.connect();
      let schema = conn.getSchema();
      if(await schema.tableExists(this.config.queue_table) === false) {
        return;
      }
      let q: Query = conn.getQuery();
      await q.table(this.config.queue_table).insert({
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
    return new Promise(async (resolve, reject) => {
      const intervalId = setInterval(async () => {
        const conn = db(this.config.db_connection);
        try {
          await conn.connect();
          let q: Query = conn.getQuery();
          let messages = await q
            .table("queue_messages")
            .whereOp("channel", "=", channel)
            .whereOp("processed", "=", false)
            .limit(this.config.message_limit)
            .orderBy("last_tried_at", "asc")
            .get();
          for (let msg of messages) {
            try {
              await callback(msg.message);
              // mark message as processed
              await q
                .table("queue_messages")
                .whereOp("id", "=", msg.id)
                .update({
                  processed: true,
                  updated_at: new Date(),
                });
            } catch (error) {
              await q
                .table("queue_messages")
                .whereOp("id", "=", msg.id)
                .update({
                  processed: false,
                  last_tried_at: new Date(),
                  process_message:
                    (error as Error).message || "Error processing message",
                });
            }
          }
        } catch (error) {
          this.activeIntervals.delete(intervalId);
          logger().error("Error in DatabaseTransport listen interval:", { error });
        } finally {
          await conn.disconnect();
        }
      }, this.config.listen_interval * 1000);

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
