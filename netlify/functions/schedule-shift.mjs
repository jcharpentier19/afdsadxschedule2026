import { getStore } from "@netlify/blobs";

const VALID_TOKEN = "abc123";

export default async function handler(req, context) {
  const store = getStore("schedule-data");

  // GET — anyone can read the current shift
  if (req.method === "GET") {
    try {
      const data = await store.get("shift", { type: "json" });
      if (data) {
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ offset: 0, timestamp: null }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ offset: 0, timestamp: null }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST — only the director (with valid token) can update
  if (req.method === "POST") {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (token !== VALID_TOKEN) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const offset = parseInt(body.offset, 10);
      if (isNaN(offset)) {
        return new Response(JSON.stringify({ error: "Invalid offset" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const payload = {
        offset: offset,
        timestamp: offset === 0 ? null : body.timestamp || null,
      };

      await store.setJSON("shift", payload);

      return new Response(JSON.stringify(payload), {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
}

export const config = {
  path: "/api/schedule-shift",
};
