// Pipeline acceptance tests coded by OpenAI Codex.
const events: string[] = [];
function input() { events.push("input"); return 3; }
function stage(name: string) { events.push("factory:" + name); return (n: number) => { events.push("call:" + name); return n + 1; }; }
const value = input() |> stage("a") |> stage("b");
export const result = { value, events };
