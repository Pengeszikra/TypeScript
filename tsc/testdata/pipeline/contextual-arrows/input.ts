const value = { name: "Ada", score: 21 };
export const result = value
  |> (({ name, score }) => ({ label: name.toUpperCase(), total: score * 2 }))
  |> (x => x.label + ":" + x.total);
type Final = Expect<Equal<typeof result, string>>;
