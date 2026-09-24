// Pipeline acceptance tests coded by OpenAI Codex.
declare global {
  namespace JSX {
    interface Element { kind: string; props: { [name: string]: unknown }; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicElements {
      div: { id?: string; title?: string; children?: unknown };
      span: { title?: string; children?: unknown };
    }
  }
}
const React = {
  Fragment: "fragment",
  createElement(kind: string, props: object | null, ...children: unknown[]): JSX.Element {
    return { kind, props: { ...props, ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) } };
  }
};
