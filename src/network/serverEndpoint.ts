/** The Colyseus server port in dev (`npm run server`). */
const DEV_ENDPOINT = "http://localhost:2567";

export interface EndpointSettings {
  /** `VITE_SERVER_URL` at build time, to point the client at another host. */
  override?: string;
  /** True under `npm run dev`, where Vite and Colyseus run on separate ports. */
  dev: boolean;
  /** The page's origin. In production the same server hosts the client and the rooms. */
  origin: string;
}

/** Which Colyseus server the client joins (F-080). The SDK turns http(s) into ws(s). */
export function serverEndpoint({
  override,
  dev,
  origin,
}: EndpointSettings): string {
  if (override) {
    return override;
  }

  return dev ? DEV_ENDPOINT : origin;
}
