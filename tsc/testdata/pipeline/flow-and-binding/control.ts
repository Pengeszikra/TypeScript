// Pipeline flow and binding regressions coded by OpenAI Codex.
let stage: ((n: number) => number) | undefined;
let assigned: number;
stage = n => n + 1;
const first = stage(2);
(n => { assigned = n; return n; })(3);
// Generator binding regression coded by OpenAI Codex.
function* run(): Generator<number, number, number> {
  const [value = (n => n + 1)(yield 1)] = [];
  return value;
}
const sequence = run();
sequence.next();
export const result = [first, assigned, sequence.next(5).value];
