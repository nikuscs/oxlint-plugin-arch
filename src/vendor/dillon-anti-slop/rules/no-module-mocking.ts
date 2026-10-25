import { defineRule } from "@oxlint/plugins";
import { mockingApiPatternsAssert, optionsFirst } from "../../../utils/index.ts";
import type { ESTree, Scope, SourceCode, Variable } from "@oxlint/plugins";

type TestFramework = "vi" | "jest";

interface DeniedApi {
  api: string;
  message?: string;
}

interface NoModuleMockingOptions {
  deny?: (string | DeniedApi)[];
  allow?: string[];
  checkDestructured?: boolean;
}

const moduleMockMethods = new Set(["doMock", "mock", "unstable_mockModule"]);

const defaultDeny: DeniedApi[] = [
  { api: "*.mock" },
  { api: "*.doMock" },
  { api: "*.unstable_mockModule" },
];

function resolveVariable(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference,
): Variable | null {
  let scope: Scope | null = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== undefined) return variable;
    scope = scope.upper;
  }
  return null;
}

function importedName(node: ESTree.Node): string | null {
  if (node.type !== "ImportSpecifier") return null;
  return node.imported.type === "Identifier"
    ? node.imported.name
    : node.imported.value;
}

function testFramework(
  sourceCode: SourceCode,
  expression: ESTree.Expression,
): TestFramework | null {
  if (expression.type !== "Identifier") return null;
  const name =
    expression.name === "vi" || expression.name === "jest"
      ? expression.name
      : null;
  if (name !== null && sourceCode.isGlobalReference(expression)) return name;

  const variable = resolveVariable(sourceCode, expression);
  if (variable === null || variable.defs.length === 0) return name;
  for (const definition of variable.defs) {
    if (
      definition.type !== "ImportBinding" ||
      definition.parent?.type !== "ImportDeclaration"
    ) {
      continue;
    }
    const source = definition.parent.source.value;
    const imported = importedName(definition.node);
    if (source === "vitest" && imported === "vi") return "vi";
    if (source === "@jest/globals" && imported === "jest") return "jest";
  }
  return null;
}

// Why: `vi["mock"]`, `{ "spyOn": spy }` and `{ ["spyOn"]: spy }` all name the method with a string.
function propertyName(
  key: ESTree.Expression | ESTree.PrivateIdentifier,
  computed: boolean,
): string | null {
  if (key.type === "Literal" && typeof key.value === "string") return key.value;
  return !computed && key.type === "Identifier" ? key.name : null;
}

function calledApi(
  sourceCode: SourceCode,
  callee: ESTree.Expression,
): string | null {
  if (callee.type !== "MemberExpression") return null;
  const framework = testFramework(sourceCode, callee.object);
  if (framework === null) return null;
  const method = propertyName(callee.property, callee.computed);
  return method === null ? null : `${framework}.${method}`;
}

// Why: `const { spyOn: spy } = vi` hides the framework object from the call site.
function destructuredApi(
  sourceCode: SourceCode,
  callee: ESTree.Expression,
): string | null {
  if (callee.type !== "Identifier") return null;
  const definition = resolveVariable(sourceCode, callee)?.defs[0];
  // Why: only `const` keeps the framework method; `let`/`var` can be replaced.
  if (
    definition?.parent?.type !== "VariableDeclaration" ||
    definition.parent.kind !== "const"
  )
    return null;
  const declarator = definition.node;
  if (
    declarator?.type !== "VariableDeclarator" ||
    declarator.id.type !== "ObjectPattern" ||
    declarator.init === null
  )
    return null;
  const framework = testFramework(sourceCode, declarator.init);
  if (framework === null) return null;
  for (const property of declarator.id.properties) {
    if (property.type !== "Property") continue;
    const binding =
      property.value.type === "AssignmentPattern"
        ? property.value.left
        : property.value;
    if (binding.type !== "Identifier" || binding.name !== callee.name)
      continue;
    const method = propertyName(property.key, property.computed);
    return method === null ? null : `${framework}.${method}`;
  }
  return null;
}

// Why: a computed name such as `vi["mock.cached"]` keeps its dots in the method.
function apiParts(api: string): [string, string] {
  const dot = api.indexOf(".");
  return [api.slice(0, dot), api.slice(dot + 1)];
}

// Why: patterns are `<vi|jest|*>.<method|*>`, and a bare `*` matches every API.
function apiMatches(pattern: string, api: string): boolean {
  if (pattern === "*") return true;
  const [patternFramework, patternMethod] = apiParts(pattern);
  const [framework, method] = apiParts(api);
  return (
    (patternFramework === "*" || patternFramework === framework) &&
    (patternMethod === "*" || patternMethod === method)
  );
}

/**
 * Disallow Vitest and Jest module mocking, plus any other configured test-double APIs.
 *
 * Example: `vi.mock('./mailer')` fails; with `deny: ['*.spyOn']`,
 * `vi.spyOn(mailer, 'send')` fails too. `checkDestructured` also catches
 * `const { spyOn } = vi; spyOn(mailer, 'send')`.
 */
export const noModuleMockingRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Vitest and Jest module mocking; tests must replace dependencies through real interfaces.",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          deny: {
            type: "array",
            items: {
              anyOf: [
                { type: "string" },
                {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    api: { type: "string" },
                    message: { type: "string" },
                  },
                  required: ["api"],
                },
              ],
            },
          },
          allow: { type: "array", items: { type: "string" } },
          checkDestructured: { type: "boolean" },
        },
      },
    ],
    messages: {
      moduleMock:
        "Replace module mocking with dependency injection through a real interface, service layer, or faithful test implementation.",
      testDouble:
        "Replace {{api}} with dependency injection through a real interface, service layer, or faithful test implementation.",
      custom: "{{message}}",
    },
  },
  createOnce(context) {
    let deny: DeniedApi[] = [];
    let allow: string[] = [];
    let checkDestructured = false;
    return {
      before() {
        const options = optionsFirst<NoModuleMockingOptions>(context, {});
        deny = (options.deny ?? defaultDeny).map((entry) =>
          typeof entry === "string" ? { api: entry } : entry,
        );
        allow = options.allow ?? [];
        checkDestructured = options.checkDestructured ?? false;
        mockingApiPatternsAssert([...deny.map((entry) => entry.api), ...allow]);
      },
      CallExpression(node) {
        if (
          node.callee.type === "Super" ||
          node.callee.type === "V8IntrinsicExpression"
        )
          return;
        const api =
          calledApi(context.sourceCode, node.callee) ??
          (checkDestructured
            ? destructuredApi(context.sourceCode, node.callee)
            : null);
        if (api === null) return;
        if (allow.some((pattern) => apiMatches(pattern, api))) return;
        const denied = deny.find((entry) => apiMatches(entry.api, api));
        if (denied === undefined) return;
        if (denied.message !== undefined) {
          context.report({
            node,
            messageId: "custom",
            data: { message: denied.message },
          });
          return;
        }
        context.report({
          node,
          messageId: moduleMockMethods.has(apiParts(api)[1])
            ? "moduleMock"
            : "testDouble",
          data: { api },
        });
      },
    };
  },
});
