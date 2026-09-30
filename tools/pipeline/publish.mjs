// Pipeline publisher coded by OpenAI Codex. Dry-run unless explicitly given --publish.
import assert from "node:assert/strict";
import { join } from "node:path";
import {
    checksum,
    npm,
    output,
    readJSON,
    readRelease,
    registry,
    run,
    targets,
} from "./common.mjs";

// Coded by OpenAI Codex.
async function publish() {
    const args = process.argv.slice(2);
    assert.ok(args.length === 0 || (args.length === 1 && args[0] === "--publish"), "Usage: npm run pipeline:publish [-- --publish]");
    const actual = args.includes("--publish");
    const { settings, manifest } = await readRelease();
    if (actual) {
        assert.deepEqual(manifest.platforms, targets.map(target => `${target.os}-${target.cpu}`), "Build all targets before publishing: npm run pipeline:pack -- --all");
        assert.equal(manifest.dirty, false, "Commit changes, then rebuild before publishing.");
        assert.equal(run("git", ["status", "--porcelain"]), "", "Commit changes, then rebuild before publishing.");
        assert.equal(run("git", ["rev-parse", "HEAD"]), manifest.gitHead, "Source commit changed: rebuild.");
        const testResult = await readJSON(join(output, "package-test.json"));
        assert.equal(testResult.passed, true, "The installed-package test must pass before publishing.");
        assert.equal(testResult.manifestSha512, await checksum(join(output, "release-manifest.json")), "Run npm run test:pipeline-package on these exact archives first.");
        console.log(`Publishing as ${npm(["whoami", "--registry", registry])}`);
    }
    console.log(`${actual ? "Publishing" : "Dry-run"}: ${settings.name}@${settings.version}, tag ${settings.tag}`);
    for (const entry of manifest.packages) {
        console.log(entry.name);
        npm([
            "publish",
            join(output, entry.file),
            "--access",
            "public",
            "--tag",
            settings.tag,
            "--registry",
            registry,
            "--ignore-scripts",
            ...(actual ? [] : ["--dry-run"]),
        ], { stdio: "inherit" });
    }
    console.log(actual ? "Published platform packages, then the main package." : "Dry-run complete. Nothing was published.");
}

publish().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
