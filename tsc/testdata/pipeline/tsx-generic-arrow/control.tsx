// Pipeline acceptance tests coded by OpenAI Codex.
const value = { name: "Ada" };
const preserved = (<T,>(x: T) => x)(value);
export const result = <span>{preserved.name}</span>;
type Preserved = Expect<Equal<typeof preserved, { name: string }>>;
