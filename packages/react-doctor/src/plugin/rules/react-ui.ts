import {
  ELLIPSIS_EXCLUDED_TAG_NAMES,
  EM_DASH_CHARACTER,
  FLEX_OR_GRID_DISPLAY_TOKENS,
  HEADING_TAG_NAMES,
  HEAVY_HEADING_FONT_WEIGHT_MIN,
  HEAVY_HEADING_TAILWIND_WEIGHTS,
  PADDING_HORIZONTAL_AXIS_PATTERN,
  PADDING_VERTICAL_AXIS_PATTERN,
  SIZE_HEIGHT_AXIS_PATTERN,
  SIZE_WIDTH_AXIS_PATTERN,
  SPACE_AXIS_PATTERN,
  TAILWIND_DEFAULT_PALETTE_NAMES,
  TAILWIND_DEFAULT_PALETTE_STOPS,
  TAILWIND_PALETTE_UTILITY_PREFIXES,
  TRAILING_THREE_PERIOD_ELLIPSIS_PATTERN,
  VAGUE_BUTTON_LABELS,
} from "../constants.js";
import { findJsxAttribute } from "../helpers.js";
import type { EsTreeNode, Rule, RuleContext } from "../types.js";

const getOpeningElementTagName = (openingElement: EsTreeNode | null | undefined): string | null => {
  if (!openingElement) return null;
  if (openingElement.name?.type === "JSXIdentifier") return openingElement.name.name;
  if (openingElement.name?.type === "JSXMemberExpression") {
    let cursor = openingElement.name;
    while (cursor.type === "JSXMemberExpression") {
      cursor = cursor.property;
    }
    if (cursor?.type === "JSXIdentifier") return cursor.name;
  }
  return null;
};

const getClassNameLiteral = (classAttribute: EsTreeNode): string | null => {
  if (!classAttribute.value) return null;
  if (classAttribute.value.type === "Literal" && typeof classAttribute.value.value === "string") {
    return classAttribute.value.value;
  }
  if (classAttribute.value.type === "JSXExpressionContainer") {
    const expression = classAttribute.value.expression;
    if (expression?.type === "Literal" && typeof expression.value === "string") {
      return expression.value;
    }
    if (expression?.type === "TemplateLiteral" && expression.quasis?.length === 1) {
      return expression.quasis[0].value?.raw ?? null;
    }
  }
  return null;
};

const tokenizeClassName = (classNameValue: string): string[] =>
  classNameValue.split(/\s+/).filter(Boolean);

const getInlineStyleObjectExpression = (jsxAttribute: EsTreeNode): EsTreeNode | null => {
  if (jsxAttribute.name?.type !== "JSXIdentifier" || jsxAttribute.name.name !== "style") {
    return null;
  }
  if (jsxAttribute.value?.type !== "JSXExpressionContainer") return null;
  const expression = jsxAttribute.value.expression;
  if (expression?.type !== "ObjectExpression") return null;
  return expression;
};

const getStylePropertyKeyName = (objectProperty: EsTreeNode): string | null => {
  if (objectProperty.type !== "Property") return null;
  if (objectProperty.key?.type === "Identifier") return objectProperty.key.name;
  if (objectProperty.key?.type === "Literal" && typeof objectProperty.key.value === "string") {
    return objectProperty.key.value;
  }
  return null;
};

const getStylePropertyNumericValue = (objectProperty: EsTreeNode): number | null => {
  const valueNode = objectProperty.value;
  if (!valueNode) return null;
  if (valueNode.type === "Literal" && typeof valueNode.value === "number") return valueNode.value;
  if (valueNode.type === "Literal" && typeof valueNode.value === "string") {
    const parsed = parseFloat(valueNode.value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const noBoldHeading: Rule = {
  create: (context: RuleContext) => ({
    JSXOpeningElement(openingNode: EsTreeNode) {
      const tagName = getOpeningElementTagName(openingNode);
      if (!tagName || !HEADING_TAG_NAMES.has(tagName)) return;

      const classAttribute = findJsxAttribute(openingNode.attributes ?? [], "className");
      if (classAttribute) {
        const classNameLiteral = getClassNameLiteral(classAttribute);
        if (classNameLiteral) {
          for (const tailwindWeightToken of HEAVY_HEADING_TAILWIND_WEIGHTS) {
            const tokenPattern = new RegExp(`(?:^|\\s)${tailwindWeightToken}(?:$|\\s|:)`);
            if (tokenPattern.test(classNameLiteral)) {
              context.report({
                node: classAttribute,
                message: `${tailwindWeightToken} on <${tagName}> crushes counter shapes at display sizes — use font-semibold (600) or font-medium (500)`,
              });
              return;
            }
          }
        }
      }

      const styleAttribute = findJsxAttribute(openingNode.attributes ?? [], "style");
      if (!styleAttribute) return;
      const styleObject = getInlineStyleObjectExpression(styleAttribute);
      if (!styleObject) return;

      for (const objectProperty of styleObject.properties ?? []) {
        const stylePropertyName = getStylePropertyKeyName(objectProperty);
        if (stylePropertyName !== "fontWeight") continue;
        const numericWeight = getStylePropertyNumericValue(objectProperty);
        if (numericWeight !== null && numericWeight >= HEAVY_HEADING_FONT_WEIGHT_MIN) {
          context.report({
            node: objectProperty,
            message: `fontWeight: ${numericWeight} on <${tagName}> crushes counter shapes at display sizes — use 500 or 600`,
          });
          return;
        }
      }
    },
  }),
};

const collectAxisShorthandPairs = (
  classNameValue: string,
  horizontalPattern: RegExp,
  verticalPattern: RegExp,
): Array<{ value: string }> => {
  const horizontalValues = new Set<string>();
  for (const horizontalMatch of classNameValue.matchAll(horizontalPattern)) {
    horizontalValues.add(`${horizontalMatch[1]}${horizontalMatch[2]}`);
  }
  const matchedPairs: Array<{ value: string }> = [];
  for (const verticalMatch of classNameValue.matchAll(verticalPattern)) {
    const verticalValue = `${verticalMatch[1]}${verticalMatch[2]}`;
    if (horizontalValues.has(verticalValue)) {
      matchedPairs.push({ value: verticalValue });
    }
  }
  return matchedPairs;
};

const hasResponsivePrefix = (classNameValue: string, axisPrefix: string): boolean =>
  new RegExp(`(?:^|\\s)\\w+:${axisPrefix}-`).test(classNameValue);

export const noRedundantPaddingAxes: Rule = {
  create: (context: RuleContext) => ({
    JSXAttribute(jsxAttribute: EsTreeNode) {
      if (jsxAttribute.name?.type !== "JSXIdentifier" || jsxAttribute.name.name !== "className") {
        return;
      }
      const classNameLiteral = getClassNameLiteral(jsxAttribute);
      if (!classNameLiteral) return;
      // Per-breakpoint variation is a legit reason to keep the axes split.
      if (
        hasResponsivePrefix(classNameLiteral, "px") ||
        hasResponsivePrefix(classNameLiteral, "py")
      ) {
        return;
      }
      const matchedPairs = collectAxisShorthandPairs(
        classNameLiteral,
        PADDING_HORIZONTAL_AXIS_PATTERN,
        PADDING_VERTICAL_AXIS_PATTERN,
      );
      if (matchedPairs.length === 0) return;

      for (const matchedPair of matchedPairs) {
        context.report({
          node: jsxAttribute,
          message: `px-${matchedPair.value} py-${matchedPair.value} → use the shorthand p-${matchedPair.value}`,
        });
      }
    },
  }),
};

export const noRedundantSizeAxes: Rule = {
  create: (context: RuleContext) => ({
    JSXAttribute(jsxAttribute: EsTreeNode) {
      if (jsxAttribute.name?.type !== "JSXIdentifier" || jsxAttribute.name.name !== "className") {
        return;
      }
      const classNameLiteral = getClassNameLiteral(jsxAttribute);
      if (!classNameLiteral) return;
      if (
        hasResponsivePrefix(classNameLiteral, "w") ||
        hasResponsivePrefix(classNameLiteral, "h")
      ) {
        return;
      }
      // Skip percent / fraction widths (`w-1/2 h-1/2`) — those have no `size-*` shorthand.
      const matchedPairs = collectAxisShorthandPairs(
        classNameLiteral,
        SIZE_WIDTH_AXIS_PATTERN,
        SIZE_HEIGHT_AXIS_PATTERN,
      );
      if (matchedPairs.length === 0) return;

      for (const matchedPair of matchedPairs) {
        context.report({
          node: jsxAttribute,
          message: `w-${matchedPair.value} h-${matchedPair.value} → use the shorthand size-${matchedPair.value} (Tailwind v3.4+)`,
        });
      }
    },
  }),
};

export const noSpaceOnFlexChildren: Rule = {
  create: (context: RuleContext) => ({
    JSXAttribute(jsxAttribute: EsTreeNode) {
      if (jsxAttribute.name?.type !== "JSXIdentifier" || jsxAttribute.name.name !== "className") {
        return;
      }
      const classNameLiteral = getClassNameLiteral(jsxAttribute);
      if (!classNameLiteral) return;
      const tokens = tokenizeClassName(classNameLiteral);
      let hasFlexOrGridLayout = false;
      for (const token of tokens) {
        // Strip Tailwind variant prefixes (`md:flex`, `dark:hover:grid`).
        const lastSegment = token.includes(":") ? token.slice(token.lastIndexOf(":") + 1) : token;
        if (FLEX_OR_GRID_DISPLAY_TOKENS.has(lastSegment)) {
          hasFlexOrGridLayout = true;
          break;
        }
      }
      if (!hasFlexOrGridLayout) return;
      const spaceMatch = classNameLiteral.match(SPACE_AXIS_PATTERN);
      if (!spaceMatch) return;
      // HACK: preserve the axis in the suggestion — `space-x-4` maps
      // to `gap-x-4` (horizontal only). A bare `gap-4` would also add
      // vertical gap, silently changing layout for the developer who
      // followed the hint.
      const spaceAxis = spaceMatch[1];
      const spaceValue = spaceMatch[2];
      context.report({
        node: jsxAttribute,
        message: `space-${spaceAxis}-${spaceValue} on a flex/grid parent — use gap-${spaceAxis}-${spaceValue} instead. Per-sibling margins phantom-gap on conditional render and don't mirror in RTL`,
      });
    },
  }),
};

const isInsideExcludedAncestor = (jsxTextNode: EsTreeNode): boolean => {
  let cursor = jsxTextNode.parent;
  while (cursor) {
    if (cursor.type === "JSXElement") {
      const tagName = getOpeningElementTagName(cursor.openingElement);
      if (tagName && ELLIPSIS_EXCLUDED_TAG_NAMES.has(tagName.toLowerCase())) return true;
      const translateAttribute = findJsxAttribute(
        cursor.openingElement?.attributes ?? [],
        "translate",
      );
      if (
        translateAttribute?.value?.type === "Literal" &&
        translateAttribute.value.value === "no"
      ) {
        return true;
      }
    }
    cursor = cursor.parent;
  }
  return false;
};

export const noEmDashInJsxText: Rule = {
  create: (context: RuleContext) => ({
    JSXText(jsxTextNode: EsTreeNode) {
      const textValue = typeof jsxTextNode.value === "string" ? jsxTextNode.value : "";
      if (!textValue.includes(EM_DASH_CHARACTER)) return;
      if (isInsideExcludedAncestor(jsxTextNode)) return;
      context.report({
        node: jsxTextNode,
        message:
          "Em dash (—) in JSX text reads as model output — replace with comma, colon, semicolon, or parentheses",
      });
    },
  }),
};

export const noThreePeriodEllipsis: Rule = {
  create: (context: RuleContext) => ({
    JSXText(jsxTextNode: EsTreeNode) {
      const textValue = typeof jsxTextNode.value === "string" ? jsxTextNode.value : "";
      if (!TRAILING_THREE_PERIOD_ELLIPSIS_PATTERN.test(textValue)) return;
      if (isInsideExcludedAncestor(jsxTextNode)) return;
      context.report({
        node: jsxTextNode,
        message:
          'Three-period ellipsis ("...") in JSX text — use the actual ellipsis character "…" (or `&hellip;`)',
      });
    },
  }),
};

const buildDefaultPaletteRegex = (): RegExp => {
  const utilityPrefixGroup = TAILWIND_PALETTE_UTILITY_PREFIXES.join("|");
  const paletteNameGroup = TAILWIND_DEFAULT_PALETTE_NAMES.join("|");
  // HACK: anchor the numeric group to the actual Tailwind palette stops
  // rather than `\d{2,3}`. Custom Tailwind themes that re-purpose the
  // utility prefix for a non-Tailwind scale (e.g. Radix Colors uses
  // `gray.1` … `gray.12`) would otherwise false-positive on `text-gray-11`,
  // `fill-gray-12`, etc. — those aren't the Tailwind template default.
  const paletteStopGroup = TAILWIND_DEFAULT_PALETTE_STOPS.join("|");
  // HACK: /g so we can iterate every default-palette token in one
  // className. Without /g the user fixes one token, re-runs, sees the
  // next, fixes that, re-runs… N round-trips for N tokens in a single
  // attribute.
  return new RegExp(
    `(?:^|\\s|:)(${utilityPrefixGroup})-(${paletteNameGroup})-(${paletteStopGroup})(?=$|[\\s:/])`,
    "g",
  );
};

const DEFAULT_PALETTE_REGEX = buildDefaultPaletteRegex();

export const noDefaultTailwindPalette: Rule = {
  create: (context: RuleContext) => ({
    JSXAttribute(jsxAttribute: EsTreeNode) {
      if (jsxAttribute.name?.type !== "JSXIdentifier" || jsxAttribute.name.name !== "className") {
        return;
      }
      const classNameLiteral = getClassNameLiteral(jsxAttribute);
      if (!classNameLiteral) return;
      const reportedTokens = new Set<string>();
      for (const paletteMatch of classNameLiteral.matchAll(DEFAULT_PALETTE_REGEX)) {
        const matchedToken = `${paletteMatch[1]}-${paletteMatch[2]}-${paletteMatch[3]}`;
        if (reportedTokens.has(matchedToken)) continue;
        reportedTokens.add(matchedToken);
        const replacementSuggestion =
          paletteMatch[2] === "indigo"
            ? "use your project's brand color or zinc/neutral/stone"
            : "use zinc (true neutral), neutral (warmer), or stone (warmest)";
        context.report({
          node: jsxAttribute,
          message: `${matchedToken} reads as the Tailwind template default — ${replacementSuggestion}`,
        });
      }
    },
  }),
};

const isButtonLikeTagName = (tagName: string): boolean => {
  if (tagName === "button") return true;
  if (tagName === "Button") return true;
  return false;
};

const collectJsxLabelText = (jsxElementNode: EsTreeNode): string | null => {
  const childList = jsxElementNode.children ?? [];
  if (childList.length === 0) return null;
  const collectedFragments: string[] = [];
  for (const childNode of childList) {
    if (childNode.type === "JSXText") {
      collectedFragments.push(typeof childNode.value === "string" ? childNode.value : "");
      continue;
    }
    if (childNode.type === "JSXExpressionContainer") {
      const expression = childNode.expression;
      if (expression?.type === "Literal" && typeof expression.value === "string") {
        collectedFragments.push(expression.value);
        continue;
      }
      if (expression?.type === "TemplateLiteral" && expression.quasis?.length === 1) {
        const rawTemplate = expression.quasis[0].value?.raw;
        if (typeof rawTemplate === "string" && expression.expressions.length === 0) {
          collectedFragments.push(rawTemplate);
          continue;
        }
      }
      // Bail on dynamic content (interpolation, identifiers).
      return null;
    }
    if (childNode.type === "JSXFragment") {
      // Recurse into <>…</> fragments — they're transparent for label purposes.
      const fragmentLabel = collectJsxLabelText(childNode);
      if (fragmentLabel === null) return null;
      collectedFragments.push(fragmentLabel);
      continue;
    }
    if (childNode.type === "JSXElement") {
      // Bail on nested elements (icons, spans) — the leading/trailing text alone isn't the full label.
      return null;
    }
  }
  return collectedFragments.join("").trim();
};

export const noVagueButtonLabel: Rule = {
  create: (context: RuleContext) => ({
    JSXElement(jsxElementNode: EsTreeNode) {
      const tagName = getOpeningElementTagName(jsxElementNode.openingElement);
      if (!tagName || !isButtonLikeTagName(tagName)) return;
      const labelText = collectJsxLabelText(jsxElementNode);
      if (!labelText) return;
      const normalizedLabel = labelText
        .toLowerCase()
        .replace(/[.!?…]+$/, "")
        .trim();
      if (!VAGUE_BUTTON_LABELS.has(normalizedLabel)) return;
      context.report({
        node: jsxElementNode.openingElement ?? jsxElementNode,
        message: `Vague button label "${labelText}" — name the action ("Save changes", "Send invite", "Delete account") so screen readers and hesitant users know what happens`,
      });
    },
  }),
};
