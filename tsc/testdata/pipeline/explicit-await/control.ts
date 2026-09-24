const double = async (n: number) => n * 2;
const format = (n: number) => "n=" + n;
async function run() {
  const pending = double(21);
  type Pending = Expect<Equal<typeof pending, Promise<number>>>;
  return format(await pending);
}
export const result = run();
