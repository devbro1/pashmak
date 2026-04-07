import { {{className}}Repository } from "./{{className}}Repository";

export class {{className}}Service {
  private repository = new {{className}}Repository();

  async list() {
    return await this.repository.findAll();
  }

  async findById(id: string) {
    return await this.repository.findById(id);
  }

  async create(data: Partial<Record<string, unknown>>) {
    return await this.repository.create(data);
  }

  async update(id: string, data: Partial<Record<string, unknown>>) {
    return await this.repository.update(id, data);
  }

  async delete(id: string) {
    return await this.repository.delete(id);
  }
}
