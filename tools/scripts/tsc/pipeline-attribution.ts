// Pipeline attribution support coded by OpenAI Codex.
import * as fs from "node:fs";
import path from "node:path";

// Generated outputs affected by the pipeline implementation; coded by OpenAI Codex.
const pipelineOutputs = new Set([
    "packages/typescript/src/ast/ast.generated.ts",
    "packages/typescript/src/ast/factory.generated.ts",
    "packages/typescript/src/ast/visitor.generated.ts",
    "packages/typescript/src/enums/nodeFlags.enum.ts",
    "packages/typescript/src/enums/nodeFlags.ts",
    "packages/typescript/src/enums/syntaxKind.enum.ts",
    "packages/typescript/src/enums/syntaxKind.ts",
    "tsc/internal/api/encoder/decoder_generated.go",
    "tsc/internal/api/enum_values_generated.go",
    "tsc/internal/ast/ast_generated.go",
    "tsc/internal/ast/kind_generated.go",
    "tsc/internal/ast/kind_stringer_generated.go",
]);
const root = path.resolve(import.meta.dirname, "../../..");
const notice = "// Pipeline implementation coded by OpenAI Codex; existing upstream code retains its authorship.";

// Attribution insertion coded by OpenAI Codex; keep generated outputs reproducible.
export function attributePipelineOutput(fileName: string, content: string): string {
    const relative = path.relative(root, fileName).split(path.sep).join("/");
    if (!pipelineOutputs.has(relative) || content.startsWith(notice)) return content;
    const newline = content.includes("\r\n") ? "\r\n" : "\n";
    return notice + newline + content;
}

// Stringer command entry point coded by OpenAI Codex.
if (process.argv[1] === import.meta.filename) {
    for (const file of process.argv.slice(2)) {
        const original = fs.readFileSync(file, "utf8");
        const updated = attributePipelineOutput(path.resolve(file), original);
        if (updated !== original) fs.writeFileSync(file, updated);
    }
}
