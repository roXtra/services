import jsep from "jsep";

type ExpressionContext = Record<string, unknown>;

const allowedBinaryOperators = new Set(["&&", "||", "==", "!=", "===", "!==", "+", "-", "*", "/", "%", ">", ">=", "<", "<="]);

function isExpressionNode(value: unknown): value is jsep.Expression {
  return typeof value === "object" && value !== null && "type" in value && typeof value.type === "string";
}

function expressionNodeReferencesVariable(node: jsep.Expression, variableName: string): boolean {
  if (node.type === "Identifier") {
    return (node as jsep.Identifier).name === variableName;
  }

  return Object.values(node).some((value) => {
    if (Array.isArray(value)) {
      return value.some((child) => isExpressionNode(child) && expressionNodeReferencesVariable(child, variableName));
    }
    return isExpressionNode(value) && expressionNodeReferencesVariable(value, variableName);
  });
}

export function expressionUsesVariable(expressionTemplate: string, variableName: string): boolean {
  for (const [, expressionSource] of expressionTemplate.matchAll(/\$\{([^}]+)\}/g)) {
    try {
      if (expressionNodeReferencesVariable(jsep(expressionSource.trim()), variableName)) {
        return true;
      }
    } catch {
      continue;
    }
  }
  return false;
}

/** Validate the complete syntax tree and report whether it references an allowed variable. */
function validateExpressionNode(node: jsep.Expression, context: ExpressionContext, allowedVariables: ReadonlySet<string>): boolean {
  switch (node.type) {
    case "Literal": {
      const value = (node as jsep.Literal).value;
      if (value !== null && typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
        throw new Error("Unsupported literal");
      }
      return false;
    }
    case "Identifier": {
      const name = (node as jsep.Identifier).name;
      if (!Object.hasOwn(context, name)) {
        throw new Error(`Unknown identifier: ${name}`);
      }
      return allowedVariables.has(name);
    }
    case "MemberExpression": {
      const member = node as jsep.MemberExpression;
      if (!member.computed || member.property.type !== "Literal") {
        throw new Error("Field access must use a literal key");
      }
      const property = (member.property as jsep.Literal).value;
      if ((typeof property !== "string" && typeof property !== "number") || ["__proto__", "prototype", "constructor"].includes(String(property))) {
        throw new Error("Unsafe field access");
      }
      return validateExpressionNode(member.object, context, allowedVariables);
    }
    case "UnaryExpression": {
      const unary = node as jsep.UnaryExpression;
      if (!["!", "+", "-"].includes(unary.operator)) {
        throw new Error(`Unsupported unary operator: ${unary.operator}`);
      }
      return validateExpressionNode(unary.argument, context, allowedVariables);
    }
    case "BinaryExpression": {
      const binary = node as jsep.BinaryExpression;
      if (!allowedBinaryOperators.has(binary.operator)) {
        throw new Error(`Unsupported operator: ${binary.operator}`);
      }
      const leftReferencesVariable = validateExpressionNode(binary.left, context, allowedVariables);
      const rightReferencesVariable = validateExpressionNode(binary.right, context, allowedVariables);
      return leftReferencesVariable || rightReferencesVariable;
    }
    case "ConditionalExpression": {
      const conditional = node as jsep.ConditionalExpression;
      const testReferencesVariable = validateExpressionNode(conditional.test, context, allowedVariables);
      const consequentReferencesVariable = validateExpressionNode(conditional.consequent, context, allowedVariables);
      const alternateReferencesVariable = validateExpressionNode(conditional.alternate, context, allowedVariables);
      return testReferencesVariable || consequentReferencesVariable || alternateReferencesVariable;
    }
    default:
      throw new Error(`Unsupported expression syntax: ${node.type}`);
  }
}

function evaluateExpressionNode(node: jsep.Expression, context: ExpressionContext): unknown {
  switch (node.type) {
    case "Literal":
      return (node as jsep.Literal).value;
    case "Identifier":
      return context[(node as jsep.Identifier).name];
    case "MemberExpression": {
      const member = node as jsep.MemberExpression;
      const object = evaluateExpressionNode(member.object, context);
      const property = (member.property as jsep.Literal).value;
      if ((typeof property !== "string" && typeof property !== "number") || typeof object !== "object" || object === null) {
        throw new Error("Invalid field access");
      }
      const propertyKey = String(property);
      return Object.hasOwn(object, propertyKey) ? (object as Record<string, unknown>)[propertyKey] : undefined;
    }
    case "UnaryExpression": {
      const unary = node as jsep.UnaryExpression;
      const argument = evaluateExpressionNode(unary.argument, context);
      if (unary.operator === "!") return !argument;
      if (typeof argument === "number" && unary.operator === "-") return -argument;
      if (typeof argument === "number" && unary.operator === "+") return argument;
      throw new Error(`Unsupported unary operator: ${unary.operator}`);
    }
    case "BinaryExpression": {
      const binary = node as jsep.BinaryExpression;
      const left = evaluateExpressionNode(binary.left, context);
      if (binary.operator === "&&") return left ? evaluateExpressionNode(binary.right, context) : left;
      if (binary.operator === "||") return left ? left : evaluateExpressionNode(binary.right, context);

      const right = evaluateExpressionNode(binary.right, context);
      switch (binary.operator) {
        case "==":
          return areLooselyEqual(left, right);
        case "!=":
          return !areLooselyEqual(left, right);
        case "===":
          return left === right;
        case "!==":
          return left !== right;
        case "+":
          if (typeof left === "string" || typeof right === "string") {
            return expressionValueToString(left) + expressionValueToString(right);
          }
          if (typeof left === "number" && typeof right === "number") return left + right;
          break;
        case "-":
        case "*":
        case "/":
        case "%":
          if (typeof left === "number" && typeof right === "number") {
            if (binary.operator === "-") return left - right;
            if (binary.operator === "*") return left * right;
            if (binary.operator === "/") return left / right;
            return left % right;
          }
          break;
        case ">":
        case ">=":
        case "<":
        case "<=":
          if (typeof left === "number" && typeof right === "number") {
            if (binary.operator === ">") return left > right;
            if (binary.operator === ">=") return left >= right;
            if (binary.operator === "<") return left < right;
            return left <= right;
          }
          if (typeof left === "string" && typeof right === "string") {
            if (binary.operator === ">") return left > right;
            if (binary.operator === ">=") return left >= right;
            if (binary.operator === "<") return left < right;
            return left <= right;
          }
          break;
      }
      throw new Error(`Unsupported operator or operand types: ${binary.operator}`);
    }
    case "ConditionalExpression": {
      const conditional = node as jsep.ConditionalExpression;
      const test = evaluateExpressionNode(conditional.test, context);
      return evaluateExpressionNode(test ? conditional.consequent : conditional.alternate, context);
    }
    default:
      throw new Error(`Unsupported expression syntax: ${node.type}`);
  }
}

function expressionValueToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  throw new Error("Only primitive values can be converted to text");
}

function areLooselyEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if ((left === null && right === undefined) || (left === undefined && right === null)) return true;
  if (typeof left === "boolean") return areLooselyEqual(Number(left), right);
  if (typeof right === "boolean") return areLooselyEqual(left, Number(right));
  if (typeof left === "number" && typeof right === "string") return left === Number(right);
  if (typeof left === "string" && typeof right === "number") return Number(left) === right;
  return false;
}

export function evaluateExpression(source: string, context: ExpressionContext, allowedVariables: ReadonlySet<string> = new Set()): unknown {
  const ast = jsep(source);
  const referencesAllowedVariable = validateExpressionNode(ast, context, allowedVariables);
  if (allowedVariables.size > 0 && !referencesAllowedVariable) {
    throw new Error(`Expression placeholder must reference at least one of: ${Array.from(allowedVariables).join(", ")}`);
  }
  return evaluateExpressionNode(ast, context);
}

export function formatExpressionValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === undefined || value === null) return "";
  throw new Error("Expression result must be a primitive value");
}
