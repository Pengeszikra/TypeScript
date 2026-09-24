// Pipeline acceptance tests coded by OpenAI Codex.
const double = (n: number) => n * 2;
const format = (n: number) => "Result: " + n;
const first = 21 |> double;
export const result = first |> format;
type First = Expect<Equal<typeof first, number>>;
type Final = Expect<Equal<typeof result, string>>;
