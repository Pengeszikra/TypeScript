const double = (n: number) => n * 2;
const minusOne = (n: number) => n - 1;
const a = 2 + 3 |> double |> minusOne;
const b = (2 |> double) + 3;
const c = true ? (3 |> double) : 0;
const d = 2 /* |> inside a comment */
  |> /* another comment */ double;
export const result = [a, b, c, d];
