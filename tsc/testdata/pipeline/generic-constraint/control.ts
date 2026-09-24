const named = <T extends { name: string },>(x: T): T => x;
/*error*/named(42)/*end*/;
