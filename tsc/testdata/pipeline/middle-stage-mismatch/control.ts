const first = (n: number) => "n=" + n;
const second = (n: number) => n * 2;
/*error*/second(first(1))/*end*/;
