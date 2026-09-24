// Pipeline demonstration coded by OpenAI Codex.
export {};

// Minimal JSX types coded by OpenAI Codex; no React installation is required.
declare global {
    namespace JSX {
        interface Element {
            tag: string;
            props: Record<string, unknown>;
            children: unknown[];
        }
        interface IntrinsicElements {
            span: { title?: string };
        }
    }
}

// Demonstration JSX factory coded by OpenAI Codex.
function h(tag: string, props: Record<string, unknown> | null, ...children: unknown[]): JSX.Element {
    return { tag, props: props ?? {}, children };
}

// Curried pipeline stage coded by OpenAI Codex.
const multiplyBy = (factor: number) => (value: number) => value * factor;

// JSX pipeline stages coded by OpenAI Codex.
const result = 21
    |> multiplyBy(2)
    |> (value => <span title={value |> (n => `Result: ${n}`)}>{value}</span>);

console.log(JSON.stringify(result));
