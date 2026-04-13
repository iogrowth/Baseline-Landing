// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_URL = "https://api.resend.com/emails/send";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function protocolDisplayName(protocol: string): string {
  const key = protocol.trim().toLowerCase();
  const map: Record<string, string> = {
    growth: "Growth",
    recover: "Recover",
  };
  if (map[key]) return map[key];
  return protocol
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function welcomeSubject(protocol: string): string {
  const name = protocolDisplayName(protocol);
  return `You're on the ${name} waitlist`;
}

function welcomeHtml(protocol: string): string {
  const p = escapeHtml(protocolDisplayName(protocol));
  const title = escapeHtml(welcomeSubject(protocol));
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:32px 16px;background:#faf9f7;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2A2825;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:28px;">BASELINE</div>
    <h1 style="font-size:24px;font-weight:700;color:#2A2825;margin:0 0 16px;line-height:1.25;">You're on the list.</h1>
    <p style="font-size:16px;line-height:1.5;margin:0 0 16px;color:#2A2825;">We'll email you once — when the ${p} protocol is available for prescribing. No drip sequences. No spam. Just the launch.</p>
    <p style="font-size:16px;line-height:1.5;margin:0 0 28px;color:#2A2825;">In the meantime: every Baseline protocol comes with full compound disclosure, published dosing, and linked research. When we launch, you'll see exactly what you're getting and why.</p>
    <hr style="border:0;border-top:1px solid #E8E4DD;margin:0 0 24px;">
    <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:11px;color:#999;line-height:1.5;">
      <div style="margin-bottom:8px;">Baseline · backtobaseline.health</div>
      <div>Physician-prescribed peptide therapy. Full compound disclosure.</div>
    </div>
  </div>
</body>
</html>`;
}

function jsonResponse(body: unknown, status: number): Response {
  const msg = typeof body === "string" ? body : JSON.stringify(body);
  return new Response(msg, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "RESEND_API_KEY is not configured" }, 500);
  }

  let payload: { email?: string; protocol?: string };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const protocol =
    typeof payload.protocol === "string" ? payload.protocol.trim() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Valid email is required" }, 400);
  }
  if (!protocol) {
    return jsonResponse({ error: "protocol is required" }, 400);
  }

  const resendRes = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Baseline <hello@backtobaseline.health>",
      to: [email],
      subject: welcomeSubject(protocol),
      html: welcomeHtml(protocol),
    }),
  });

  const text = await resendRes.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!resendRes.ok) {
    const errMsg =
      typeof parsed === "object" && parsed !== null && "message" in parsed
        ? String((parsed as { message: unknown }).message)
        : text || resendRes.statusText;
    return jsonResponse(
      { error: errMsg },
      resendRes.status >= 400 && resendRes.status < 600 ? resendRes.status : 500,
    );
  }

  return new Response(JSON.stringify(parsed), {
    status: resendRes.status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
});
