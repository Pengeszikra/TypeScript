// Pipeline regression coded by OpenAI Codex.
let depth = 0;
const seen: number[] = [];
function stage(): (n: number) => number {
  if (depth === 1) new Sample();
  return n => (seen.push(n), n);
}
class Sample {
  value = (() => { const input = ++depth; return stage()(input); })();
}
new Sample();
export const result = seen;
