export * from "@devbro/neko-queue";
import { QueueTransportInterface } from "@devbro/neko-queue";
import { PostgresqlConnection } from "@devbro/neko-sql";
import { Query } from "@devbro/neko-sql";
import { logger } from "./facades.mts";

type DatabaseTransportConfig = {
  queue_table?: string;
};
export class DatabaseTransport implements QueueTransportInterface {
  listenInterval = 60000; // default to 1 minute
  messageLimit = 100; // default to 100 messages per fetch
  private activeIntervals: Set<NodeJS.Timeout> = new Set();
  private queue_table: string;

  constructor(private db_config: DatabaseTransportConfig) {
    this.queue_table = db_config.queue_table || "queue_messages";
  }

  setListenInterval(interval: number): void {
    this.listenInterval = interval;
  }

  setMessageLimit(limit: number): void {
    this.messageLimit = limit;
  }

  async dispatch(channel: string, message: string): Promise<void> {
    const conn = new PostgresqlConnection(this.db_config);
    try {
      await conn.connect();
      let schema = conn.getSchema();
      if(await schema.hasTable(this.queue_table) === false) {
        return;
      }
      let q: Query = conn.getQuery();
      await q.table(this.queue_table).insert({
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
        const conn = new PostgresqlConnection(this.db_config);
        try {
          await conn.connect();
          let q: Query = conn.getQuery();
          let messages = await q
            .table("queue_messages")
            .whereOp("channel", "=", channel)
            .whereOp("processed", "=", false)
            .limit(this.messageLimit)
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
      }, this.listenInterval);

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
