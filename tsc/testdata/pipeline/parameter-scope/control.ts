// Pipeline regression coded by OpenAI Codex.
const outer = 10;
const identity = (n: number) => n;
function read(value = identity(outer)) { const outer = 99; return value + 1; }
// Destructured parameter scope regression coded by OpenAI Codex.
function destructured({ value = identity(outer) } = {}) { const outer = 99; return value; }
export const result = [read(), read.length, destructured()];
