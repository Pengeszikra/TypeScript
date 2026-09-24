// Pipeline regression coded by OpenAI Codex.
const obj = { factor: 10, add(this: { factor: number }, n: number) { return this.factor + n; } };
export const result = [2 |> obj.add, 3 |> obj["add"]];
