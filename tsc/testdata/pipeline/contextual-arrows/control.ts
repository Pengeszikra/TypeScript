// Pipeline acceptance tests coded by OpenAI Codex.
const value = { name: "Ada", score: 21 };
const step1 = (x: typeof value) => { const { name, score } = x; return { label: name.toUpperCase(), total: score * 2 }; };
const step2 = (x: ReturnType<typeof step1>) => x.label + ":" + x.total;
export const result = step2(step1(value));
type Final = Expect<Equal<typeof result, string>>;
