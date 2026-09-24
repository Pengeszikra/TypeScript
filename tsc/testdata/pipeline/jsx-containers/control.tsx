const trim = (s: string) => s.trim();
const props = (s: string) => ({ id: s });
const render = (s: string) => <span>{s}</span>;
const value = " Ada ";
const view = <div title={trim(value)} {...props(trim(value))}>{render(trim(value))}</div>;
export const result = view;
type View = Expect<Equal<typeof view, JSX.Element>>;
