// Pipeline acceptance tests coded by OpenAI Codex.
const step = (n: number) => n + 1;
export const result = step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(step(0))))))))))))))))))))))))))))))));
type Final = Expect<Equal<typeof result, number>>;
