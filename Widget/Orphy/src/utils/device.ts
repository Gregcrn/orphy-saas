/**
 * Device and browser detection utilities
 * Parses user agent to extract structured device information
 */

export interface BrowserInfo {
  name: string;
  version: string;
}

export interface OSInfo {
  name: string;
  version: string;
}

export type DeviceType = "desktop" | "mobile" | "tablet";

export interface ScreenInfo {
  width: number;
  height: number;
}

export interface DeviceInfo {
  browser: BrowserInfo;
  os: OSInfo;
  device: DeviceType;
  screen: ScreenInfo;
  touchEnabled: boolean;
  language: string;
}

/**
 * Detect browser name and version from user agent
 */
function detectBrowser(ua: string): BrowserInfo {
  // Order matters - check more specific browsers first

  // Edge (Chromium-based)
  const edgeMatch = ua.match(/Edg(?:e|A|iOS)?\/(\d+(?:\.\d+)?)/);
  if (edgeMatch) {
    return { name: "Edge", version: edgeMatch[1] || "unknown" };
  }

  // Opera
  const operaMatch = ua.match(/(?:Opera|OPR)\/(\d+(?:\.\d+)?)/);
  if (operaMatch) {
    return { name: "Opera", version: operaMatch[1] || "unknown" };
  }

  // Samsung Browser
  const samsungMatch = ua.match(/SamsungBrowser\/(\d+(?:\.\d+)?)/);
  if (samsungMatch) {
    return { name: "Samsung Browser", version: samsungMatch[1] || "unknown" };
  }

  // Chrome (must be after Edge, Opera, Samsung)
  const chromeMatch = ua.match(/Chrome\/(\d+(?:\.\d+)?)/);
  if (chromeMatch && !ua.includes("Chromium")) {
    return { name: "Chrome", version: chromeMatch[1] || "unknown" };
  }

  // Chromium
  const chromiumMatch = ua.match(/Chromium\/(\d+(?:\.\d+)?)/);
  if (chromiumMatch) {
    return { name: "Chromium", version: chromiumMatch[1] || "unknown" };
  }

  // Firefox
  const firefoxMatch = ua.match(/Firefox\/(\d+(?:\.\d+)?)/);
  if (firefoxMatch) {
    return { name: "Firefox", version: firefoxMatch[1] || "unknown" };
  }

  // Safari (must be after Chrome)
  const safariMatch = ua.match(/Version\/(\d+(?:\.\d+)?).*Safari/);
  if (safariMatch) {
    return { name: "Safari", version: safariMatch[1] || "unknown" };
  }

  // Safari without version (fallback)
  if (ua.includes("Safari") && !ua.includes("Chrome")) {
    return { name: "Safari", version: "unknown" };
  }

  // IE 11
  if (ua.includes("Trident/")) {
    const ieMatch = ua.match(/rv:(\d+(?:\.\d+)?)/);
    return { name: "Internet Explorer", version: ieMatch?.[1] || "11" };
  }

  // IE 10 and below
  const ieOldMatch = ua.match(/MSIE (\d+(?:\.\d+)?)/);
  if (ieOldMatch) {
    return { name: "Internet Explorer", version: ieOldMatch[1] || "unknown" };
  }

  return { name: "Unknown", version: "unknown" };
}

/**
 * Detect operating system from user agent
 */
function detectOS(ua: string): OSInfo {
  // iOS
  const iosMatch = ua.match(/(?:iPhone|iPad|iPod).*?OS (\d+[_\.]\d+)/);
  if (iosMatch) {
    return { name: "iOS", version: iosMatch[1]?.replace("_", ".") || "unknown" };
  }

  // macOS
  const macMatch = ua.match(/Mac OS X (\d+[_\.]\d+(?:[_\.]\d+)?)/);
  if (macMatch) {
    return { name: "macOS", version: macMatch[1]?.replace(/_/g, ".") || "unknown" };
  }

  // Android
  const androidMatch = ua.match(/Android (\d+(?:\.\d+)?)/);
  if (androidMatch) {
    return { name: "Android", version: androidMatch[1] || "unknown" };
  }

  // Windows
  const windowsMatch = ua.match(/Windows NT (\d+\.\d+)/);
  if (windowsMatch) {
    const ntVersion = windowsMatch[1];
    // Map NT version to Windows version
    const windowsVersions: Record<string, string> = {
      "10.0": "10/11",
      "6.3": "8.1",
      "6.2": "8",
      "6.1": "7",
      "6.0": "Vista",
      "5.1": "XP",
    };
    return { name: "Windows", version: windowsVersions[ntVersion || ""] || ntVersion || "unknown" };
  }

  // Linux
  if (ua.includes("Linux")) {
    // Chrome OS
    if (ua.includes("CrOS")) {
      return { name: "Chrome OS", version: "unknown" };
    }
    return { name: "Linux", version: "unknown" };
  }

  return { name: "Unknown", version: "unknown" };
}

/**
 * Detect device type (desktop, mobile, tablet)
 */
function detectDeviceType(ua: string): DeviceType {
  // Tablets
  if (ua.includes("iPad")) {
    return "tablet";
  }
  if (ua.includes("Android") && !ua.includes("Mobile")) {
    return "tablet";
  }
  if (ua.includes("Tablet")) {
    return "tablet";
  }

  // Mobile
  if (ua.includes("Mobile")) {
    return "mobile";
  }
  if (ua.includes("iPhone") || ua.includes("iPod")) {
    return "mobile";
  }
  if (ua.includes("Android")) {
    return "mobile";
  }
  if (/webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return "mobile";
  }

  // Default to desktop
  return "desktop";
}

/**
 * Get complete device information
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;

  return {
    browser: detectBrowser(ua),
    os: detectOS(ua),
    device: detectDeviceType(ua),
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    touchEnabled: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    language: navigator.language || "en",
  };
}

/**
 * Get a short display string for the device
 * Example: "Chrome 120 · macOS · Desktop"
 */
export function getDeviceDisplayString(info: DeviceInfo): string {
  const browser = `${info.browser.name} ${info.browser.version}`;
  const os = info.os.name;
  const device = info.device.charAt(0).toUpperCase() + info.device.slice(1);
  return `${browser} · ${os} · ${device}`;
}
