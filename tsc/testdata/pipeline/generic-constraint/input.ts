// Pipeline acceptance tests coded by OpenAI Codex.
const named = <T extends { name: string },>(x: T): T => x;
/*error*/42 |> named/*end*/;
