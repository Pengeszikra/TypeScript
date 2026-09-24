const events: string[] = [];
const fail = (n: number): number => { events.push("fail"); throw new Error("stop"); };
const next = () => { events.push("next-factory"); return (n: number) => n; };
try { const first = fail(1); next()(first); } catch (error) { if (!(error instanceof Error) || error.message !== "stop") throw error; }
export const result = events;
