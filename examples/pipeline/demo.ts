// Pipeline demonstration coded by OpenAI Codex.
export {};

// Curried and generic stages coded by OpenAI Codex.
const multiplyBy = (factor: number) => (value: number) => value * factor;
const identity = <T>(value: T): T => value;

// Pipeline chain coded by OpenAI Codex; result is inferred as string.
const result = 21
    |> multiplyBy(2)
    |> identity
    |> (value => `Result: ${value}`);

console.log(result);
