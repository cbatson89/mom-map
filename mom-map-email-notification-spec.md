
# 30A Mom Map — Feature Spec: Email Notification on New Submission

## Assumptions

- The re-architecture rebuild is already complete, including the Supabase backend: a `spots` table exists with (at minimum) `name`, `address`, `description`, `category`, `submitted_by` (nullable), and `status` (`'approved' | 'pending' | 'rejected'`, default `'pending'`) columns. Confirm the actual column names before starting — adjust field names below if they differ from this assumption.
- New user submissions insert a row with `status = 'pending'`; the app's seed/migration step (if one was used to load the original spot data) inserted rows with `status = 'approved'` directly, bypassing the normal submission flow.

## Goal

Whenever a new spot is submitted (a `pending` row lands in the `spots` table), send an email so you know to log into Supabase and review it — without having to check the dashboard proactively.

## Design

- **Trigger:** a Supabase Database Webhook on the `spots` table, firing on `INSERT`, **scoped to `status = 'pending'`**. This scoping matters: if the webhook fired on every insert unconditionally, any future bulk-load or re-seed of approved spots (`status = 'approved'`) would also fire it and spam your inbox. Filtering to `status = 'pending'` means it only ever fires for genuine new user submissions.
- The webhook calls a **Supabase Edge Function** (e.g. `notify-new-submission`), which receives the new row's data and sends an email via **Resend**.
- **Resend setup:** use Resend's default `onboarding@resend.dev` sender — this works without verifying a custom domain, as long as the email is sent *to* the Resend account owner's own verified email address, which is exactly this use case (notifying yourself). No domain verification is needed to get this working. If you later want a branded "from" address, that requires verifying a domain in Resend, but it's not necessary for this feature.
- **Email content:** subject like "New spot submitted: {name}"; body with the spot's name, address, description, category, and `submitted_by` (if provided), plus a direct link to the Supabase project's table editor so you can jump straight to reviewing it.
- **Secrets:** `RESEND_API_KEY` and `NOTIFICATION_EMAIL` (the address to send to) must be set as Supabase Edge Function secrets (`supabase secrets set`) — never committed to the repo or exposed to client-side code.
- **Security:** the Edge Function should validate that the incoming request is genuinely from Supabase's webhook (via the webhook signing secret Supabase provides), so it can't be triggered by an arbitrary public request and used to spam your email.
- This is entirely server-side — no changes needed to the submission form or any client code. The email fires from the database trigger regardless of what UI path created the insert.

## Claude Code prompt

> Set up an email notification for new spot submissions in this app. The `spots` table in Supabase already exists with a `status` column (default `'pending'` on new submissions, `'approved'` for live spots) — confirm the exact schema before starting.
>
> 1. Write a Supabase Edge Function (e.g. `supabase/functions/notify-new-submission/index.ts`) that receives a Supabase Database Webhook payload for an `INSERT` on the `spots` table, and sends an email via Resend's API to a `NOTIFICATION_EMAIL` address using the `RESEND_API_KEY` secret. Use Resend's default `onboarding@resend.dev` sender (no domain verification needed since we're sending to the account owner's own address). Email subject: "New spot submitted: {name}". Body: name, address, description, category, `submitted_by` (if present), and a link to the Supabase project's table editor.
> 2. Validate the webhook request is genuinely from Supabase (using the webhook signing secret) before processing it, so the function can't be triggered by an arbitrary public request.
> 3. Give me the exact steps to configure the Database Webhook in the Supabase dashboard: trigger on `INSERT` to the `spots` table, **scoped to `status = 'pending'`** — this is important so bulk/seed inserts of already-approved spots never trigger this webhook.
> 4. Tell me exactly what to run to set the `RESEND_API_KEY` and `NOTIFICATION_EMAIL` secrets via the Supabase CLI, and what to sign up for at resend.com if I don't have an account yet.
> 5. No changes needed to any client-side code (the submission form, submit handler, etc.) — this is entirely a server-side/database trigger. Confirm this by testing: submit a new spot through the app, and confirm an email arrives without touching the frontend.

## Verification checklist

- [ ] Submitting a new spot through the app results in an email arriving at the configured address within a minute or two.
- [ ] Inserting or editing rows with `status = 'approved'` does **not** trigger an email.
- [ ] The email contains the spot's name, address, description, and `submitted_by` if provided, plus a working link to the Supabase table editor.
- [ ] `RESEND_API_KEY` and `NOTIFICATION_EMAIL` are stored as Edge Function secrets, not committed to the repo.
- [ ] The Edge Function rejects requests that don't carry a valid Supabase webhook signature.
- [ ] No changes were made to any client-side submission code.
