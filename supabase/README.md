# Supabase: new-submission email (Phase 6)

When someone submits a spot (a `pending` row is inserted into `spots`), a Postgres
trigger calls the `notify-new-submission` Edge Function, which emails you via Resend.
No client code is involved.

```
SubmitForm → insert into spots (status='pending')
          → trigger notify_new_submission (WHEN status = 'pending')
          → pg_net POST + x-webhook-secret header
          → Edge Function → Resend → your inbox
```

Project ref: `hvpenqaulaaszalxdplo`

## One-time setup

### 1. Resend
1. Sign up at https://resend.com with the address you want notifications sent to.
2. **API Keys → Create API Key** (permission: "Sending access"). Copy it.

No domain verification is needed: the `onboarding@resend.dev` sender can only send
to the Resend account owner's own address, which is exactly this use case.

### 2. Supabase CLI
```sh
brew install supabase/tap/supabase
supabase login
```

### 3. Function secrets
Generate a webhook secret and keep it handy for step 5:
```sh
openssl rand -hex 32
```
Then:
```sh
supabase secrets set --project-ref hvpenqaulaaszalxdplo \
  RESEND_API_KEY=re_xxx \
  NOTIFICATION_EMAIL=you@example.com \
  WEBHOOK_SECRET=<the hex string from above>
```

### 4. Deploy the function
From the repo root:
```sh
supabase functions deploy notify-new-submission --no-verify-jwt --project-ref hvpenqaulaaszalxdplo
```
`--no-verify-jwt` is intentional: the caller is the database, and the function
authenticates it with `WEBHOOK_SECRET` instead.

### 5. Database side (Supabase dashboard → SQL editor)
Store the URL and the same secret in Vault (run once):
```sql
select vault.create_secret(
  'https://hvpenqaulaaszalxdplo.supabase.co/functions/v1/notify-new-submission',
  'notify_function_url'
);
select vault.create_secret('<the same hex string>', 'notify_webhook_secret');
```
Then paste and run [`sql/notify-new-submission-trigger.sql`](sql/notify-new-submission-trigger.sql).

To rotate the secret later: `supabase secrets set WEBHOOK_SECRET=...` and
`select vault.update_secret((select id from vault.secrets where name = 'notify_webhook_secret'), '<new>');`

## Verify
- Submit a spot through the app → email arrives within a minute or two.
- `insert into spots (..., status) values (..., 'approved')` → no email.
- `curl -X POST https://hvpenqaulaaszalxdplo.supabase.co/functions/v1/notify-new-submission -d '{}'` → `401 Unauthorized`.
- If an email doesn't arrive: **Edge Functions → notify-new-submission → Logs**, and
  `select * from net._http_response order by created desc limit 5;` for the trigger's side.
