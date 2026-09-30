// Pipeline npm packaging coded by OpenAI Codex.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
    readFile,
    writeFile,
} from "node:fs/promises";
import {
    dirname,
    join,
    resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const output = join(root, "built/pipeline-npm");
export const registry = "https://registry.npmjs.org/";
export const targets = [
    { os: "darwin", cpu: "arm64", goos: "darwin", goarch: "arm64" },
    { os: "darwin", cpu: "x64", goos: "darwin", goarch: "amd64" },
    { os: "linux", cpu: "x64", goos: "linux", goarch: "amd64" },
    { os: "linux", cpu: "arm64", goos: "linux", goarch: "arm64" },
    { os: "win32", cpu: "x64", goos: "windows", goarch: "amd64" },
    { os: "win32", cpu: "arm64", goos: "windows", goarch: "arm64" },
];

// Coded by OpenAI Codex.
export async function readJSON(path) {
    return JSON.parse(await readFile(path, "utf8"));
}

// Coded by OpenAI Codex.
export async function writeJSON(path, value) {
    await writeFile(path, JSON.stringify(value, undefined, 4) + "\n");
}

// Coded by OpenAI Codex.
export async function config() {
    const value = await readJSON(join(root, "tools/pipeline/release.json"));
    assert.match(value.scope, /^@[a-z0-9][a-z0-9-]*$/, "Use an npm scope that you own.");
    assert.notEqual(value.scope, "@typescript", "The POC must use its own npm scope.");
    assert.match(value.version, /^\d+\.\d+\.\d+-pipeline\.[1-9]\d*$/, "Use a prerelease such as 7.1.0-pipeline.1.");
    assert.equal(value.tag, "next", "This POC is distributed under the next tag.");
    const source = await readFile(join(root, "tsc/internal/core/version.go"), "utf8");
    const base = /var version\s*=\s*"(\d+\.\d+\.\d+)/.exec(source)?.[1];
    assert.equal(value.version.split("-")[0], base, "Keep the compiler base version in the npm version.");
    return { ...value, name: `${value.scope}/typescript` };
}

// Coded by OpenAI Codex. shell:false preserves paths and arguments on every host.
export function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
        cwd: root,
        encoding: "utf8",
        stdio: "pipe",
        maxBuffer: 16 * 1024 * 1024,
        ...options,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal}):\n${result.stdout ?? ""}${result.stderr ?? ""}`);
    return (result.stdout ?? "").trim();
}

// Coded by OpenAI Codex. npm supplies its real JS entry point to npm scripts on Windows too.
export function npm(args, options = {}) {
    if (!process.env.npm_execpath) throw new Error("Run this command through npm run (see PIPELINE-RELEASING.md).");
    return run(process.execPath, [process.env.npm_execpath, ...args], options);
}

// Coded by OpenAI Codex.
export function targetName(target) {
    return `typescript-${target.os}-${target.cpu}`;
}

// Coded by OpenAI Codex.
export async function checksum(path) {
    return createHash("sha512").update(await readFile(path)).digest("hex");
}

// Coded by OpenAI Codex. Validate names, order and bytes before any release command.
export async function readRelease() {
    const settings = await config();
    const manifest = await readJSON(join(output, "release-manifest.json"));
    assert.equal(manifest.name, settings.name, "Rebuild after changing the npm scope.");
    assert.equal(manifest.version, settings.version, "Rebuild after changing the version.");
    assert.equal(manifest.tag, settings.tag);
    assert.ok(Array.isArray(manifest.platforms) && manifest.platforms.length > 0);
    assert.equal(new Set(manifest.platforms).size, manifest.platforms.length);
    const selected = manifest.platforms.map(id => {
        const target = targets.find(item => `${item.os}-${item.cpu}` === id);
        assert.ok(target, `Unsupported platform in manifest: ${id}`);
        return target;
    });
    const expected = [...selected.map(item => `${settings.scope}/${targetName(item)}`), settings.name];
    assert.deepEqual(manifest.packages.map(item => item.name), expected);
    for (const entry of manifest.packages) {
        assert.equal(entry.version, settings.version);
        const filename = `${entry.name.slice(1).replace("/", "-")}-${settings.version}.tgz`;
        assert.equal(entry.file, `tarballs/${filename}`);
        assert.equal(await checksum(join(output, entry.file)), entry.sha512, `Archive changed: ${entry.file}`);
    }
    return { settings, manifest };
}
