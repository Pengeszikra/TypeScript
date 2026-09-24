// Pipeline implementation coded by OpenAI Codex.

package ast

// IsPipelineExpression was coded by OpenAI Codex.
// A pipeline is a call whose single argument precedes its callee in the source.
func IsPipelineExpression(node *Node) bool {
	return node != nil && node.Kind == KindCallExpression && node.Flags&NodeFlagsPipeline != 0
}

// forEachChild_CallExpression was coded by OpenAI Codex.
// Source-order traversal is required by navigation, binding and parent checks.
func forEachChild_CallExpression(node *CallExpression, v Visitor) bool {
	if IsPipelineExpression(node.AsNode()) {
		return visitNodeList(v, node.Arguments) || visit(v, node.Expression)
	}
	return visit(v, node.Expression) || visit(v, node.QuestionDotToken) ||
		visitNodeList(v, node.TypeArguments) || visitNodeList(v, node.Arguments)
}

// visitEachChild_CallExpression was coded by OpenAI Codex.
func visitEachChild_CallExpression(node *CallExpression, v *NodeVisitor) *Node {
	if IsPipelineExpression(node.AsNode()) {
		arguments := v.visitNodes(node.Arguments)
		expression := v.visitNode(node.Expression)
		return v.Factory.UpdateCallExpression(node, expression, nil, nil, arguments, node.Flags)
	}
	return v.Factory.UpdateCallExpression(node, v.visitNode(node.Expression), v.visitNode(node.QuestionDotToken), v.visitNodes(node.TypeArguments), v.visitNodes(node.Arguments), node.Flags)
}
