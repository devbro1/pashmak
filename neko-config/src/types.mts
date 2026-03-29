export type WithoutDollarKeys<T> =
  T extends readonly (infer U)[] ? readonly WithoutDollarKeys<U>[] :
  T extends (...args: any[]) => any ? T :
  T extends object ? {
    [K in keyof T as K extends `$${string}` ? never : K]: WithoutDollarKeys<T[K]>
  } : T;
export type DotPaths<T> = {
  [K in keyof T & string]:
    T[K] extends Record<string, any>
      ? K | `${K}.${DotPaths<T[K]>}`
      : K;
}[keyof T & string];

export type DotPathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? DotPathValue<T[K], Rest>
      : never
    : P extends keyof T
      ? T[P] extends (...args: any[]) => any
        ? ReturnType<T[P]>
        : T[P] extends Promise<infer U>
          ? U
          : T[P]
      : never;

export type DotPathRecord<T> = {
  [P in DotPaths<WithoutDollarKeys<T>>]: DotPathValue<T, P>;
};
