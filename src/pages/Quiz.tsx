import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { usePlayer } from "@/lib/player";
import { XP } from "@/lib/gamification";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, ChevronRight, Trophy } from "lucide-react";
import CoinBurst from "@/components/CoinBurst";
import QuizPreparation from "@/components/QuizPreparation";

export default function Quiz() {
  const session = useAppStore((s) => s.currentSession);
  const answerQuestion = useAppStore((s) => s.answerQuizQuestion);
  const awardXp = usePlayer((s) => s.awardXp);
  const resetQuizAnswers = useAppStore((s) => s.resetQuizAnswers);
  const finishQuizAttempt = useAppStore((s) => s.finishQuizAttempt);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [burst, setBurst] = useState(0);

  if (!session || session.quizQuestions.length === 0) {
    return (
      <div className="container max-w-3xl py-20 text-center animate-fade-in">
        <p className="text-muted-foreground">No quiz available. Generate a study session first.</p>
      </div>
    );
  }

  const questions = session.quizQuestions;
  const total = questions.length;

  if (showResults) {
    const correct = questions.filter((q) => q.userAnswer === q.correctIndex).length;
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="container max-w-2xl py-10 px-4 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-6">Quiz Results</h1>
        <QuizPreparation generation={session.generation} />
        <div className="rounded-2xl border bg-card p-8 text-center mb-8 animate-scale-in">
          <Trophy className="h-10 w-10 text-primary mx-auto mb-3 animate-bounce-subtle" />
          <p className="text-5xl font-extrabold text-primary mb-2">{pct}%</p>
          <p className="text-muted-foreground">{correct} of {total} correct</p>
        </div>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const isCorrect = q.userAnswer === q.correctIndex;
            return (
              <div
                key={q.id}
                className={cn("rounded-xl border bg-card p-4 opacity-0 animate-fade-in-up", `stagger-${Math.min(i + 1, 8)}`)}
              >
                <div className="flex items-start gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <p className="font-medium text-foreground text-sm">{i + 1}. {q.question}</p>
                </div>
                <div className="ml-7 mt-1 space-y-1">
                  {!isCorrect && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Your answer:</span> {q.userAnswer === undefined ? "Not answered" : q.options[q.userAnswer]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-success">Correct:</span> {q.options[q.correctIndex]}
                      </p>
                    </>
                  )}
                  {q.explanation && (
                    <p className="text-sm text-muted-foreground mt-2 p-3 rounded-lg bg-accent/50 border border-border">
                      <span className="font-medium text-foreground">💡 Explanation:</span> {q.explanation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 flex-wrap"><Link to="/rescue" className="pixel-btn">Start Rescue Mode</Link><Link to="/brain" className="pixel-btn">Knowledge DNA</Link></div>
        <Button className="mt-6 hover-scale" onClick={() => { resetQuizAnswers(); setShowResults(false); setCurrentIndex(0); setAnimKey(k => k + 1); }}>
          Retry Quiz
        </Button>
      </div>
    );
  }

  const q = questions[currentIndex];
  const answered = q.userAnswer !== undefined;

  return (
    <div className="container max-w-2xl py-10 px-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Quiz</h1>
        <span className="text-sm text-muted-foreground font-medium">{currentIndex + 1} / {total}</span>
      </div>

      <QuizPreparation generation={session.generation} />
      <div className="h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      <div key={animKey} className="relative rounded-2xl border bg-card p-6 mb-6 animate-card-flip-in">
        {burst > 0 && <CoinBurst key={burst} className="left-1/2 top-1/3" onDone={() => setBurst(0)} />}
        {q.questionType && <p className="text-sm text-primary mb-2 capitalize">{q.questionType} question</p>}
        <p className="text-lg font-medium text-foreground mb-6">{q.question}</p>
        <div className="space-y-3">
          {q.options.map((opt, i) => {
            const selected = q.userAnswer === i;
            const isCorrect = i === q.correctIndex;
            return (
              <button
                key={i}
                disabled={answered}
                onClick={() => { answerQuestion(q.id, i); if (i === q.correctIndex) { awardXp(XP.quizCorrect, "quiz"); setBurst((b) => b + 1); } }}
                className={cn(
                  "w-full text-left rounded-xl border p-4 text-sm font-medium transition-all duration-200 opacity-0 animate-slide-in-bottom",
                  `stagger-${i + 1}`,
                  !answered && "hover:border-primary hover:bg-accent hover-scale",
                  answered && isCorrect && "border-success bg-success/10 text-foreground",
                  answered && selected && !isCorrect && "border-destructive bg-destructive/10 text-foreground",
                  !answered && "text-foreground"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {answered && q.explanation && (
          <div className="mt-4 p-4 rounded-xl bg-accent/50 border border-border animate-fade-in">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">💡 Explanation:</span> {q.explanation}
            </p>
          </div>
        )}
      </div>

      {answered && (
        <div className="flex justify-end animate-fade-in">
          {currentIndex < total - 1 ? (
            <Button onClick={() => { setCurrentIndex((i) => i + 1); setAnimKey((k) => k + 1); }} className="hover-scale">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => { finishQuizAttempt(); setShowResults(true); }} className="hover-scale">See Results</Button>
          )}
        </div>
      )}
    </div>
  );
}
