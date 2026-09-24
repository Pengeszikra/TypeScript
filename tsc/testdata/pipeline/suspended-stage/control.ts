// Pipeline regression coded by OpenAI Codex.
function* run(input: number): Generator<number, number, (n: number) => number> {
  const value = input;
  return (yield input)(value);
}
const first = run(1), second = run(2);
first.next(); second.next();
export const result = [first.next(n => n + 10).value, second.next(n => n + 20).value];
