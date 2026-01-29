/**
 * Internationalization (i18n) system
 * Lightweight translation system for the widget
 */

import { fr, type TranslationKeys } from "./fr";
import { en } from "./en";

export type Locale = "fr" | "en";

const locales: Record<Locale, TranslationKeys> = { fr, en };

let currentLocale: Locale = "fr";
let translations: TranslationKeys = fr;

/**
 * Set the current locale
 */
export function setLocale(locale: Locale): void {
  if (locales[locale]) {
    currentLocale = locale;
    translations = locales[locale];
  } else {
    console.warn(`Orphy: Unknown locale "${locale}", falling back to "fr"`);
    currentLocale = "fr";
    translations = fr;
  }
}

/**
 * Get the current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Get a translation by key path
 * Supports interpolation with {{variable}} syntax
 *
 * @example
 * t('commentBox.header') // "Que souhaitez-vous signaler ?"
 * t('toast.successMultiple', { count: 3 }) // "3 feedbacks envoyés !"
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split(".");
  let value: unknown = translations;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      console.warn(`Orphy: Missing translation for "${key}"`);
      return key;
    }
  }

  if (typeof value !== "string") {
    console.warn(`Orphy: Translation "${key}" is not a string`);
    return key;
  }

  // Interpolate params
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey: string) => {
      return params[paramKey]?.toString() ?? `{{${paramKey}}}`;
    });
  }

  return value;
}

export type { TranslationKeys };
