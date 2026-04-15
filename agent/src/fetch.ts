/**
 * fetch.ts — IPv4-forced HTTPS fetch for environments where IPv6 fails
 */

import { request } from "https";
import { URL } from "url";

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

interface FetchResult {
  ok: boolean;
  status: number;
  json<T>(): Promise<T>;
  text(): Promise<string>;
}

export function fetchIPv4(url: string, opts: FetchOptions = {}): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const timer = setTimeout(
      () => reject(new Error(`Request timeout after ${opts.timeoutMs ?? 15000}ms`)),
      opts.timeoutMs ?? 15000
    );

    const req = request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method: opts.method ?? "GET",
        headers: opts.headers ?? {},
        family: 4, // force IPv4
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          clearTimeout(timer);
          const body = Buffer.concat(chunks).toString("utf-8");
          const status = res.statusCode ?? 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            json: () => Promise.resolve(JSON.parse(body)),
            text: () => Promise.resolve(body),
          });
        });
        res.on("error", (e) => { clearTimeout(timer); reject(e); });
      }
    );

    req.on("error", (e) => { clearTimeout(timer); reject(e); });
    if (opts.body) req.write(opts.body);
    req.end();
  });
}
