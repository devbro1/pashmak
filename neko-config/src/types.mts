export type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends Record<string, any>
    ? K | `${K}.${DotPaths<T[K]>}`
    : K;
}[keyof T & string];

export type DotPathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? DotPathValue<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;

export type DotPathRecord<T> = {
  [P in DotPaths<T>]: DotPathValue<T, P>;
};