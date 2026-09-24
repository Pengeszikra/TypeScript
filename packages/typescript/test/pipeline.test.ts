// Pipeline JavaScript API regression tests coded by OpenAI Codex.
import {
    createScanner,
    NodeFlags,
    SyntaxKind,
} from "@typescript/typescript/unstable/ast";
import {
    createCallExpression,
    createIdentifier,
} from "@typescript/typescript/unstable/ast/factory";
import { visitEachChild } from "@typescript/typescript/unstable/ast/visitor";
import assert from "node:assert/strict";
import { test } from "node:test";

// Scanner parity test coded by OpenAI Codex.
test("pipeline scanner preserves adjacent OR operators", () => {
    const scanner = createScanner(true);
    scanner.setText("|> | || |= >");
    const tokens: SyntaxKind[] = [];
    while (scanner.scan() !== SyntaxKind.EndOfFile) tokens.push(scanner.getToken());
    assert.deepEqual(tokens, [SyntaxKind.BarGreaterThanToken, SyntaxKind.BarToken, SyntaxKind.BarBarToken, SyntaxKind.BarEqualsToken, SyntaxKind.GreaterThanToken]);
});

// Source-order traversal and update tests coded by OpenAI Codex.
test("pipeline API visitors retain flags and source order", () => {
    const input = createIdentifier("input");
    const stage = createIdentifier("stage");
    const pipeline = createCallExpression(stage, undefined, undefined, [input], NodeFlags.Pipeline);
    const children: unknown[] = [];
    pipeline.forEachChild(child => {
        children.push(child);
    });
    assert.deepEqual(children, [input, stage]);
    assert.deepEqual([...pipeline.childrenIter()], [input, stage]);
    const updatedInput = createIdentifier("updatedInput");
    const visited: unknown[] = [];
    const updated = visitEachChild(pipeline, node => {
        visited.push(node);
        return node === input ? updatedInput : node;
    });
    assert.deepEqual(visited, [input, stage]);
    assert.equal(updated.flags & NodeFlags.Pipeline, NodeFlags.Pipeline);
    assert.equal(updated.arguments[0], updatedInput);
    const ordinary = createCallExpression(stage, undefined, undefined, [input], NodeFlags.None);
    assert.deepEqual([...ordinary.childrenIter()], [stage, input]);
});
