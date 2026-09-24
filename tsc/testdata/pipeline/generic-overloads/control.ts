const identity = <T,>(x: T): T => x;
function select(x: number): "number";
function select(x: string): "string";
function select(x: number | string): "number" | "string" { return typeof x === "number" ? "number" : "string"; }
const value = 21 as number;
const tuple = ["a", 1] as const;
const preserved = identity(tuple);
const kind = select(identity(value));
export const result = [preserved, kind] as const;
type Tuple = Expect<Equal<typeof preserved, readonly ["a", 1]>>;
type Kind = Expect<Equal<typeof kind, "number">>;
