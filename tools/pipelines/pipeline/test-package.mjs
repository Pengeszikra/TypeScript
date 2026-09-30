// Installed-package tests coded by OpenAI Codex. Exercises actual npm tarballs offline.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
    mkdtemp,
    readFile,
    rename,
    rm,
    writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
    checksum,
    npm,
    output,
    readJSON,
    readRelease,
    run,
    writeJSON,
} from "./common.mjs";

// Coded by OpenAI Codex.
async function testPackage() {
    await rm(join(output, "package-test.json"), { force: true });
    const { settings, manifest } = await readRelease();
    const hostName = `${settings.name}-${process.platform}-${process.arch}`;
    const host = manifest.packages.find(entry => entry.name === hostName);
    assert.ok(host, "Build a package for this machine first.");
    const main = manifest.packages.at(-1);
    const temporary = await mkdtemp(join(tmpdir(), "tspipe-package-test-"));
    try {
        await writeJSON(join(temporary, "package.json"), {
            private: true,
            dependencies: {
                [hostName]: `file:${join(output, host.file)}`,
                [settings.name]: `file:${join(output, main.file)}`,
            },
        });
        npm(["install", "--offline", "--ignore-scripts", "--omit=optional", "--no-audit", "--no-fund", "--package-lock=false"], { cwd: temporary });
        const installed = join(temporary, "node_modules", ...settings.name.split("/"));
        const platform = join(temporary, "node_modules", ...hostName.split("/"));
        const cli = join(installed, "bin/tspipe.mjs");
        const packageJSON = await readJSON(join(installed, "package.json"));
        assert.deepEqual(Object.keys(packageJSON.bin), ["tspipe"]);
        assert.equal(packageJSON.bin.tspipe.replace(/^\.\//, ""), "bin/tspipe.mjs");
        for (const directory of [installed, platform]) {
            assert.ok((await readFile(join(directory, "LICENSE"))).length > 0);
            assert.ok((await readFile(join(directory, "NOTICE.txt"))).length > 0);
        }
        assert.equal(run(process.execPath, [cli, "--version"]), `Version ${settings.version}`);
        assert.equal(npm(["exec", "--offline", "--", "tspipe", "--version"], { cwd: temporary }), `Version ${settings.version}`);
        // Coded by OpenAI Codex. Every source fixture uses the same installed compiler.
        const source = `// Package fixture coded by OpenAI Codex.
const trim = (value: string): string => value.trim();
const count = (value: string): number => value.length;
const double = (value: number): number => value * 2;
const stringify = (value: number): string => String(value);
const identity = <T,>(value: T): T => value;
const result: string = "  pipe  " |> trim |> count |> identity |> double |> stringify;
console.log(result);
`;
        const jsx = `// TSX package fixture coded by OpenAI Codex.
declare namespace JSX {
    type Element = string;
    interface ElementChildrenAttribute { children: {}; }
}
function h(component: (props: { children?: string }) => string, props: object | null, ...children: string[]): string {
    return component({ ...props, children: children[0] });
}
const InteractiveElement = (props: { children?: string }): string => props.children ?? "";
const InputHandler = (value: number): string => "Value: " + value;
const input = 21;
const element = <InteractiveElement>{input |> InputHandler}</InteractiveElement>;
console.log(element);
`;
        await writeFile(join(temporary, "example.ts"), source);
        await writeFile(join(temporary, "example.tsx"), source);
        await writeFile(join(temporary, "jsx.tsx"), jsx);
        for (const [file, expected] of [["example.ts", "8"], ["example.tsx", "8"], ["jsx.tsx", "Value: 21"]]) {
            run(process.execPath, [cli, "--strict", "--noEmitOnError", "--target", "ES2022", "--module", "commonjs", "--jsx", "react", "--jsxFactory", "h", "--outDir", "out", file], { cwd: temporary });
            const emitted = file.replace(/\.tsx?$/, ".js");
            assert.equal(run(process.execPath, [join(temporary, "out", emitted)]), expected);
        }
        const listed = run(process.execPath, [cli, "--noEmit", "--listFiles", "example.ts"], { cwd: temporary });
        assert.ok(listed.includes("lib.es5.d.ts"));
        assert.ok(!listed.includes("bundled:///"));
        for (const extension of ["ts", "tsx"]) {
            for (
                const [label, invalid] of [
                    ["type", 'const result = "text" |> ((value: number) => value + 1);'],
                    ["arity", "const result = 1 |> ((a: number, b: number) => a + b);"],
                    ["middle", "const result = 1 |> ((n: number) => String(n)) |> ((n: number) => n * 2);"],
                ]
            ) {
                const filename = `${label}.${extension}`;
                await writeFile(join(temporary, filename), `// Negative package fixture coded by OpenAI Codex.\n${invalid}\n`);
                const failed = spawnSync(process.execPath, [cli, "--strict", "--noEmit", "--jsx", "preserve", filename], { cwd: temporary, encoding: "utf8" });
                assert.ok(failed.status > 0, `${filename} unexpectedly compiled`);
                assert.match(failed.stdout + failed.stderr, /TS(?:2345|2554|2322)/);
            }
        }
        // Coded by OpenAI Codex. A missing platform must fail, not fall back to stock tsc.
        await rename(platform, `${platform}-hidden`);
        const missing = spawnSync(process.execPath, [cli, "--version"], { encoding: "utf8" });
        assert.equal(missing.status, 1);
        assert.match(missing.stderr, /Missing .*typescript-/);
        await writeJSON(join(output, "package-test.json"), {
            _comment: "Package test result generated by OpenAI Codex's test runner.",
            manifestSha512: await checksum(join(output, "release-manifest.json")),
            platform: `${process.platform}-${process.arch}`,
            passed: true,
        });
        console.log("PASS: real tarball installation, CLI version, TS + TSX pipelines, JSX children, type-changing chains, generics, invalid types/arity, library declarations, missing-platform diagnostics.");
    }
    finally {
        await rm(temporary, { recursive: true, force: true });
    }
}

testPackage().catch(error => {
    console.error(error.stack);
    process.exitCode = 1;
});
