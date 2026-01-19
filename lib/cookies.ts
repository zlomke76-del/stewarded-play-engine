/**
 * Shared cookie interfaces for Server + Client adapters.
 */

export type CookieOptions = {
  path?: string;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
};

/**
 * Methods available on the server cookie adapter.
 */
export interface CookieMethodsServer {
  get(name: string): string | null;
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string): void;
}

/**
 * Methods available on the client cookie adapter.
 */
export interface CookieMethodsClient {
  get(name: string): string | null;
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string): void;
}
