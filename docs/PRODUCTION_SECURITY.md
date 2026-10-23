# Flash Learn production security and deployment prerequisites

## Current protective fallback (2026-10-23)
New study sessions are stored on the student's own browser rather than the legacy shared study_sessions table. This avoids uploading new private educational content to a table whose checked-in SQL migration permits unauthenticated SELECT, INSERT, UPDATE, and DELETE.

**Important:** The historic database records remain exposed until the actual Supabase project's access policies are corrected. Local browser storage is per-device, not synchronized or backed up, and can be cleared by the browser.

## Required to complete secure cloud synchronization
1. Connect the Supabase project whose project ID is present in the FlashLearn-Ai repository's VITE_SUPABASE_PROJECT_ID. It is **not** one of the currently visible Supabase projects in this chat.
2. Export and protect the legacy study_sessions table before schema updates. Existing records have no reliable owner ID; do not arbitrarily assign or expose them.
3. Create account identities (or provision secure anonymous user identities with a documented upgrade path) and a new owner-scoped study_sessions_v2 table.
4. Enforce RLS for SELECT/INSERT/UPDATE/DELETE with authenticated ownership checks: (select auth.uid()) = user_id. Reject calls without an owner. Restrict/disable legacy public Data API grants and permissive policies immediately after safely accounting for legacy data.
5. Implement per-user migration only with verifiable ownership; do not bulk-migrate all anonymous records into one account.
6. Add per-user storage, rate limits and quotas for costly AI Edge Functions; audit exposed secrets and backend logs.
7. Re-enable cloud sync in the frontend only after RLS and cross-account isolation tests pass (including attempted BOLA/IDOR).
8. Confirm the updated Edge Functions are deployed in the **same** Supabase project; GitHub/Vercel frontend deploys do not automatically update Supabase Edge Functions.

## Educational safety
All content from the generator is original AI practice. Source-grounded generation must fail when captions are unavailable. Exam modes currently produce single-correct MCQs and should never be described as official full-pattern JEE/NEET/KCET question papers.
