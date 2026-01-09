import * as maxmind from "maxmind";
import type { CityResponse } from "maxmind";

export interface IpLocation {
  city: string | null;
  country: string | null;
}

let cityReader: maxmind.Reader<CityResponse> | null = null;

export const initIpLocation = async (dbPath: string): Promise<void> => {
  try {
    cityReader = await maxmind.open<CityResponse>(dbPath);
    console.log(`[GeoIP] Successfully loaded GeoLite2 DB from: ${dbPath}`);
  } catch (err) {
    console.error("[GeoIP] Failed to load database:", err);
    throw err;
  }
};

export const getIpLocation = (ip: string): IpLocation | null => {
  if (!cityReader) {
    throw new Error(
      "GeoIP reader not initialized. Call initIpLocation() first."
    );
  }

  const data = cityReader.get(ip);

  if (!data) {
    return {
      city: null,
      country: null,
    };
  }

  return {
    city: data.city?.names?.en ?? null,
    country: data.country?.names?.en ?? null,
  };
};
