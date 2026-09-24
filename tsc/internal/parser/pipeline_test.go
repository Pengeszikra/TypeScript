// Pipeline syntax regression tests coded by OpenAI Codex.

package parser_test

import (
	"strings"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/printer"
	"github.com/microsoft/TypeScript/tsc/internal/testutil/parsetestutil"
)

// TestPipelineSourceRoundTrip was coded by OpenAI Codex.
func TestPipelineSourceRoundTrip(t *testing.T) {
	t.Parallel()
	for _, jsx := range []bool{false, true} {
		for _, source := range []string{
			"input |> f |> (n => n + 1);",
			"(input |> f) + 1;",
			"input |> (other |> factory);",
			"input || fallback |> f;",
			"input |> f ? yes : no;",
			"(input |> f)();",
		} {
			file := parsetestutil.ParseTypeScript(source, jsx)
			parsetestutil.CheckDiagnostics(t, file)
			p := printer.NewPrinter(printer.PrinterOptions{NewLine: core.NewLineKindLF}, printer.PrintHandlers{}, nil)
			printed := p.EmitSourceFile(file)
			if strings.Count(printed, "|>") != strings.Count(source, "|>") {
				t.Fatalf("lost pipeline syntax: %q -> %q", source, printed)
			}
			reparsed := parsetestutil.ParseTypeScript(printed, jsx)
			parsetestutil.CheckDiagnostics(t, reparsed)
			if again := p.EmitSourceFile(reparsed); again != printed {
				t.Fatalf("unstable pipeline round trip: %q -> %q", printed, again)
			}
		}
	}
}

// TestPipelineSourceOrder was coded by OpenAI Codex.
func TestPipelineSourceOrder(t *testing.T) {
	t.Parallel()
	file := parsetestutil.ParseTypeScript("input |> first |> second;", false)
	parsetestutil.CheckDiagnostics(t, file)
	outer := file.Statements.Nodes[0].Expression()
	if !ast.IsPipelineExpression(outer) || !ast.IsPipelineExpression(outer.Arguments()[0]) {
		t.Fatal("pipeline must associate to the left")
	}
	lastEnd := -1
	outer.ForEachChild(func(child *ast.Node) bool {
		if child.Pos() < lastEnd {
			t.Fatal("pipeline children must be visited in source order")
		}
		lastEnd = child.End()
		return false
	})
}

// TestPipelineIncompleteSyntax was coded by OpenAI Codex.
func TestPipelineIncompleteSyntax(t *testing.T) {
	t.Parallel()
	for _, jsx := range []bool{false, true} {
		for _, source := range []string{"input |>", "|> stage;", "input |> |> stage;", "input |> ("} {
			file := parsetestutil.ParseTypeScript(source, jsx)
			if len(file.Diagnostics()) == 0 {
				t.Fatalf("expected syntax diagnostic for %q", source)
			}
		}
	}
}
