function optional(n: number, extra = 1) { return n + extra; }
function rest(...values: number[]) { return values.reduce((sum, n) => sum + n, 0); }
function count(n: number) { return arguments.length; }
export const result = [rest(optional(4)), count(9)];
