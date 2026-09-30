// Pipeline npm builder coded by OpenAI Codex. This command never publishes.
import assert from "node:assert/strict";
import {
    chmod,
    copyFile,
    cp,
    mkdir,
    readdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import {
    checksum,
    config,
    npm,
    output,
    root,
    run,
    targetName,
    targets,
    writeJSON,
} from "./common.mjs";

// Coded by OpenAI Codex.
async function build() {
    const args = process.argv.slice(2);
    assert.ok(args.length === 0 || (args.length === 1 && args[0] === "--all"), "Usage: npm run pipeline:pack [-- --all]");
    const settings = await config();
    const selected = args.includes("--all") ? targets : targets.filter(item => item.os === process.platform && item.cpu === process.arch);
    assert.ok(selected.length, `Unsupported build host: ${process.platform}-${process.arch}`);
    console.log(run("go", ["version"]));
    const gitHead = run("git", ["rev-parse", "HEAD"]);
    const dirty = Boolean(run("git", ["status", "--porcelain"]));
    await rm(output, { recursive: true, force: true });
    const tarballs = join(output, "tarballs");
    await mkdir(tarballs, { recursive: true });
    const common = {
        _comment: "Pipeline packaging coded by OpenAI Codex; upstream license and notices retained.",
        version: settings.version,
        license: "Apache-2.0",
        repository: { type: "git", url: `${settings.repository}.git` },
        homepage: `${settings.repository}#readme`,
        bugs: { url: `${settings.repository}/issues` },
        author: "Péter Vívó (pipeline POC); Microsoft Corporation and TypeScript contributors (upstream)",
        gitHead,
        pipelineSourceDirty: dirty,
        publishConfig: { access: "public", tag: settings.tag, registry: "https://registry.npmjs.org/" },
    };
    const entries = [];
    const libraries = join(root, "tsc/internal/bundled/libs");
    const libraryFiles = (await readdir(libraries)).filter(name => name.endsWith(".d.ts"));
    assert.ok(libraryFiles.includes("lib.d.ts") && libraryFiles.includes("lib.es5.d.ts"));
    // Coded by OpenAI Codex.
    async function pack(directory, name) {
        await copyFile(join(root, "LICENSE.txt"), join(directory, "LICENSE"));
        await copyFile(join(root, "NOTICE.txt"), join(directory, "NOTICE.txt"));
        const result = JSON.parse(npm(["pack", ".", "--json", "--ignore-scripts", "--pack-destination", tarballs], { cwd: directory }));
        assert.equal(result.length, 1);
        assert.equal(result[0].name, name);
        const filename = result[0].filename;
        entries.push({ name, version: settings.version, file: `tarballs/${filename}`, sha512: await checksum(join(tarballs, filename)) });
        console.log(`Packed ${name}@${settings.version}`);
    }
    for (const target of selected) {
        const basename = targetName(target);
        const directory = join(output, "packages", basename);
        const lib = join(directory, "lib");
        const name = `${settings.scope}/${basename}`;
        await mkdir(lib, { recursive: true });
        await writeJSON(join(directory, "package.json"), {
            ...common,
            name,
            description: `Native ${target.os}-${target.cpu} compiler for the TypeScript unary pipeline POC`,
            os: [target.os],
            cpu: [target.cpu],
            files: ["lib", "LICENSE", "NOTICE.txt", "README.md"],
            exports: { "./package.json": "./package.json" },
        });
        await cp(join(root, "tools/pipeline/PLATFORM-README.md"), join(directory, "README.md"));
        await Promise.all(libraryFiles.map(file => copyFile(join(libraries, file), join(lib, file))));
        const binary = join(lib, target.os === "win32" ? "tspipe.exe" : "tspipe");
        console.log(`Building ${target.os}-${target.cpu}…`);
        run("go", [
            "build",
            "-trimpath",
            "-tags=noembed",
            `-ldflags=-s -w -X github.com/microsoft/TypeScript/tsc/internal/core.version=${settings.version}`,
            "-o",
            binary,
            "./cmd/tsc",
        ], {
            cwd: join(root, "tsc"),
            env: { ...process.env, GOOS: target.goos, GOARCH: target.goarch, GOAMD64: "v1", GOARM64: "v8.0", CGO_ENABLED: "0", GOFLAGS: "" },
            stdio: "inherit",
        });
        await chmod(binary, 0o755);
        await pack(directory, name);
    }
    const directory = join(output, "packages/typescript");
    await mkdir(join(directory, "bin"), { recursive: true });
    await writeFile(join(directory, "bin/tspipe.mjs"), (await readFile(join(root, "tools/pipeline/cli.mjs"), "utf8")).replaceAll("\r\n", "\n"));
    await chmod(join(directory, "bin/tspipe.mjs"), 0o755);
    await copyFile(join(root, "README.md"), join(directory, "README.md"));
    await writeJSON(join(directory, "package.json"), {
        ...common,
        name: settings.name,
        description: "Experimental TypeScript compiler with a type-safe, single-input pipeline operator for TS and TSX",
        type: "module",
        engines: { node: ">=22.18" },
        bin: { tspipe: "./bin/tspipe.mjs" },
        files: ["bin", "LICENSE", "NOTICE.txt", "README.md"],
        keywords: ["typescript", "pipeline", "tsx", "compiler", "proof-of-concept"],
        optionalDependencies: Object.fromEntries(selected.map(target => [`${settings.scope}/${targetName(target)}`, settings.version])),
    });
    await pack(directory, settings.name);
    await writeJSON(join(output, "release-manifest.json"), {
        _comment: "Generated by OpenAI Codex's pipeline package builder.",
        name: settings.name,
        version: settings.version,
        tag: settings.tag,
        gitHead,
        dirty,
        platforms: selected.map(target => `${target.os}-${target.cpu}`),
        packages: entries,
    });
    console.log(`Ready: ${output}\nNext: npm run test:pipeline-package\nNothing has been published.`);
}

build().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
