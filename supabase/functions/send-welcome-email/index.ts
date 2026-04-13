// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_URL = "https://api.resend.com/emails";

const ALLOWED_PROTOCOLS = new Set([
  "growth",
  "recover",
  "desire",
  "energy",
  "glow",
  "calm",
  "immune",
  "youth",
]);

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://backtobaseline.health",
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
<body style="margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background-color:#F5F2ED;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
  <tr>
    <td align="center" style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;width:100%;margin:0 auto;background-color:#ffffff;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
        <tr>
          <td style="padding:40px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="font-family:'Courier New',Courier,monospace;font-size:12px;color:#999999;text-transform:uppercase;letter-spacing:2px;padding:0;">BASELINE</td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="font-size:24px;font-weight:bold;color:#2A2825;padding:24px 0 0 0;line-height:1.2;">You're on the list.</td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#555555;padding:16px 0 0 0;">We'll email you once &mdash; when the ${p} protocol is available for prescribing. No drip sequences. No spam. Just the launch.</td>
              </tr>
              <tr>
                <td style="font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#555555;padding:16px 0 0 0;">In the meantime: every Baseline protocol comes with full compound disclosure, published dosing, and linked research. When we launch, you'll see exactly what you're getting and why.</td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border-collapse:collapse;margin:32px 0;">
              <tr>
                <td style="border-top:1px solid #E8E4DD;font-size:1px;line-height:1px;height:1px;padding:0;">&nbsp;</td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#999999;line-height:1.5;padding:0;">Baseline &middot; backtobaseline.health</td>
              </tr>
              <tr>
                <td style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#999999;line-height:1.5;padding:8px 0 0 0;">Physician-prescribed peptide therapy. Full compound disclosure.</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
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
  const protocolRaw =
    typeof payload.protocol === "string" ? payload.protocol.trim() : "";
  const protocol = protocolRaw.toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Valid email is required" }, 400);
  }
  if (!protocolRaw || !ALLOWED_PROTOCOLS.has(protocol)) {
    return jsonResponse({ error: "Invalid protocol" }, 400);
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
