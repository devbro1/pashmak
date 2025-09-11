export * from "@devbro/neko-queue";
import { QueueTransportInterface } from "@devbro/neko-queue";
import { PostgresqlConnection } from "@devbro/neko-sql";
import { Query } from "@devbro/neko-sql";

export class DatabaseTransport implements QueueTransportInterface {
  listenInterval = 60000; // default to 1 minute
  messageLimit = 100; // default to 100 messages per fetch

  constructor(private db_config: any) {}

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
      let q: Query = conn.getQuery();
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
    return new Promise(async (resolve, reject) => {
      setInterval(async () => {
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
        } finally {
          await conn.disconnect();
        }
      }, this.listenInterval);
    });
  }
}
