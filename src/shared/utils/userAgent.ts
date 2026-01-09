import { UAParser } from "ua-parser-js";

export interface UserAgentInfo {
  deviceType: string | null;
  browser: string | null;
  os: string | null;
}

export function parseUserAgent(uaString: string): UserAgentInfo {
  const parser = new UAParser(uaString);
  const result = parser.getResult();

  const deviceType = result.device?.type ?? null;

  const browserName = result.browser?.name ?? null;
  const browserMajor = result.browser?.major ?? null;
  const browser =
    browserName && browserMajor
      ? `${browserName} ${browserMajor}`
      : browserName;

  const os = result.os?.name ?? null;

  return {
    deviceType,
    browser,
    os,
  };
}
