// Pipeline acceptance tests coded by OpenAI Codex.
const filter = <T,>(predicate: (x: T) => boolean) => (xs: readonly T[]) => xs.filter(predicate);
const map = <T, U>(fn: (x: T) => U) => (xs: readonly T[]) => xs.map(fn);
const positive = (n: number) => n > 0;
const label = (n: number) => "n=" + n;
const values: readonly number[] = [-1, 2, 3];
export const result = values |> filter(positive) |> map(label);
type Final = Expect<Equal<typeof result, string[]>>;
