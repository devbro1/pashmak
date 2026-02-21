type Primitive =
  | string | number | boolean | bigint | symbol | null | undefined
  | Date | RegExp;

type IsPlainObject<T> =
  T extends Primitive ? false
  : T extends (...args: any[]) => any ? false
  : T extends readonly any[] ? false
  : T extends object ? true
  : false;

type NonDollarKeys<T> = {
  [K in keyof T & string as K extends `$${string}` ? never : K]: T[K]
};

export type DotPaths<T> = {
  [K in keyof NonDollarKeys<T> & string]:
    IsPlainObject<NonNullable<NonDollarKeys<T>[K]>> extends true
      ? K | `${K}.${DotPaths<NonNullable<NonDollarKeys<T>[K]>>}>`
      : K
}[keyof NonDollarKeys<T> & string];

export type DotPathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof NonDollarKeys<T>
      ? DotPathValue<NonNullable<NonDollarKeys<T>[K]>, Rest>
      : never
    : P extends keyof NonDollarKeys<T>
      ? NonDollarKeys<T>[P]
      : never;

export type DotPathRecord<T> = {
  [P in DotPaths<T>]: DotPathValue<T, P>;
};