const events: string[] = [];
function input() { events.push("input"); return 3; }
function stage(name: string) { events.push("factory:" + name); return (n: number) => { events.push("call:" + name); return n + 1; }; }
const a = input();
const b = stage("a")(a);
const value = stage("b")(b);
export const result = { value, events };
