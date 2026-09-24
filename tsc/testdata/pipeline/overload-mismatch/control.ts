function fn(x: string): string;
function fn(x: number): number;
function fn(x: string | number) { return x; }
/*error*/fn(true)/*end*/;
