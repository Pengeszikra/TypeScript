const first = async (n: number) => n;
const next = (n: number) => n;
/*error*/next(first(1))/*end*/;
