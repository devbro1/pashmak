export function intersperse<T, S>(arr: T[], sep: S): (T | S)[] {
  return arr.flatMap((v, i) => (i < arr.length - 1 ? [v, sep] : [v]));
}
