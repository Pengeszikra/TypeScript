const identity = (s: string) => s;
export const result = <div title="|>">literal |&gt; {identity("|>")}<span>{identity("ok")}</span></div>;
