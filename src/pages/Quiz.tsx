import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, ChevronRight, Trophy } from "lucide-react";

export default function Quiz() {
  const session = useAppStore((s) => s.currentSession);
  const answerQuestion = useAppStore((s) => s.answerQuizQuestion);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [animKey, setAnimKey] = useState(0);

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
                {!isCorrect && (
                  <p className="text-sm text-muted-foreground ml-7">
                    Correct: {q.options[q.correctIndex]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <Button className="mt-6 hover-scale" onClick={() => { setShowResults(false); setCurrentIndex(0); }}>
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

      <div className="h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      <div key={animKey} className="rounded-2xl border bg-card p-6 mb-6 animate-card-flip-in">
        <p className="text-lg font-medium text-foreground mb-6">{q.question}</p>
        <div className="space-y-3">
          {q.options.map((opt, i) => {
            const selected = q.userAnswer === i;
            const isCorrect = i === q.correctIndex;
            return (
              <button
                key={i}
                disabled={answered}
                onClick={() => answerQuestion(q.id, i)}
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
      </div>

      {answered && (
        <div className="flex justify-end animate-fade-in">
          {currentIndex < total - 1 ? (
            <Button onClick={() => { setCurrentIndex((i) => i + 1); setAnimKey((k) => k + 1); }} className="hover-scale">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => setShowResults(true)} className="hover-scale">See Results</Button>
          )}
        </div>
      )}
    </div>
  );
}
