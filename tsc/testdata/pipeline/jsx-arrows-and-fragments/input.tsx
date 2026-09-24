// Pipeline acceptance tests coded by OpenAI Codex.
const upper = (s: string) => s.toUpperCase();
const element = "Ada" |> upper |> (name => <span>{name}</span>);
const wrapped = element |> (child => <>{child}</>);
const title = (<span>text</span>) |> (node => node.kind);
export const result = [wrapped, title];
type Element = Expect<Equal<typeof element, JSX.Element>>;
