// Pipeline acceptance tests coded by OpenAI Codex.
package testrunner

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"

	// Repository JSON wrapper selected by OpenAI Codex to follow the lint rules.
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/repo"
	"github.com/microsoft/TypeScript/tsc/internal/testutil/harnessutil"
)

// These are behavioral acceptance assertions, not syntax-error snapshots.
// Controls exercise the same harness with independently written ordinary calls.
// Do not accept parser errors as the expected pipeline behavior.
// TestPipeline was coded by OpenAI Codex.
func TestPipeline(t *testing.T) {
	t.Parallel()
	runPipelineSuite(t, false)
}

// TestPipelineControls was coded by OpenAI Codex.
func TestPipelineControls(t *testing.T) {
	t.Parallel()
	runPipelineSuite(t, true)
}

// pipelineCase was coded by OpenAI Codex.
type pipelineCase struct {
	Name                string `json:"name"`
	TSXOnly             bool   `json:"tsxOnly"`
	ErrorCode           int32  `json:"errorCode"`
	Result              string `json:"result"`
	DeclarationContains string `json:"declarationContains"`
}

// pipelineFixture was coded by OpenAI Codex.
func pipelineFixture(t *testing.T, parts ...string) string {
	t.Helper()
	path := filepath.Join(append([]string{repo.TestDataPath(), "pipeline"}, parts...)...)
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return string(data)
}

// runPipelineSuite was coded by OpenAI Codex.
func runPipelineSuite(t *testing.T, controls bool) {
	var cases []pipelineCase
	if err := json.Unmarshal([]byte(pipelineFixture(t, "cases.json")), &cases); err != nil {
		t.Fatal(err)
	}
	if len(cases) == 0 {
		t.Fatal("empty pipeline test manifest")
	}
	seen := make(map[string]bool)
	for _, tc := range cases {
		if tc.Name == "" || seen[tc.Name] {
			t.Fatalf("missing or duplicate case name: %q", tc.Name)
		}
		seen[tc.Name] = true
		formats := []string{"ts", "tsx"}
		if tc.TSXOnly {
			formats = []string{"tsx"}
		}
		for _, format := range formats {
			modes := []string{"react"}
			if tc.TSXOnly {
				modes = []string{"preserve", "react", "react-jsx", "react-jsxdev"}
			}
			for _, jsx := range modes {
				for _, target := range []string{"es2015", "es2022"} {
					t.Run(fmt.Sprintf("%s/%s/%s/%s", tc.Name, format, jsx, target), func(t *testing.T) {
						// Subtest parallelism coded by OpenAI Codex to match the parent suites.
						t.Parallel()
						runPipelineCase(t, tc, controls, format, jsx, target)
					})
				}
			}
		}
	}
}

// runPipelineCase was coded by OpenAI Codex.
func runPipelineCase(t *testing.T, tc pipelineCase, controls bool, format, jsx, target string) {
	t.Helper()
	variant, fixtureExt := "input", "ts"
	if controls {
		variant = "control"
	}
	if tc.TSXOnly {
		fixtureExt = "tsx"
	}
	source := pipelineFixture(t, "prelude.ts")
	if tc.TSXOnly {
		source += pipelineFixture(t, "jsx-prelude.ts")
	}
	source += pipelineFixture(t, tc.Name, variant+"."+fixtureExt)
	if !controls && !strings.Contains(source, "|>") {
		t.Fatal("pipeline fixture does not contain a pipeline")
	}
	filename := "/pipeline/main." + format
	config := harnessutil.TestConfiguration{
		"strict": "true", "target": target, "module": "node16",
		"moduleresolution": "node16", "jsx": jsx,
		"declaration": "true", "sourcemap": "true", "inlineSources": "true",
		"noemitonerror": "true", "outdir": "/pipeline/out",
		"types": "", "skiplibcheck": "false",
	}
	other := []*harnessutil.TestFile{
		{UnitName: "/pipeline/package.json", Content: `{"type":"commonjs"}`},
	}
	if jsx == "react-jsx" || jsx == "react-jsxdev" {
		config["jsximportsource"] = "pipeline-jsx"
		other = append(other,
			&harnessutil.TestFile{UnitName: "/pipeline/node_modules/pipeline-jsx/package.json", Content: `{"name":"pipeline-jsx","exports":{"./jsx-runtime":"./jsx-runtime.d.ts","./jsx-dev-runtime":"./jsx-dev-runtime.d.ts"}}`},
			&harnessutil.TestFile{UnitName: "/pipeline/node_modules/pipeline-jsx/jsx-runtime.d.ts", Content: pipelineFixture(t, "jsx-runtime.d.ts")},
			&harnessutil.TestFile{UnitName: "/pipeline/node_modules/pipeline-jsx/jsx-dev-runtime.d.ts", Content: pipelineFixture(t, "jsx-runtime.d.ts")},
		)
	}
	result := harnessutil.CompileFiles(t,
		[]*harnessutil.TestFile{{UnitName: filename, Content: source}},
		other, config, nil, "/pipeline", nil,
	)

	if tc.ErrorCode != 0 {
		start := strings.Index(source, "/*error*/")
		end := strings.Index(source, "/*end*/")
		if start < 0 || end <= start {
			t.Fatal("negative fixture needs an /*error*/.../*end*/ source range")
		}
		if len(result.Diagnostics) != 1 {
			t.Fatalf("want exactly one TS%d diagnostic, got %d: %v", tc.ErrorCode, len(result.Diagnostics), result.Diagnostics)
		}
		d := result.Diagnostics[0]
		if d.Code() != tc.ErrorCode {
			t.Fatalf("want TS%d, got TS%d: %s (parser errors are not valid substitutes)", tc.ErrorCode, d.Code(), d.String())
		}
		if d.File() == nil || d.File().FileName() != filename || d.Pos() < start+len("/*error*/") || d.End() > end || d.Len() <= 0 {
			t.Fatalf("diagnostic must point inside the marked original expression [%d,%d), got %v at [%d,%d)", start, end, d.File(), d.Pos(), d.End())
		}
		if result.JS.Size() != 0 || result.DTS.Size() != 0 {
			t.Fatal("noEmitOnError must prevent output for an invalid pipeline")
		}
		return
	}

	if len(result.Diagnostics) != 0 {
		t.Fatalf("want a well-typed program, got %d diagnostic(s): %v", len(result.Diagnostics), result.Diagnostics)
	}
	if result.JS.Size() != 1 || result.DTS.Size() != 1 || result.Maps.Size() != 1 {
		t.Fatalf("want JS/JSX, declaration and source map; got %d/%d/%d", result.JS.Size(), result.DTS.Size(), result.Maps.Size())
	}
	var output *harnessutil.TestFile
	for file := range result.JS.Values() {
		output = file
	}
	for declaration := range result.DTS.Values() {
		if !strings.Contains(declaration.Content, "result") {
			t.Fatal("exported result missing from declaration output")
		}
		if tc.DeclarationContains != "" && !strings.Contains(declaration.Content, tc.DeclarationContains) {
			t.Fatalf("declaration must preserve the inferred result type %q, got:\n%s", tc.DeclarationContains, declaration.Content)
		}
	}
	for file := range result.Maps.Values() {
		var sourceMap struct {
			Version        int      `json:"version"`
			Sources        []string `json:"sources"`
			SourcesContent []string `json:"sourcesContent"`
			Mappings       string   `json:"mappings"`
		}
		if err := json.Unmarshal([]byte(file.Content), &sourceMap); err != nil {
			t.Fatal(err)
		}
		if sourceMap.Version != 3 || sourceMap.Mappings == "" || len(sourceMap.Sources) != 1 || !strings.HasSuffix(sourceMap.Sources[0], "main."+format) || len(sourceMap.SourcesContent) != 1 || sourceMap.SourcesContent[0] != source {
			t.Fatal("source map must reference and embed the original TS/TSX source")
		}
	}
	if jsx == "preserve" {
		if !strings.HasSuffix(output.UnitName, ".jsx") || !strings.Contains(output.Content, "<") {
			t.Fatal("jsx:preserve must retain JSX and produce a .jsx file")
		}
		// Node cannot execute preserved JSX. Parse the output with the independent
		// stock TS 6 parser: it accepts JSX but rejects any unlowered pipeline.
		checkPreservedPipelineOutput(t, output.Content)
		return
	}
	runPipelineJavaScript(t, output.Content, tc.Result)
}

// pipelineNode was coded by OpenAI Codex.
func pipelineNode(t *testing.T) string {
	t.Helper()
	node, err := exec.LookPath("node")
	if err != nil {
		t.Fatal("Node.js is required for pipeline emission/runtime assertions; do not skip them")
	}
	return node
}

// checkPreservedPipelineOutput was coded by OpenAI Codex.
func checkPreservedPipelineOutput(t *testing.T, source string) {
	t.Helper()
	// Use the repository's pinned stock TypeScript dev dependency, never the fork.
	script := `const ts = require("typescript");
const fs = require("node:fs");
const file = ts.createSourceFile("output.jsx", fs.readFileSync(0, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
if (file.parseDiagnostics.length) { console.error(file.parseDiagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, "\n")).join("\n")); process.exitCode = 1; }`
	ctx, cancel := context.WithTimeout(t.Context(), 15*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, pipelineNode(t), "-e", script)
	cmd.Dir = filepath.Dir(filepath.Dir(repo.TestDataPath()))
	cmd.Stdin = strings.NewReader(source)
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("preserved JSX must parse without pipeline syntax: %v\n%s", err, out)
	}
}

// runPipelineJavaScript was coded by OpenAI Codex.
func runPipelineJavaScript(t *testing.T, source, expected string) {
	t.Helper()
	dir := t.TempDir()
	write := func(name, content string) {
		t.Helper()
		path := filepath.Join(dir, name)
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	write("main.cjs", source)
	write("node_modules/pipeline-jsx/jsx-runtime.js", pipelineFixture(t, "jsx-runtime.cjs"))
	write("node_modules/pipeline-jsx/jsx-dev-runtime.js", pipelineFixture(t, "jsx-runtime.cjs"))
	ctx, cancel := context.WithTimeout(t.Context(), 15*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, pipelineNode(t), "-e", `Promise.resolve(require("./main.cjs").result).then(value => process.stdout.write(JSON.stringify(value)), error => { console.error(error); process.exitCode = 1; });`)
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("emitted JavaScript failed: %v\n%s", err, out)
	}
	var got, want any
	if err := json.Unmarshal(out, &got); err != nil {
		t.Fatalf("result is not JSON: %v\n%s", err, out)
	}
	if err := json.Unmarshal([]byte(expected), &want); err != nil {
		t.Fatalf("invalid expected result in manifest: %v", err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("runtime result mismatch\nwant: %s\n got: %s", expected, out)
	}
}
