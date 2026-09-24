// Pipeline acceptance tests coded by OpenAI Codex.
const text = "|>";
const match = /\|>/.test(text);
const identity = (x: string) => x;
export const result = { text: identity(text), match, bits: (1 | 2), union: ("x" as string | number) };
