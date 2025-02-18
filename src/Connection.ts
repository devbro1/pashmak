import { CompiledSql } from "./types";

export abstract class Connection {
    abstract connect(): Promise<boolean>;

    abstract runQuery(sql: CompiledSql): Promise<any>;

    abstract disconnect(): boolean;
}