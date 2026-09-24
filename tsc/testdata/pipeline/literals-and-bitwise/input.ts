const text = "|>";
const match = /\|>/.test(text);
const identity = (x: string) => x;
export const result = { text: text |> identity, match, bits: (1 | 2), union: ("x" as string | number) };
