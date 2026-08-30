import type { Request as ExpressReq, Response as ExpressRes } from "express";
import * as cookie from "cookie";
import { requestContextStorage } from "../src/lib/auth/session-storage";

export function adaptRoute(handler: (req: any, ctx?: any) => Promise<any>) {
  return async (req: ExpressReq, res: ExpressRes) => {
    try {
      const protocol = req.protocol || "http";
      const host = req.get("host") || "localhost:5000";
      const fullUrl = `${protocol}://${host}${req.originalUrl}`;

      const headers = new Headers();
      for (const [key, val] of Object.entries(req.headers)) {
        if (val) {
          if (Array.isArray(val)) {
            val.forEach((v) => headers.append(key, String(v)));
          } else {
            headers.set(key, String(val));
          }
        }
      }

      let body: string | undefined = undefined;
      if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
        body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      }

      const webReq = new Request(fullUrl, {
        method: req.method,
        headers,
        body,
      });

      const parsedCookies = cookie.parse(req.headers.cookie || "");

      // Provide NextRequest helpers
      (webReq as any).cookies = {
        get: (name: string) => (parsedCookies[name] ? { name, value: parsedCookies[name] } : undefined),
        getAll: () => Object.entries(parsedCookies).map(([name, value]) => ({ name, value })),
      };

      (webReq as any).nextUrl = new URL(fullUrl);

      return await requestContextStorage.run(
        { cookies: parsedCookies, headers },
        async () => {
          const nextResponse = await handler(webReq, { params: req.params });

          if (nextResponse) {
            res.status(nextResponse.status || 200);

            if (nextResponse.headers) {
              nextResponse.headers.forEach((val: string, key: string) => {
                if (key.toLowerCase() === "set-cookie") {
                  res.append("Set-Cookie", val);
                } else {
                  res.setHeader(key, val);
                }
              });
            }

            const contentType = nextResponse.headers?.get("content-type") || "";
            if (contentType.includes("application/json")) {
              const json = await nextResponse.json();
              return res.json(json);
            } else {
              const text = await nextResponse.text();
              return res.send(text);
            }
          }

          return res.status(200).end();
        }
      );
    } catch (error: any) {
      console.error("API Adapt Error on", req.originalUrl, error);
      return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  };
}
