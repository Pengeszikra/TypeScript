export namespace JSX {
  interface Element { kind: string; props: { [name: string]: unknown }; }
  interface ElementChildrenAttribute { children: {}; }
  interface IntrinsicElements {
    div: { id?: string; title?: string; children?: unknown };
    span: { title?: string; children?: unknown };
  }
}
export const Fragment: string;
export function jsx(kind: string, props: object): JSX.Element;
export { jsx as jsxs, jsx as jsxDEV };
