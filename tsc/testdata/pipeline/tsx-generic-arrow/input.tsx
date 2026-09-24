const value = { name: "Ada" };
const preserved = value |> (<T,>(x: T) => x);
export const result = <span>{preserved.name}</span>;
type Preserved = Expect<Equal<typeof preserved, { name: string }>>;
