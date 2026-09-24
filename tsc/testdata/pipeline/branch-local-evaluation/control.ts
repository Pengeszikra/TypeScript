// Pipeline acceptance tests coded by OpenAI Codex.
const events: string[] = [];
const input = () => { events.push("input"); return 4; };
const stage = (n: number) => { events.push("stage"); return n * 2; };
const condition = (x: boolean) => x;
const a = condition(false) && stage(input());
const b = condition(true) ? 7 : stage(input());
const values = [1, 2].map(n => stage(n));
export const result = { a, b, values, events };
