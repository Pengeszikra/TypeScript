#!/usr/bin/env node
// Pipeline CLI coded by OpenAI Codex. Keep the shebang first for npm executable links.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import {
    dirname,
    join,
} from "node:path";

const require = createRequire(import.meta.url);

// Coded by OpenAI Codex. Resolve the matching fork binary, never the upstream compiler.
try {
    const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    const platform = `${process.platform}-${process.arch}`;
    const packageName = `${manifest.name}-${platform}`;
    if (!manifest.optionalDependencies?.[packageName]) throw new Error(`Unsupported platform: ${platform}. See the package README for supported systems.`);
    let packagePath;
    try {
        packagePath = require.resolve(`${packageName}/package.json`);
    }
    catch {
        throw new Error(`Missing ${packageName}@${manifest.version}. Install with optional dependencies enabled (npm install --include=optional), or explicitly install the matching platform package. Go is not required.`);
    }
    const platformManifest = JSON.parse(readFileSync(packagePath, "utf8"));
    if (platformManifest.version !== manifest.version) throw new Error(`Platform package version mismatch: expected ${manifest.version}, found ${platformManifest.version}. Reinstall matching versions.`);
    const executable = join(dirname(packagePath), "lib", process.platform === "win32" ? "tspipe.exe" : "tspipe");
    const child = spawn(executable, process.argv.slice(2), { stdio: "inherit", windowsHide: true });
    const signals = ["SIGINT", "SIGTERM"];
    const handlers = new Map(signals.map(signal => [signal, () => child.kill(signal)]));
    for (const [signal, handler] of handlers) process.on(signal, handler);
    // Coded by OpenAI Codex.
    child.on("error", error => {
        console.error(`tspipe: ${error.message}`);
        process.exitCode = 1;
    });
    // Coded by OpenAI Codex.
    child.on("close", (code, signal) => {
        for (const [name, handler] of handlers) process.off(name, handler);
        process.exitCode = code ?? (signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 1);
    });
}
catch (error) {
    console.error(`tspipe: ${error.message}`);
    process.exitCode = 1;
}
