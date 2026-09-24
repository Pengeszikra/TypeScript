const events: string[] = [];
const input = () => { events.push("input"); return 4; };
const stage = (n: number) => { events.push("stage"); return n * 2; };
const condition = (x: boolean) => x;
const a = condition(false) && (input() |> stage);
const b = condition(true) ? 7 : (input() |> stage);
const values = [1, 2].map(n => n |> stage);
export const result = { a, b, values, events };
