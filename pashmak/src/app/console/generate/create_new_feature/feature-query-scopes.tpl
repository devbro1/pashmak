import { {{className}}Model } from "@/app/features/{{classNameLower}}/{{className}}Model";

export const {{classNameLower}}QueryScopes = {
  active(query: any) {
    return query.where("active", true);
  },

  byId(query: any, id: string | number) {
    return query.where("id", id);
  },
};
