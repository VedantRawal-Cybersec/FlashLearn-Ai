/** Transparent SM-2-inspired review intervals, not a claim of FSRS equivalence. */
export type ReviewRating = "again" | "hard" | "good" | "easy";
export interface ReviewSchedule {
  dueAt: string;
  lastReviewedAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
}
export interface ReviewableCard { review?: ReviewSchedule }
const DAY = 86400000;
const MINUTE = 60000;
export function isReviewDue(card: ReviewableCard, now = new Date()): boolean {
  if (!card.review) return true; // New cards are immediately available to learn.
  const due = Date.parse(card.review.dueAt);
  return !Number.isFinite(due) || due <= now.getTime();
}
export function scheduleReview(previous: ReviewSchedule | undefined, rating: ReviewRating, now = new Date()): ReviewSchedule {
  const ease = previous?.easeFactor ?? 2.5;
  const repeats = previous?.repetitions ?? 0;
  const days = previous?.intervalDays ?? 0;
  const lapses = previous?.lapses ?? 0;
  let intervalDays = 0;
  let nextEase = ease;
  let nextRepeats = repeats;
  let nextLapses = lapses;
  let dueInMs: number;
  if (rating === "again") {
    nextEase = Math.max(1.3, ease - 0.2);
    nextRepeats = 0;
    nextLapses++;
    dueInMs = 10 * MINUTE;
    intervalDays = 0;
  } else {
    if (rating === "hard") {
      nextEase = Math.max(1.3, ease - 0.15);
      intervalDays = Math.max(1, Math.ceil(days * 1.2));
    } else if (rating === "easy") {
      nextEase = Math.min(3, ease + 0.15);
      intervalDays = Math.max(repeats === 0 ? 4 : 1, Math.ceil((days || 1) * nextEase * 1.3));
    } else {
      intervalDays = repeats === 0 ? 1 : repeats === 1 ? 3 : Math.max(1, Math.ceil((days || 1) * ease));
    }
    nextRepeats++;
    dueInMs = Math.min(intervalDays, 3650) * DAY;
  }
  return {
    dueAt: new Date(now.getTime() + dueInMs).toISOString(),
    lastReviewedAt: now.toISOString(),
    intervalDays: Math.min(intervalDays, 3650),
    easeFactor: nextEase,
    repetitions: nextRepeats,
    lapses: nextLapses,
  };
}
