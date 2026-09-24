// Pipeline acceptance tests coded by OpenAI Codex.
class Counter {
  constructor(private factor: number) {}
  run(input: number) {
    return ((n: number) => n * this.factor)(input);
  }
}
export const result = new Counter(3).run(7);
