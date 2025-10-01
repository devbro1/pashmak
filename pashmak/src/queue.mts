export * from "@devbro/neko-queue";
import { QueueTransportInterface } from "@devbro/neko-queue";
import { Query } from "@devbro/neko-sql";
import { db, logger } from "./facades.mjs";
import { createRepeater } from "@devbro/neko-helper";
import { context_provider } from "@devbro/neko-context";

type DatabaseTransportConfig = {
  queue_table: string;
  db_connection: string;
  listen_interval: number;
  message_limit: number;
};

export class DatabaseTransport implements QueueTransportInterface {
  private config: DatabaseTransportConfig = {
    queue_table: "queue_messages",
    db_connection: "default",
    listen_interval: 60, // seconds
    message_limit: 10, // messages per each fetch
  };
  channels = new Map<string, (message: string) => Promise<void>>();
  messageQueues: { channel: string; message: string }[] = [];
  repeater: ReturnType<typeof createRepeater>;

  processMessage = async () => {
    await context_provider.run(async () => {
      const conn = db(this.config.db_connection);
      try {
        await conn.connect();
        let q: Query = conn.getQuery();
        let messages = await q
          .table(this.config.queue_table)
          .whereOp("channel", "in", Array.from(this.channels.keys()))
          .whereOp("status", "in", ["pending", "failed"])
          .limit(this.config.message_limit)
          .orderBy("last_tried_at", "asc")
          .get();
        for (let msg of messages) {
          try {
            let callback = this.channels.get(msg.channel)!;
            await callback(msg.message);
            // mark message as processed
            await q
              .table(this.config.queue_table)
              .whereOp("id", "=", msg.id)
              .update({
                status: "processed",
                updated_at: new Date(),
                last_tried_at: new Date(),
                retried_count: (msg.retried_count || 0) + 1,
              });
          } catch (error) {
            await q
              .table(this.config.queue_table)
              .whereOp("id", "=", msg.id)
              .update({
                status: "failed",
                last_tried_at: new Date(),
                retried_count: (msg.retried_count || 0) + 1,
                process_message:
                  (error as Error).message || "Error processing message",
              });
          }
        }
      } catch (error) {
        logger().error("Error in DatabaseTransport listen interval:", {
          error,
        });
      } finally {
        await conn.disconnect();
      }
    });
  };

  constructor(config: Partial<DatabaseTransportConfig> = {}) {
    this.config = { ...this.config, ...config };
    this.repeater = createRepeater(
      this.processMessage,
      this.config.listen_interval * 1000,
    );
  }

  async dispatch(channel: string, message: string): Promise<void> {
    const conn = db(this.config.db_connection);
    try {
      await conn.connect();
      let schema = conn.getSchema();
      if ((await schema.tableExists(this.config.queue_table)) === false) {
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
        retried_count: 0,
        status: "pending",
      });
    } finally {
      await conn.disconnect();
    }
  }

  async registerListener(
    channel: string,
    callback: (message: string) => Promise<void>,
  ): Promise<void> {
    this.channels.set(channel, callback);
  }

  async startListening(): Promise<void> {
    this.repeater.start();
  }

  async stopListening(): Promise<void> {
    this.repeater.stop();
  }
}
