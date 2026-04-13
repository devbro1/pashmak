import { {{className}}Repository } from "@/app/features/{{classNameLower}}/{{className}}Repository";
import { QueryKit } from "@/helpers/QueryKit";

export class {{className}}Service {
  private repository = new {{className}}Repository();

  async list(params: any) {
    const query = await this.repository.getQuery();
    const kit = new QueryKit(query);
    kit.addSort(['id']);
    kit.setDefaultSort('-id');
    
    kit.setPagination(10, 100);
    kit.cacheResults = true;
    kit.setParameters(params);

    return kit.get();
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
