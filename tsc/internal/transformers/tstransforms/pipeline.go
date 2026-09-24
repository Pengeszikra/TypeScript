// Pipeline implementation coded by OpenAI Codex.

package tstransforms

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/transformers"
)

// pipelineTransformer was coded by OpenAI Codex.
type pipelineTransformer struct {
	transformers.Transformer
	isolatedInitializer *ast.Node
	inParameter         bool
}

// NewPipelineTransformer was coded by OpenAI Codex.
func NewPipelineTransformer(opts *transformers.TransformOptions) *transformers.Transformer {
	tx := &pipelineTransformer{}
	return tx.NewTransformer(tx.visit, opts.Context)
}

// visit was coded by OpenAI Codex.
// Capture the input before evaluating the callee. Moving the input directly
// into f(input) would evaluate a side-effecting callee before that input.
func (tx *pipelineTransformer) visit(node *ast.Node) *ast.Node {
	// Initializer isolation was coded by OpenAI Codex.
	if node == tx.isolatedInitializer {
		tx.isolatedInitializer = nil
		return tx.visitInitializer(node)
	}
	if node.SubtreeFacts()&ast.SubtreeContainsTypeScript == 0 {
		return node
	}
	if !ast.IsPipelineExpression(node) {
		// Declaration traversal was coded by OpenAI Codex.
		savedParameter := tx.inParameter
		if ast.IsFunctionLike(node) {
			tx.inParameter = false
		} else if node.Kind == ast.KindParameter {
			tx.inParameter = true
		}
		defer func() { tx.inParameter = savedParameter }()
		switch node.Kind {
		case ast.KindParameter, ast.KindPropertyDeclaration:
			return tx.visitWithIsolatedInitializer(node, node.Initializer())
		case ast.KindBindingElement:
			if tx.inParameter {
				return tx.visitWithIsolatedInitializer(node, node.Initializer())
			}
		case ast.KindComputedPropertyName:
			if tx.inParameter {
				return tx.visitWithIsolatedInitializer(node, node.Expression())
			}
		}
		return tx.Visitor().VisitEachChild(node)
	}
	return tx.visitPipeline(node)
}

// visitWithIsolatedInitializer was coded by OpenAI Codex.
func (tx *pipelineTransformer) visitWithIsolatedInitializer(node *ast.Node, initializer *ast.Node) *ast.Node {
	saved := tx.isolatedInitializer
	tx.isolatedInitializer = initializer
	updated := tx.Visitor().VisitEachChild(node)
	tx.isolatedInitializer = saved
	return updated
}

// visitPipeline was coded by OpenAI Codex.
func (tx *pipelineTransformer) visitPipeline(node *ast.Node) *ast.Node {
	call := node.AsCallExpression()
	input := tx.Visitor().VisitNode(call.Arguments.Nodes[0])
	callee := tx.Visitor().VisitNode(call.Expression)
	temp := tx.Factory().NewTempVariable()
	tx.EmitContext().AddVariableDeclaration(temp)
	assignment := tx.Factory().NewAssignmentExpression(temp, input)
	invocation := tx.Factory().NewCallExpression(callee, nil, nil, tx.Factory().NewNodeList([]*ast.Node{temp}), ast.NodeFlagsNone)
	result := tx.Factory().NewCommaExpression(assignment, invocation)
	tx.EmitContext().SetOriginal(result, node)
	tx.EmitContext().SetSourceMapRange(result, node.Loc)
	return result
}

// visitInitializer was coded by OpenAI Codex.
// Fields execute once per instance; parameter defaults have their own scope.
// Keep temporaries local without moving defaults into the function body.
// Arrows retain lexical this, arguments, super and new.target. Neither fields
// nor parameter initializers permit await or yield expressions.
func (tx *pipelineTransformer) visitInitializer(node *ast.Node) *ast.Node {
	tx.EmitContext().StartVariableEnvironment()
	value := tx.visit(node)
	statements := tx.EmitContext().EndVariableEnvironment()
	if len(statements) == 0 {
		return value
	}
	statements = append(statements, tx.Factory().NewReturnStatement(value))
	body := tx.Factory().NewBlock(tx.Factory().NewNodeList(statements), true)
	arrow := tx.Factory().NewArrowFunction(nil, nil, tx.Factory().NewNodeList(nil), nil, nil, tx.Factory().NewToken(ast.KindEqualsGreaterThanToken), body)
	return tx.Factory().NewCallExpression(arrow, nil, nil, tx.Factory().NewNodeList(nil), ast.NodeFlagsNone)
}
