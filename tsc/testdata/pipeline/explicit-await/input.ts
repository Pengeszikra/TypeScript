// Pipeline acceptance tests coded by OpenAI Codex.
const double = async (n: number) => n * 2;
const format = (n: number) => "n=" + n;
async function run() {
  const pending = 21 |> double;
  type Pending = Expect<Equal<typeof pending, Promise<number>>>;
  return (await pending) |> format;
}
export const result = run();
