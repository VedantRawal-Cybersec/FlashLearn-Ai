# Flash Learn release gate (23 October 2026)

## Verified repository state
- GitHub production branch before this patch: 38453dbae25ce86b281a268e49da99b199ffdaad.
- Tests, TypeScript compiler check and Vite production build passed in GitHub Actions.
- Exam practice includes subject/chapter selection, personal study coach, timed single-correct drill and new private browser study sessions.

## Must complete before asserting production works
1. Confirm latest commit deployed in Vercel production environment (not a preview) and `flash-learn-ai.vercel.app` points to that deployment. Hobby tier has a 100-deployments-per-day limit.
2. Confirm actual Supabase project `wlqeenyeyaufugdqdtre` is authorized under the connected account and view its active RLS policies before touching data.
3. Back up and restrict the legacy public `study_sessions` table. It has historical rows without owner information; do not attribute them to arbitrary users.
4. Create private per-user `study_sessions_v2` with authenticated owner-scoped RLS; test anonymous, owner and cross-account read/write/delete.
5. Deploy all relevant Supabase Edge Functions to the same project; the Vercel frontend build does not deploy those functions.
6. Check Lovable AI gateway authorization and credits, secure uploaded-study-file handling, transcript retrieval, and numerical answer validation. Do not claim official examination accuracy without a benchmark using independently verified questions.
7. Test logged-out and signed-in journeys, persisted progress, quiz retry, timed drill, coach data, PDF import and video caption failures.
8. Test in real browsers at 320/390/768/1440 px, check web-vitals, animation frame pacing, console errors, and voice access permissions.
9. Rebuild the npm lockfile for repeatable `npm ci`; current CI uses `npm install` due existing lock inconsistency.

## Known current conditions
- Authenticated access to the real Supabase project was denied from the available connector; this is not fixed by writing code.
- Vercel API reports 402 deploy quota and may also require team-scope authorization.
- New session persistence is local browser storage as a precaution. The user should export backups until a per-user cloud backend is verified.
- The exam drill is original AI single-correct practice, not a full official-pattern exam.
