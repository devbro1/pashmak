import * as yup from "yup";

export const create{{className}}Validation = yup.object({
  // TODO: define validation schema
});

export const update{{className}}Validation = yup.object({
  // TODO: define validation schema
});

export type Create{{className}}Type = yup.InferType<typeof create{{className}}Validation>;
export type Update{{className}}Type = yup.InferType<typeof update{{className}}Validation>;
