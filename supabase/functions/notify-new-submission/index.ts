// Emails the site owner when a new spot is submitted for review.
//
// Called by the `notify_new_submission` Postgres trigger (see
// supabase/sql/notify-new-submission-trigger.sql), which fires only on INSERTs
// into `spots` with status = 'pending' — so seeding approved rows never emails.
//
// Deploy with --no-verify-jwt: the caller is the database, not a signed-in user,
// so auth is the shared WEBHOOK_SECRET header instead of a Supabase JWT.
//
// Secrets (set via `supabase secrets set`, never committed):
//   RESEND_API_KEY      Resend API key
//   NOTIFICATION_EMAIL  where to send (must be the Resend account owner's address
//                       while using the onboarding@resend.dev sender)
//   WEBHOOK_SECRET      must match the `notify_webhook_secret` Vault secret
// SUPABASE_URL is provided automatically by the Edge Functions runtime.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFICATION_EMAIL = Deno.env.get("NOTIFICATION_EMAIL");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

// https://<ref>.supabase.co -> dashboard table editor for that project.
const projectRef = new URL(SUPABASE_URL || "https://unknown.supabase.co").hostname.split(".")[0];
const TABLE_EDITOR_URL = `https://supabase.com/dashboard/project/${projectRef}/editor`;

type SpotRow = {
  name?: string;
  address?: string;
  description?: string;
  category?: string;
  submitted_by?: string | null;
  status?: string;
};

// Hash both sides first so the comparison is constant-time regardless of length.
async function secretMatches(provided: string | null): Promise<boolean> {
  if (!provided || !WEBHOOK_SECRET) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(provided)),
    crypto.subtle.digest("SHA-256", enc.encode(WEBHOOK_SECRET)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

// Submissions are public input — escape before putting them in HTML.
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmail(spot: SpotRow) {
  const rows: [string, unknown][] = [
    ["Name", spot.name],
    ["Address", spot.address],
    ["Category", spot.category],
    ["Description", spot.description],
  ];
  if (spot.submitted_by) rows.push(["Submitted by", spot.submitted_by]);

  const html = `
    <h2 style="font-family:Georgia,serif;color:#6A5A48;">New spot submitted</h2>
    <table cellpadding="6" style="font-family:system-ui,sans-serif;font-size:14px;color:#5C4A35;">
      ${rows.map(([k, v]) => `<tr><td valign="top"><strong>${k}</strong></td><td>${esc(v)}</td></tr>`).join("")}
    </table>
    <p style="font-family:system-ui,sans-serif;font-size:14px;">
      <a href="${TABLE_EDITOR_URL}">Review it in the Supabase table editor</a>
      — set <code>status</code> to <code>approved</code> to publish it.
    </p>`;
  const text = [
    ...rows.map(([k, v]) => `${k}: ${v ?? ""}`),
    "",
    `Review: ${TABLE_EDITOR_URL}`,
  ].join("\n");

  return { subject: `New spot submitted: ${spot.name ?? "(unnamed)"}`, html, text };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!(await secretMatches(req.headers.get("x-webhook-secret")))) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!RESEND_API_KEY || !NOTIFICATION_EMAIL) {
    console.error("RESEND_API_KEY or NOTIFICATION_EMAIL is not set");
    return new Response("Server misconfigured", { status: 500 });
  }

  let payload: { type?: string; table?: string; record?: SpotRow };
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const spot = payload.record;
  // The trigger already filters on this; checked again so a misconfigured
  // trigger can't turn a re-seed into an inbox flood.
  if (payload.type !== "INSERT" || payload.table !== "spots" || spot?.status !== "pending") {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { subject, html, text } = buildEmail(spot);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "30A Mom Map <onboarding@resend.dev>",
      to: [NOTIFICATION_EMAIL],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    console.error("Resend error", res.status, await res.text());
    return new Response("Email failed", { status: 502 });
  }
  return new Response(JSON.stringify({ sent: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
