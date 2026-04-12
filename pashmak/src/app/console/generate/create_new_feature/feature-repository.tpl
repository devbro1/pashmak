import { {{className}}Model } from "@/app/features/{{classNameLower}}/{{className}}Model";

export class {{className}}Repository {
  async getQuery() {
    return {{className}}Model.getQuery();
  }

  async findById(id: string): Promise<{{className}}Model | null> {
    return await {{className}}Model.find(id);
  }

  async create(data: Partial<Record<string, unknown>>): Promise<{{className}}Model> {
    const record = new {{className}}Model();
    Object.assign(record, data);
    await record.save();
    return record;
  }

  async update(id: string, data: Partial<Record<string, unknown>>): Promise<{{className}}Model | null> {
    const record = await {{className}}Model.find(id);
    if (!record) return null;
    Object.assign(record, data);
    await record.save();
    return record;
  }

  async delete(id: string): Promise<boolean> {
    const record = await {{className}}Model.find(id);
    if (!record) return false;
    await record.delete();
    return true;
  }
}
