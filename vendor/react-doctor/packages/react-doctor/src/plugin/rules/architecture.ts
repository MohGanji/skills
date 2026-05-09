import {
  BOOLEAN_PROP_THRESHOLD,
  GENERIC_EVENT_SUFFIXES,
  GIANT_COMPONENT_LINE_THRESHOLD,
  RENDER_FUNCTION_PATTERN,
  RENDER_PROP_PROLIFERATION_THRESHOLD,
} from "../constants.js";
import {
  isComponentAssignment,
  isComponentDeclaration,
  isUppercaseName,
  walkAst,
} from "../helpers.js";
import type { EsTreeNode, Rule, RuleContext } from "../types.js";

export const noGenericHandlerNames: Rule = {
  create: (context: RuleContext) => ({
    JSXAttribute(node: EsTreeNode) {
      if (node.name?.type !== "JSXIdentifier" || !node.name.name.startsWith("on")) return;
      if (!node.value || node.value.type !== "JSXExpressionContainer") return;

      const eventSuffix = node.name.name.slice(2);
      if (!GENERIC_EVENT_SUFFIXES.has(eventSuffix)) return;

      const mirroredHandlerName = `handle${eventSuffix}`;
      const expression = node.value.expression;
      if (expression?.type === "Identifier" && expression.name === mirroredHandlerName) {
        context.report({
          node,
          message: `Non-descriptive handler name "${expression.name}" — name should describe what it does, not when it runs`,
        });
      }
    },
  }),
};

export const noGiantComponent: Rule = {
  create: (context: RuleContext) => {
    const reportOversizedComponent = (
      nameNode: EsTreeNode,
      componentName: string,
      bodyNode: EsTreeNode,
    ): void => {
      if (!bodyNode.loc) return;
      const lineCount = bodyNode.loc.end.line - bodyNode.loc.start.line + 1;
      if (lineCount > GIANT_COMPONENT_LINE_THRESHOLD) {
        context.report({
          node: nameNode,
          message: `Component "${componentName}" is ${lineCount} lines — consider breaking it into smaller focused components`,
        });
      }
    };

    return {
      FunctionDeclaration(node: EsTreeNode) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        reportOversizedComponent(node.id, node.id.name, node);
      },
      VariableDeclarator(node: EsTreeNode) {
        if (!isComponentAssignment(node)) return;
        reportOversizedComponent(node.id, node.id.name, node.init);
      },
    };
  },
};

export const noRenderInRender: Rule = {
  create: (context: RuleContext) => ({
    JSXExpressionContainer(node: EsTreeNode) {
      const expression = node.expression;
      if (expression?.type !== "CallExpression") return;

      let calleeName: string | null = null;
      if (expression.callee?.type === "Identifier") {
        calleeName = expression.callee.name;
      } else if (
        expression.callee?.type === "MemberExpression" &&
        expression.callee.property?.type === "Identifier"
      ) {
        calleeName = expression.callee.property.name;
      }

      if (calleeName && RENDER_FUNCTION_PATTERN.test(calleeName)) {
        context.report({
          node: expression,
          message: `Inline render function "${calleeName}()" — extract to a separate component for proper reconciliation`,
        });
      }
    },
  }),
};

export const noNestedComponentDefinition: Rule = {
  create: (context: RuleContext) => {
    const componentStack: string[] = [];

    return {
      FunctionDeclaration(node: EsTreeNode) {
        if (!isComponentDeclaration(node)) return;
        if (componentStack.length > 0) {
          context.report({
            node: node.id,
            message: `Component "${node.id.name}" defined inside "${componentStack[componentStack.length - 1]}" — creates new instance every render, destroying state`,
          });
        }
        componentStack.push(node.id.name);
      },
      "FunctionDeclaration:exit"(node: EsTreeNode) {
        if (isComponentDeclaration(node)) componentStack.pop();
      },
      VariableDeclarator(node: EsTreeNode) {
        if (!isComponentAssignment(node)) return;
        if (componentStack.length > 0) {
          context.report({
            node: node.id,
            message: `Component "${node.id.name}" defined inside "${componentStack[componentStack.length - 1]}" — creates new instance every render, destroying state`,
          });
        }
        componentStack.push(node.id.name);
      },
      "VariableDeclarator:exit"(node: EsTreeNode) {
        if (isComponentAssignment(node)) componentStack.pop();
      },
    };
  },
};

const BOOLEAN_PROP_PREFIX_PATTERN = /^(?:is|has|should|can|show|hide|enable|disable|with)[A-Z]/;

const collectBooleanLikePropsFromBody = (
  componentBody: EsTreeNode | undefined,
  propsParamName: string,
): Set<string> => {
  const found = new Set<string>();
  if (!componentBody) return found;
  walkAst(componentBody, (child: EsTreeNode) => {
    if (child.type !== "MemberExpression") return;
    if (child.computed) return;
    if (child.object?.type !== "Identifier") return;
    if (child.object.name !== propsParamName) return;
    if (child.property?.type !== "Identifier") return;
    if (!BOOLEAN_PROP_PREFIX_PATTERN.test(child.property.name)) return;
    found.add(child.property.name);
  });
  return found;
};

// HACK: components with many boolean props (isLoading, hasIcon, showHeader,
// canEdit...) typically signal "many UI variants jammed into one component"
// — a sign that the component should be split via composition (compound
// components, explicit variant components). We use a name-based heuristic
// because TypeScript types aren't visible at this AST layer. Detects
// both destructured form (`{ isPrimary, hasIcon }`) and non-destructured
// (`function Foo(props) { props.isPrimary }`) by walking member-access
// patterns on the parameter binding.
export const noManyBooleanProps: Rule = {
  create: (context: RuleContext) => {
    const reportIfMany = (
      booleanLikePropNames: string[],
      componentName: string,
      reportNode: EsTreeNode,
    ): void => {
      if (booleanLikePropNames.length >= BOOLEAN_PROP_THRESHOLD) {
        context.report({
          node: reportNode,
          message: `Component "${componentName}" takes ${booleanLikePropNames.length} boolean-like props (${booleanLikePropNames.slice(0, 3).join(", ")}…) — consider compound components or explicit variants instead of stacking flags`,
        });
      }
    };

    const checkComponent = (
      param: EsTreeNode | undefined,
      body: EsTreeNode | undefined,
      componentName: string,
      reportNode: EsTreeNode,
    ): void => {
      if (!param) return;
      if (param.type === "ObjectPattern") {
        const booleanLikePropNames: string[] = [];
        for (const property of param.properties ?? []) {
          if (property.type !== "Property") continue;
          const keyName = property.key?.type === "Identifier" ? property.key.name : null;
          if (!keyName) continue;
          if (BOOLEAN_PROP_PREFIX_PATTERN.test(keyName)) {
            booleanLikePropNames.push(keyName);
          }
        }
        reportIfMany(booleanLikePropNames, componentName, reportNode);
        return;
      }
      if (param.type === "Identifier") {
        const accessed = collectBooleanLikePropsFromBody(body, param.name);
        reportIfMany([...accessed], componentName, reportNode);
      }
    };

    return {
      FunctionDeclaration(node: EsTreeNode) {
        if (!isComponentDeclaration(node)) return;
        checkComponent(node.params?.[0], node.body, node.id.name, node.id);
      },
      VariableDeclarator(node: EsTreeNode) {
        if (!isComponentAssignment(node)) return;
        checkComponent(node.init?.params?.[0], node.init?.body, node.id.name, node.id);
      },
    };
  },
};

// HACK: React 19+ deprecated `forwardRef` (refs are now regular props on
// function components) and `useContext` (replaced by the more flexible
// `use()`). Catches both named imports (`import { forwardRef } from "react"`)
// AND member access on namespace/default imports (`React.forwardRef`,
// `React.useContext` after `import React from "react"` or
// `import * as React from "react"`).
//
// Stored as a Map (not a plain object) because plain-object lookups inherit
// from `Object.prototype` — `messages["constructor"]` returns the native
// `Object` function, which is truthy and would silently false-positive on
// `import { constructor } from "react"` or `React.toString()`. Maps return
// `undefined` for missing keys with no prototype fall-through.
const REACT_19_DEPRECATED_MESSAGES = new Map<string, string>([
  [
    "forwardRef",
    "forwardRef is no longer needed on React 19+ — refs are regular props on function components; remove forwardRef and pass ref directly",
  ],
  [
    "useContext",
    "useContext is superseded by `use()` on React 19+ — `use()` reads context conditionally inside hooks, branches, and loops; switch to `import { use } from 'react'`",
  ],
]);

interface DeprecatedReactImportRuleOptions {
  /** The exact `import "..."` source string this rule watches. */
  source: string;
  /** Per-imported-name message dictionary. Exact-match lookup. */
  messages: ReadonlyMap<string, string>;
  /**
   * Optional extra ImportDeclaration handler invoked BEFORE the standard
   * source check — used by the react-dom rule to flag every import from
   * `react-dom/test-utils` (whole entry point gone in React 19).
   * Return `true` to mark "handled, skip the standard branch".
   */
  handleExtraSource?: (node: EsTreeNode, context: RuleContext) => boolean;
}

// HACK: shared scaffolding for "report deprecated React-package imports".
// Both `noReact19DeprecatedApis` (for `react`) and
// `noReactDomDeprecatedApis` (for `react-dom`) want the same shape:
//   - bind namespace/default imports of the source to a Set
//   - on ImportSpecifier, look the imported name up in a message map
//   - on MemberExpression off a tracked binding, look the property up
// Hoisting the pattern keeps the two call sites tiny and means future
// React deprecations (e.g. a `react/jsx-runtime` rule) need just one
// new factory call.
const createDeprecatedReactImportRule = ({
  source,
  messages,
  handleExtraSource,
}: DeprecatedReactImportRuleOptions): Rule => ({
  create: (context: RuleContext) => {
    const namespaceBindings = new Set<string>();

    return {
      ImportDeclaration(node: EsTreeNode) {
        const sourceValue = node.source?.value;
        if (typeof sourceValue !== "string") return;
        if (handleExtraSource?.(node, context)) return;
        if (sourceValue !== source) return;

        for (const specifier of node.specifiers ?? []) {
          if (specifier.type === "ImportSpecifier") {
            const importedName = specifier.imported?.name;
            if (!importedName) continue;
            const message = messages.get(importedName);
            if (message) context.report({ node: specifier, message });
            continue;
          }
          if (
            specifier.type === "ImportDefaultSpecifier" ||
            specifier.type === "ImportNamespaceSpecifier"
          ) {
            const localName = specifier.local?.name;
            if (localName) namespaceBindings.add(localName);
          }
        }
      },
      MemberExpression(node: EsTreeNode) {
        if (namespaceBindings.size === 0) return;
        if (node.computed) return;
        if (node.object?.type !== "Identifier") return;
        if (!namespaceBindings.has(node.object.name)) return;
        if (node.property?.type !== "Identifier") return;
        const message = messages.get(node.property.name);
        if (message) context.report({ node, message });
      },
    };
  },
});

export const noReact19DeprecatedApis: Rule = createDeprecatedReactImportRule({
  source: "react",
  messages: REACT_19_DEPRECATED_MESSAGES,
});

const RENDER_PROP_PATTERN = /^render[A-Z]/;

// HACK: render-prop proliferation (`<Foo renderHeader={…} renderFooter={…}
// renderActions={…} />`) is the smell — a single render-prop is often
// the legitimate library API (MUI Autocomplete's `renderInput`, FlatList's
// `renderItem`, react-hook-form's Controller `render`, etc.) and we
// shouldn't fire on those. Instead we flag the COMPOUND case: when a
// single element receives 3 or more `render*` props, that's the smell
// of "many slots cobbled together where compound components or
// `children` would be cleaner".
export const noRenderPropChildren: Rule = {
  create: (context: RuleContext) => ({
    JSXOpeningElement(node: EsTreeNode) {
      const renderPropAttrs: Array<{ name: string; node: EsTreeNode }> = [];
      for (const attr of node.attributes ?? []) {
        if (attr.type !== "JSXAttribute") continue;
        if (attr.name?.type !== "JSXIdentifier") continue;
        const name = attr.name.name;
        if (!RENDER_PROP_PATTERN.test(name)) continue;
        renderPropAttrs.push({ name, node: attr });
      }
      if (renderPropAttrs.length < RENDER_PROP_PROLIFERATION_THRESHOLD) return;

      const propList = renderPropAttrs
        .slice(0, 3)
        .map((entry) => entry.name)
        .join(", ");
      context.report({
        node: renderPropAttrs[0].node,
        message: `${renderPropAttrs.length} render-prop slots on the same element (${propList}…) — collapse into compound subcomponents or \`children\` so consumers don't need to know about every customization point`,
      });
    },
  }),
};

const HOOK_OBJECTS_WITH_METHODS = new Map<string, Set<string>>([
  ["useRouter", new Set(["push", "replace", "back", "forward", "refresh", "prefetch"])],
  [
    "useNavigation",
    new Set(["navigate", "push", "goBack", "popToTop", "reset", "replace", "dispatch"]),
  ],
  ["useSearchParams", new Set(["get", "getAll", "has", "set"])],
]);

// HACK: O(1) lookup. Indexes top-level `const x = useFooBar(...)`
// declarations once per component on enter, so subsequent
// MemberExpression visitors don't re-walk the whole body for every
// access.
const buildHookBindingMap = (componentBody: EsTreeNode): Map<string, string> => {
  const result = new Map<string, string>();
  if (componentBody?.type !== "BlockStatement") return result;
  for (const statement of componentBody.body ?? []) {
    if (statement.type !== "VariableDeclaration") continue;
    for (const declarator of statement.declarations ?? []) {
      if (declarator.id?.type !== "Identifier") continue;
      if (declarator.init?.type !== "CallExpression") continue;
      const callee = declarator.init.callee;
      if (callee?.type !== "Identifier") continue;
      result.set(declarator.id.name, callee.name);
    }
  }
  return result;
};

// HACK: React Compiler memoizes inside a component based on stable
// reference equality of *destructured* values. `router.push("/x")`
// reads `push` off the hook return on every render, which the compiler
// can't memoize as cleanly as a destructured `const { push } = useRouter()`.
// The destructured form also makes the dependency graph obvious — if
// you only need `push`, the compiler doesn't need to track all of
// `router`. This is a soft signal even without React Compiler enabled
// (it makes intent clearer and reduces accidental capture).
//
// Heuristic: `router.push(...)` (or any of the canonical hook objects)
// where `router` is bound to a `useRouter()` call in the same component.
// We don't fire when the binding is destructured already.
export const reactCompilerDestructureMethod: Rule = {
  create: (context: RuleContext) => {
    const hookBindingMapStack: Array<Map<string, string>> = [];

    const isComponent = (node: EsTreeNode): boolean => {
      if (node.type === "FunctionDeclaration") {
        return Boolean(node.id?.name && isUppercaseName(node.id.name));
      }
      if (node.type === "VariableDeclarator") {
        return isComponentAssignment(node);
      }
      return false;
    };

    // HACK: push UNCONDITIONALLY for every component so push/pop stay
    // balanced. A concise-arrow component (`const Foo = () => <div />`)
    // has no BlockStatement body and therefore no hook bindings, but it
    // still triggers the matching `:exit` — without an unconditional
    // push, the exit would pop the *outer* component's frame and silently
    // drop diagnostics on every member access in the parent. The empty
    // Map returned by `buildHookBindingMap` for non-Block bodies is the
    // correct semantic for "this component declares zero hook bindings".
    const enter = (node: EsTreeNode): void => {
      if (!isComponent(node)) return;
      const body = node.type === "FunctionDeclaration" ? node.body : node.init?.body;
      hookBindingMapStack.push(buildHookBindingMap(body));
    };
    const exit = (node: EsTreeNode): void => {
      if (isComponent(node)) hookBindingMapStack.pop();
    };

    return {
      FunctionDeclaration: enter,
      "FunctionDeclaration:exit": exit,
      VariableDeclarator: enter,
      "VariableDeclarator:exit": exit,
      MemberExpression(node: EsTreeNode) {
        if (hookBindingMapStack.length === 0) return;
        if (node.computed) return;
        if (node.object?.type !== "Identifier") return;
        if (node.property?.type !== "Identifier") return;

        const bindingName = node.object.name;
        const methodName = node.property.name;
        const hookBindings = hookBindingMapStack[hookBindingMapStack.length - 1];
        const hookSource = hookBindings.get(bindingName);
        if (!hookSource) return;

        const allowedMethods = HOOK_OBJECTS_WITH_METHODS.get(hookSource);
        if (!allowedMethods || !allowedMethods.has(methodName)) return;

        if (node.parent?.type !== "CallExpression" || node.parent.callee !== node) return;

        context.report({
          node,
          message: `Destructure for clarity: \`const { ${methodName} } = ${hookSource}()\` then call \`${methodName}(...)\` directly — easier for React Compiler to memoize and clearer about which methods this component depends on`,
        });
      },
    };
  },
};

// HACK: the three legacy class lifecycles `componentWillMount`,
// `componentWillReceiveProps`, and `componentWillUpdate` are unsafe
// under concurrent rendering because the renderer can call them, throw
// the work away, and call them again. React 18.3.1 emits a warning;
// React 19 REMOVES them entirely (the `UNSAFE_` prefix included). We
// flag both forms so the prefix doesn't get treated as a permanent fix.
//
// Stored as a Map (not a plain object) because plain-object lookups inherit
// from `Object.prototype` — `LEGACY_LIFECYCLE_REPLACEMENTS["constructor"]`
// returns the native `Object` function (truthy), which previously made the
// rule false-positive on every class with a constructor (Lexical nodes,
// MobX stores, custom Error subclasses, etc.). Maps return `undefined` for
// missing keys with no prototype fall-through.
const LEGACY_LIFECYCLE_REPLACEMENTS = new Map<string, string>([
  [
    "componentWillMount",
    "Move side effects to `componentDidMount`; move initial state to `constructor`",
  ],
  [
    "componentWillReceiveProps",
    "Move side effects to `componentDidUpdate` (compare prevProps); move pure state derivation to the static `getDerivedStateFromProps`",
  ],
  [
    "componentWillUpdate",
    "Move DOM reads to `getSnapshotBeforeUpdate` (passes the value to `componentDidUpdate`); move other work to `componentDidUpdate`",
  ],
]);

interface UnsafePrefixSplit {
  baseName: string;
  hasUnsafePrefix: boolean;
}

const stripUnsafePrefix = (name: string): UnsafePrefixSplit => {
  if (name.startsWith("UNSAFE_")) {
    return { baseName: name.slice("UNSAFE_".length), hasUnsafePrefix: true };
  }
  return { baseName: name, hasUnsafePrefix: false };
};

const buildLegacyLifecycleMessage = (originalName: string): string | null => {
  const { baseName, hasUnsafePrefix } = stripUnsafePrefix(originalName);
  const replacement = LEGACY_LIFECYCLE_REPLACEMENTS.get(baseName);
  if (!replacement) return null;
  const removalNote = hasUnsafePrefix
    ? `\`${originalName}\` is removed in React 19 (the UNSAFE_ prefix only silences the React 18 warning, it doesn't fix the concurrent-mode hazard).`
    : `\`${originalName}\` is removed in React 19 and warns in React 18.3.1.`;
  return `${removalNote} ${replacement}.`;
};

export const noLegacyClassLifecycles: Rule = {
  create: (context: RuleContext) => {
    const checkMember = (memberNode: EsTreeNode | undefined): void => {
      if (!memberNode) return;
      if (memberNode.type !== "MethodDefinition" && memberNode.type !== "PropertyDefinition")
        return;
      if (memberNode.key?.type !== "Identifier") return;
      const message = buildLegacyLifecycleMessage(memberNode.key.name);
      if (message) context.report({ node: memberNode.key, message });
    };

    return {
      ClassBody(node: EsTreeNode) {
        for (const member of node.body ?? []) {
          checkMember(member);
        }
      },
    };
  },
};

// HACK: legacy context (`childContextTypes` + `getChildContext` on
// providers, `contextTypes` on consumers) was deprecated in 16.3, warns
// in 18.3.1, and is REMOVED in 19. Migration is cross-file (provider +
// every consumer must be moved together) so flagging surface area early
// is high-leverage. We catch the static class-property forms AND the
// `Foo.contextTypes = {...}` shape — both styles appear in the wild,
// and missing one leaves silent gaps.
const LEGACY_CONTEXT_NAMES: ReadonlySet<string> = new Set([
  "childContextTypes",
  "contextTypes",
  "getChildContext",
]);

const buildLegacyContextMessage = (memberName: string): string => {
  if (memberName === "childContextTypes" || memberName === "getChildContext") {
    return `${memberName} is part of the legacy context API (REMOVED in React 19). Replace the provider with \`createContext\` + \`<MyContext.Provider value={...}>\` and consume via \`useContext()\` (or \`use()\` on React 19+) — every consumer must migrate together`;
  }
  return "contextTypes is part of the legacy context API (REMOVED in React 19). Replace with `static contextType = MyContext` (single context) or read the modern context with `useContext()` / `use()` from a function component — coordinate with the provider's migration";
};

const isInsideClassBody = (node: EsTreeNode): boolean => {
  let current = node.parent;
  while (current) {
    if (current.type === "ClassBody") return true;
    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    ) {
      return false;
    }
    current = current.parent;
  }
  return false;
};

export const noLegacyContextApi: Rule = {
  create: (context: RuleContext) => {
    const checkMember = (memberNode: EsTreeNode | undefined): void => {
      if (!memberNode) return;
      if (memberNode.type !== "MethodDefinition" && memberNode.type !== "PropertyDefinition")
        return;
      if (memberNode.key?.type !== "Identifier") return;
      if (!LEGACY_CONTEXT_NAMES.has(memberNode.key.name)) return;
      context.report({
        node: memberNode.key,
        message: buildLegacyContextMessage(memberNode.key.name),
      });
    };

    return {
      ClassBody(node: EsTreeNode) {
        for (const member of node.body ?? []) {
          checkMember(member);
        }
      },
      AssignmentExpression(node: EsTreeNode) {
        if (node.operator !== "=") return;
        const left = node.left;
        if (left?.type !== "MemberExpression") return;
        if (left.computed) return;
        if (left.property?.type !== "Identifier") return;
        if (!LEGACY_CONTEXT_NAMES.has(left.property.name)) return;
        if (left.object?.type !== "Identifier") return;
        if (!isUppercaseName(left.object.name)) return;
        if (isInsideClassBody(node)) return;
        context.report({
          node: left,
          message: buildLegacyContextMessage(left.property.name),
        });
      },
    };
  },
};

// HACK: React 19 removes `Component.defaultProps` for FUNCTION components
// (class components still tolerate it but the team recommends ES6
// default parameters anyway). Detection target: any
// `<Identifier>.defaultProps = <ObjectExpression>` assignment where the
// identifier looks like a component (uppercase first letter). We can't
// distinguish class vs function from the assignment alone, but the
// recommendation is the same either way — switch to ES6 default params
// in destructured props — so the guidance is uniform.
export const noDefaultProps: Rule = {
  create: (context: RuleContext) => ({
    AssignmentExpression(node: EsTreeNode) {
      if (node.operator !== "=") return;
      const left = node.left;
      if (left?.type !== "MemberExpression") return;
      if (left.computed) return;
      if (left.property?.type !== "Identifier" || left.property.name !== "defaultProps") return;
      if (left.object?.type !== "Identifier") return;
      if (!isUppercaseName(left.object.name)) return;
      context.report({
        node: left,
        message: `${left.object.name}.defaultProps — React 19 removes \`defaultProps\` for function components and discourages it for class components. Move defaults into the destructured props parameter (e.g. \`function ${left.object.name}({ size = "md", ...rest })\`) so the rule applies cleanly to both shapes`,
      });
    },
  }),
};

// HACK: companion to `noReact19DeprecatedApis` for the react-dom side
// of the React 19 migration. Catches the legacy root API (render /
// hydrate / unmountComponentAtNode) and findDOMNode. The whole
// `react-dom/test-utils` entry point is gone in 19; we flag every
// import from it and steer users to `act` from `react` plus
// `fireEvent` / `render` from @testing-library/react. Kept as a
// separate rule from `noReact19DeprecatedApis` so the per-source
// binding tracking stays simple — `react` and `react-dom` namespace
// imports never collide.
//
// Deliberately omitted: `useFormState`. It's the *current* correct API
// in React 18 (`react-dom`) — only renamed to `useActionState` and
// moved to `react` in 19. A whole-rule version gate (`>= 18`) can't
// distinguish "still on 18" from "should have migrated" inside the
// rule, so we drop the entry rather than false-positive on 18 code.
const REACT_DOM_DEPRECATED_MESSAGES = new Map<string, string>([
  [
    "render",
    "ReactDOM.render is the legacy root API — switch to `import { createRoot } from 'react-dom/client'` and call `createRoot(container).render(...)` (REMOVED in React 19)",
  ],
  [
    "hydrate",
    "ReactDOM.hydrate is the legacy SSR API — switch to `import { hydrateRoot } from 'react-dom/client'` and call `hydrateRoot(container, <App />)` (REMOVED in React 19)",
  ],
  [
    "unmountComponentAtNode",
    "ReactDOM.unmountComponentAtNode no longer works on roots created with `createRoot` — keep a reference to the root and call `root.unmount()` instead (REMOVED in React 19)",
  ],
  [
    "findDOMNode",
    "ReactDOM.findDOMNode crawls the rendered tree and breaks composition — accept a ref directly and read `ref.current` (REMOVED in React 19)",
  ],
]);

const REACT_DOM_TEST_UTILS_REPLACEMENTS = new Map<string, string>([
  ["act", "`import { act } from 'react'` instead"],
  ["Simulate", "`fireEvent` from `@testing-library/react` instead"],
  ["renderIntoDocument", "`render` from `@testing-library/react` instead"],
  ["findRenderedDOMComponentWithTag", "`getByRole` / `getByTestId` from `@testing-library/react`"],
  ["findRenderedDOMComponentWithClass", "`getByRole` or `container.querySelector` from RTL"],
  ["scryRenderedDOMComponentsWithTag", "`getAllByRole` from `@testing-library/react`"],
]);

const buildTestUtilsMessage = (importedName: string): string => {
  const replacement = REACT_DOM_TEST_UTILS_REPLACEMENTS.get(importedName);
  const replacementText = replacement
    ? `Use ${replacement}.`
    : "Switch to `act` from `react` or the equivalent in `@testing-library/react`.";
  return `react-dom/test-utils is removed in React 19. ${replacementText}`;
};

const reportTestUtilsImports = (node: EsTreeNode, context: RuleContext): void => {
  for (const specifier of node.specifiers ?? []) {
    if (specifier.type === "ImportSpecifier") {
      const importedName = specifier.imported?.name ?? "default";
      context.report({ node: specifier, message: buildTestUtilsMessage(importedName) });
      continue;
    }
    context.report({
      node: specifier,
      message:
        "react-dom/test-utils is removed in React 19. Use `act` from `react` and `fireEvent` / `render` from `@testing-library/react` instead",
    });
  }
};

export const noReactDomDeprecatedApis: Rule = createDeprecatedReactImportRule({
  source: "react-dom",
  messages: REACT_DOM_DEPRECATED_MESSAGES,
  handleExtraSource: (node, context) => {
    if (node.source?.value !== "react-dom/test-utils") return false;
    reportTestUtilsImports(node, context);
    return true;
  },
});
