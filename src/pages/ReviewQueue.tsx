import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { isReviewDue, type ReviewRating } from "@/lib/spaced-repetition";

export default function ReviewQueue() {
  const sessions = useAppStore(s => s.sessions);
  const current = useAppStore(s => s.currentSession);
  const reviewCard = useAppStore(s => s.reviewFlashcard);
  const [flipped, setFlipped] = useState(false);
  const source = useMemo(() => current ? [current, ...sessions.filter(s => s.id !== current.id)] : sessions, [current, sessions]);
  const now = new Date();
  const due = source.flatMap(session => session.flashcards.filter(card => isReviewDue(card, now)).map(card => ({ session, card })));
  const pending = due[0];
  const complete = (rating: ReviewRating) => {
    if (!pending) return;
    reviewCard(pending.session.id, pending.card.id, rating);
    setFlipped(false);
  };
  const nextDue = source.flatMap(s => s.flashcards.map(c => c.review?.dueAt).filter((x):x is string=>!!x))
    .sort()[0];
  return <div className="container max-w-3xl px-5 py-10 space-y-6 animate-fade-in">
    <header className="pixel-panel p-6 space-y-2">
      <h1 className="text-3xl font-bold">Daily Review Queue</h1>
      <p className="text-muted-foreground">Active recall: reveal the answer, then rate your recall to schedule the next review. Your schedule stays in this browser until secure cloud sync is enabled.</p>
      <p aria-live="polite" className="font-semibold">{due.length} cards due now</p>
    </header>
    {pending ? <div className="pixel-panel p-7 space-y-5">
      <p className="text-sm text-muted-foreground">{pending.session.title}</p>
      <p className="text-xl font-semibold">{pending.card.front}</p>
      {!flipped ? <button className="pixel-btn" onClick={() => setFlipped(true)}>Show answer</button> : <>
        <div className="bg-card border p-4"><p>{pending.card.back}</p></div>
        <p className="text-sm text-muted-foreground">How well did you remember?</p>
        <div className="flex flex-wrap gap-2">
          <button className="pixel-btn" onClick={() => complete("again")}>Again · 10 min</button>
          <button className="pixel-btn" onClick={() => complete("hard")}>Hard</button>
          <button className="pixel-btn" onClick={() => complete("good")}>Good</button>
          <button className="pixel-btn" onClick={() => complete("easy")}>Easy</button>
        </div>
      </>}
    </div> : <div className="pixel-panel p-7 space-y-3">
      <h2 className="text-xl font-bold">You're caught up!</h2>
      <p>{source.length === 0 ? "Create a study session or try a free sample quest to begin reviewing." : nextDue ? "Next scheduled card: " + new Date(nextDue).toLocaleString() : "No cards scheduled yet."}</p>
      <Link to="/" className="text-primary underline">Start another study quest</Link>
    </div>}
  </div>;
}
