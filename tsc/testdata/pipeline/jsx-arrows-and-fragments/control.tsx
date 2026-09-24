const upper = (s: string) => s.toUpperCase();
const element = ((name: string) => <span>{name}</span>)(upper("Ada"));
const wrapped = ((child: JSX.Element) => <>{child}</>)(element);
const title = ((node: JSX.Element) => node.kind)(<span>text</span>);
export const result = [wrapped, title];
type Element = Expect<Equal<typeof element, JSX.Element>>;
