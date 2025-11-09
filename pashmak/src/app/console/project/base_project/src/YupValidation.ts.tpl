// YupValidation.ts
import { BaseModel } from '@devbro/pashmak/orm';
import { Query } from '@devbro/pashmak/sql';
import * as yup from 'yup';
import { StringSchema, NumberSchema } from 'yup';

declare module 'yup' {
  interface StringSchema {
    unique(mode: typeof BaseModel, fields: { field_name: string; ignore_id?: string }, message?: string): StringSchema;
    exists(mode: typeof BaseModel, field_name: string, message?: string): StringSchema;
    strongPassword(message?: string): StringSchema;
  }
  interface NumberSchema {
    unique(mode: typeof BaseModel, fields: { field_name: string; ignore_id?: string }, message?: string): NumberSchema;
    exists(mode: typeof BaseModel, field_name: string, message?: string): NumberSchema;
  }
}

yup.addMethod<yup.StringSchema>(
  yup.string,
  'unique',
  function (model: typeof BaseModel, { field_name, ignore_id }, message) {
    return this.test('unique', message || 'value already exists', async (value) => {
      let query: Query = (await model.getQuery()).whereOp(field_name, '=', value);
      if (ignore_id) {
        query = query.whereOp('id', '!=', ignore_id);
      }
      const existing = await query.get();
      return existing.length === 0;
    });
  }
);

yup.addMethod<yup.StringSchema>(
  yup.string,
  'exists',
  function (model: typeof BaseModel, field_name: string, message?: string) {
    return this.test('exists', message || 'value does not exists', async (value) => {
      if (value === null || value === undefined) return true;
      const existing = await model.findOne({ [field_name]: value });
      return !!existing;
    });
  }
);

yup.addMethod<yup.NumberSchema>(
  yup.number,
  'unique',
  function (model: typeof BaseModel, { field_name, ignore_id }, message) {
    return this.test('unique', message || 'value already exists', async (value) => {
      let query: Query = (await model.getQuery()).whereOp(field_name, '=', value);
      if (ignore_id) {
        query = query.whereOp('id', '!=', ignore_id);
      }
      const existing = await query.get();
      return existing.length === 0;
    });
  }
);

yup.addMethod<yup.NumberSchema>(
  yup.number,
  'exists',
  function (model: typeof BaseModel, field_name: string, message?: string) {
    return this.test('exists', message || 'value does not exists', async (value) => {
      if (value === null || value === undefined) return true;
      const existing = await model.findOne({ [field_name]: value });
      return !!existing;
    });
  }
);

yup.addMethod<yup.StringSchema>(yup.string, 'strongPassword', function (message?: string) {
  return this.test(
    'strongPassword',
    message ||
      'Password must be at least 8-30 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    function (value) {
      if (!value) return false;

      // Check length
      if (value.length < 8) return false;
      if (value.length > 30) return false;

      // Check for at least one uppercase letter
      if (!/[A-Z]/.test(value)) return false;

      // Check for at least one lowercase letter
      if (!/[a-z]/.test(value)) return false;

      // Check for at least one number
      if (!/\d/.test(value)) return false;

      // Check for at least one special character
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) return false;

      return true;
    }
  );
});
