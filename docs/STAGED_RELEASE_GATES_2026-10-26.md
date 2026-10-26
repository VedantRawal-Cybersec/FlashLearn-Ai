# Flash Learn — Staged Release Gate and Honest Capability Inventory
**Branch:** `feat/commercial-foundation-private-sync-exam-quality`
**Prepared:** 2026-10-26
**Production release:** NOT AUTHORIZED in this request. Do not merge this branch into `main` or promote its Vercel preview until a separate explicit user instruction.

## Delivered in this development branch, awaiting release

| Capability | Code-level implementation | Verification requirement |
|---|---|---|
| Optional student email sign-in | `/account` via Supabase OTP; no new sign-in requirement for offline usage | Auth provider and allowed redirect URL configured in actual project |
| Private study cloud backups | Explicit preview → restore/download missing IDs or upload new IDs, no automatic overwrites | Run RLS isolation tests in real Supabase backend; no anonymous access |
| Legacy study-session security | SQL revokes legacy public policies and table privileges; preserves legacy rows for recovery | BACKUP FIRST; authorized schema migration, audit prior ownerless records |
| AI abuse cost control | Atomic per-user five-image-analysis daily counter, JWT-gated API | Deployed SQL + authorized Edge Function + request quota race tests |
| Handwriting diagnosis | Bounded PNG/JPEG/WebP upload, optional problem, provider-based hints/uncertainty | Auth, AI provider key, model availability, consent/privacy and expert quality tests |
| Source-aware Tutor | Original bounded excerpt in session; reject fabricated web citation claims and nonmatching quotes | Deploy updated functions; run source grounding/failure-mode evaluation |
| Learning Insights | Offline attempt counts, topic progress and CSV export based on actual local activity | Browser tests, real users to validate usefulness |
| Peer study circles | Share fixed original sample challenge by URL without personal info | Browser tests; not live teacher/student backend |
| Advanced question types | Original multiple-correct problem demos and written-response self-rubric | Subject-expert correctness review, official format/marking validation |
| Bilingual vocabulary | Small English→Hindi/Kannada revision glossary | Linguistic and subject review before describing as a full curriculum |

## Blockers that prevent claiming "everything is complete"

1. **Supabase project access.** The actual Flash Learn project `wlqeenyeyaufugdqdtre` rejects management operations in the connected account. Neither SQL migrations nor new/updated Edge Functions have been applied. The legacy policies may still be active in production. This requires owner authorization and independent security verification.
2. **Student data ownership.** Historical `study_sessions` rows have no verified `user_id`. Do not silently assign legacy rows to arbitrary new accounts; perform a backup, freeze public access, and reconcile ownership with confirmed users if feasible.
3. **Licensing and academic accuracy.** Original demo questions have not undergone independent teacher review or empirical 98%-accuracy evaluation. A real JEE/NEET/KCET PYQ library requires correct permissions, paper-year/shift provenance, authoritative answer keys, and subject-expert QA.
4. **Full paper realism.** The new multiple-correct, MCQ, numerical and descriptive examples are *format demonstrations*, not full official papers. JEE Advanced requires paper-specific question/partial-marking rules; board grading must match specific state, year and rubric.
5. **Handwriting and tutoring quality.** The new vision endpoint and revised Tutor are source-staged, not deployed. No 100% handwritten step recognition can be guaranteed; evaluate ambiguous handwriting and misread equations on real consented datasets.
6. **Real classrooms.** Peer challenge links work without accounts, but teacher-owned groups, invite membership, school consent, moderated discussion and shared gradebooks require real security-reviewed backend tables and moderation policies.
7. **Payments and SaaS economics.** No live checkout was authorized or configured. Real subscriptions require chosen prices, payment provider, verified webhooks, refund/cancel terms, invoice/tax compliance and actual server-verified entitlements. Do not create a fake upgrade flow.
8. **Commercial analytics.** Device-private learning metrics are implemented. Platform acquisition, conversion, revenue and retention cohorts require opt-in event collection, a privacy policy, service-side analytics and enough actual users.
9. **Region and accessibility.** Hindi/Kannada coverage is a starter glossary only. A complete bilingual study curriculum requires educator/editor review, translations of every workflow, and screen-reader/accessibility audits.
10. **Live performance.** GitHub unit/build/browser checks do not replace measured real-device Core Web Vitals, low-memory Android testing and production service monitoring.

## Safe rollout sequence after the user authorizes a later release

1. **Owner**: confirm the intended Supabase project, the latest backup, and project access.
2. Use the Supabase CLI `supabase migration new <name>` and copy the reviewed contents from `supabase/sql/private_study_sessions_security.sql` into the generated migration. This repository intentionally stages reviewed SQL rather than executing it without access.
3. Apply security policies and deny legacy anonymous/cross-user CRUD. Confirm the retained legacy rows have not been deleted. Test with two real non-privileged accounts and an anonymous client:
   - Anonymous SELECT/UPDATE/DELETE on both legacy and private tables must fail.
   - User A must not read/update/delete User B's row, even with a guessed UUID.
   - User A may read/update its own rows, while changing `user_id` to User B must fail.
   - Authenticated user call count must cap at five handwriting requests per day, including concurrent submissions.
4. Configure Supabase email provider, Site URL, and allowed redirects to include the actual deployed domain and appropriate preview domains. Configure a protected AI gateway key on the server only.
5. Deploy `generate-study-materials`, `ai-tutor`, and `analyze-handwriting` Edge Functions. Keep JWT verification enabled. Evaluate malicious prompts, missing source text, provider errors, quota exhaustion, and image/response validation.
6. Run CI, E2E, real backend integration, accessibility and device performance tests.
7. Apply student feedback/educator review to academic content and mark only independently reviewed original/PYQ items as verified.
8. Obtain **separate user authorization to deploy the website**. Promote only the reviewed build with release gates passing and a rollback plan.

## Release communication rules

- **Implemented in GitHub:** source exists in the branch.
- **Tested:** CI and verified browser tests passed, with the specific run recorded.
- **Backend live:** relevant real Supabase functions/tables respond under tested authorization controls.
- **Released:** production domain points to exact reviewed commit and public smoke tests pass.
- **Market leading:** comparative user-task data supports the claim.

Never collapse these states into the word "done".
