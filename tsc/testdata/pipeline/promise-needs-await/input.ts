const first = async (n: number) => n;
const next = (n: number) => n;
/*error*/1 |> first |> next/*end*/;
