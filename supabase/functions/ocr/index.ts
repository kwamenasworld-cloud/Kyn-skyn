import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://kynskyn.com",
  "https://www.kynskyn.com",
  "http://localhost",
  "http://127.0.0.1",
];

// Google Vision rejects payloads above ~10MB. Cap base64 input below that to
// avoid wasting an API call on requests that will fail.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

// Simple in-memory token bucket per client IP. Resets on cold-start, which is
// fine for cost protection — anything more sophisticated belongs in Supabase
// rate limits or a Cloudflare rule in front of the function.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimitState = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitState.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitState.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  entry.count += 1;
  return true;
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

function jsonResponse(
  req: Request,
  status: number,
  body: Record<string, unknown>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, 405, { error: "Method not allowed" });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return jsonResponse(req, 429, { error: "Too many requests" });
  }

  try {
    const { image } = await req.json();

    if (typeof image !== "string" || image.length === 0) {
      return jsonResponse(req, 400, { error: "Missing image field" });
    }

    if (image.length > MAX_IMAGE_BYTES) {
      return jsonResponse(req, 413, { error: "Image too large" });
    }

    const apiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
    if (!apiKey) {
      return jsonResponse(req, 500, { error: "OCR service not configured" });
    }

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: image },
              features: [{ type: "TEXT_DETECTION" }],
            },
          ],
        }),
      },
    );

    const visionData = await visionRes.json();
    const text = visionData.responses?.[0]?.fullTextAnnotation?.text ?? "";

    return jsonResponse(req, 200, { text });
  } catch (_err) {
    return jsonResponse(req, 500, { error: "OCR processing failed" });
  }
});
