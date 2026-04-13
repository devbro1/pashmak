/**
 * UUID type alias for string-based UUID values.
 * Use this type for model attributes and function signatures that work with UUIDs.
 *
 * @example
 * import { BaseModel, Attribute, UUID } from '@devbro/neko-orm';
 *
 * export class Post extends BaseModel {
 *   \@Attribute({ primaryKey: true, incrementingPrimaryKey: true, uuid: true })
 *   declare id: UUID;
 * }
 */
export type UUID = string;
