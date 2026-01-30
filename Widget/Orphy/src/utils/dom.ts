/**
 * DOM utility functions
 */

export interface ElementOptions {
  className?: string;
  styles?: Partial<CSSStyleDeclaration>;
  attributes?: Record<string, string>;
  children?: (HTMLElement | SVGSVGElement | string)[];
  onClick?: (e: MouseEvent) => void;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {}
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  if (options.className) {
    el.className = options.className;
  }

  if (options.styles) {
    Object.assign(el.style, options.styles);
  }

  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      el.setAttribute(key, value);
    }
  }

  if (options.children) {
    for (const child of options.children) {
      if (typeof child === "string") {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child as Node);
      }
    }
  }

  if (options.onClick) {
    el.addEventListener("click", options.onClick as EventListener);
  }

  return el;
}

export function addClass(el: HTMLElement, ...classes: string[]): void {
  el.classList.add(...classes);
}

export function removeClass(el: HTMLElement, ...classes: string[]): void {
  el.classList.remove(...classes);
}

export function toggleClass(el: HTMLElement, className: string, force?: boolean): boolean {
  return el.classList.toggle(className, force);
}
