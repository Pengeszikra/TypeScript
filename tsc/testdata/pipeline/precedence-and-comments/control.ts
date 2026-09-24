const double = (n: number) => n * 2;
const minusOne = (n: number) => n - 1;
const a = minusOne(double(2 + 3));
const b = double(2) + 3;
const c = true ? double(3) : 0;
const d = double(2);
export const result = [a, b, c, d];
