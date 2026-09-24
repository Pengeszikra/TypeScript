// Pipeline flow and binding regressions coded by OpenAI Codex.
let stage: ((n: number) => number) | undefined;
let assigned: number;
const first = (stage = n => n + 1, 2) |> stage;
3 |> (n => { assigned = n; return n; });
// Generator binding regression coded by OpenAI Codex.
function* run(): Generator<number, number, number> {
  const [value = (yield 1) |> (n => n + 1)] = [];
  return value;
}
const sequence = run();
sequence.next();
export const result = [first, assigned, sequence.next(5).value];
