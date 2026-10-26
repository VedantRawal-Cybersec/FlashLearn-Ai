# Source-grounded tutoring: evidence contract

- The study-generation Edge Function rejects YouTube videos without actual captions rather than inventing a lesson from a title.
- A successful generation returns a 6,000-character bounded original **excerpt** for the student to inspect and use as AI Tutor input. This is not guaranteed to contain the entire PDF, every page, or caption timestamps; the interface must not make page-number or video-timestamp citations unless independently supplied.
- The tutor model cannot perform web retrieval. Its response must not manufacture external URLs or claim that a source has been checked.
- The server accepts quoted snippets only when they exactly occur in the submitted source excerpt (max three, max 180 characters). These are *exact matches to user content*, not external third-party fact checks.
- Old sessions without `sourceContext` use generated flashcards for context; such fallback is not authoritative primary-source evidence.
- Genuine, verifiable page- and timestamp-linked citations require a separate extraction pipeline storing location metadata, with source content retained by the student under clear privacy and deletion controls.
- All Edge Function changes still require explicit deployment to the **actual authorized Supabase project**. GitHub/Vercel changes alone do not update function code.
