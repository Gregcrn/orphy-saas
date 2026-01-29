/**
 * CSS selector generation for element targeting
 */

export function generateSelector(element: HTMLElement): string {
  // Priority 1: ID
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  // Priority 2: data-testid
  const testId = element.getAttribute("data-testid");
  if (testId) {
    return `[data-testid="${CSS.escape(testId)}"]`;
  }

  // Priority 3: Build path from body
  return buildSelectorPath(element);
}

function buildSelectorPath(element: HTMLElement): string {
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body && current !== document.documentElement) {
    const selector = getElementSelector(current);
    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(" > ");
}

function getElementSelector(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();

  // Check for unique class that identifies this element
  if (element.className && typeof element.className === "string") {
    const classes = element.className.trim().split(/\s+/).filter(Boolean);
    for (const cls of classes) {
      // Skip utility classes (common patterns)
      if (isUtilityClass(cls)) continue;

      const selector = `${tag}.${CSS.escape(cls)}`;
      if (isUniqueAmongSiblings(element, selector)) {
        return selector;
      }
    }
  }

  // Fallback: nth-child
  const parent = element.parentElement;
  if (!parent) {
    return tag;
  }

  const siblings = Array.from(parent.children);
  const sameTagSiblings = siblings.filter((s) => s.tagName === element.tagName);

  if (sameTagSiblings.length === 1) {
    return tag;
  }

  const index = sameTagSiblings.indexOf(element) + 1;
  return `${tag}:nth-of-type(${index})`;
}

function isUniqueAmongSiblings(element: HTMLElement, selector: string): boolean {
  const parent = element.parentElement;
  if (!parent) return true;

  const matches = parent.querySelectorAll(`:scope > ${selector}`);
  return matches.length === 1;
}

function isUtilityClass(className: string): boolean {
  // Common utility class patterns (Tailwind, Bootstrap, etc.)
  const patterns = [
    /^(m|p|w|h|flex|grid|text|bg|border|rounded|shadow|opacity|z-)/,
    /^(sm:|md:|lg:|xl:|2xl:)/,
    /^(hover:|focus:|active:|disabled:)/,
    /^(col-|row-|gap-|space-)/,
    /^d-(none|block|flex|grid|inline)/,
  ];
  return patterns.some((p) => p.test(className));
}
