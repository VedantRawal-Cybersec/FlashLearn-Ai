import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, BookOpen, RefreshCcw, AlertCircle } from "lucide-react";

export default function WeaknessAnalyzer() {
  const session = useAppStore((s) => s.currentSession);

  const analysis = useMemo(() => {
    if (!session) return null;

    // Quiz analysis
    const answeredQuestions = session.quizQuestions.filter((q) => q.userAnswer !== undefined);
    const wrongQuestions = answeredQuestions.filter((q) => q.userAnswer !== q.correctIndex);
    const correctQuestions = answeredQuestions.filter((q) => q.userAnswer === q.correctIndex);
    const quizScore = answeredQuestions.length > 0
      ? Math.round((correctQuestions.length / answeredQuestions.length) * 100)
      : null;

    // Flashcard analysis
    const ratedCards = session.flashcards.filter((c) => c.difficulty !== null);
    const hardCards = session.flashcards.filter((c) => c.difficulty === "hard");
    const mediumCards = session.flashcards.filter((c) => c.difficulty === "medium");
    const easyCards = session.flashcards.filter((c) => c.difficulty === "easy");

    // Weak areas from wrong quiz questions
    const weakFromQuiz = wrongQuestions.map((q) => ({
      topic: q.question,
      source: "Quiz" as const,
      explanation: q.explanation || "Review this topic",
    }));

    // Weak areas from hard flashcards
    const weakFromFlashcards = hardCards.map((c) => ({
      topic: c.front,
      source: "Flashcard" as const,
      explanation: c.back,
    }));

    // Revision plan
    const revisionItems = [
      ...hardCards.map((c) => ({ text: c.front, priority: "high" as const })),
      ...wrongQuestions.map((q) => ({ text: q.question, priority: "high" as const })),
      ...mediumCards.map((c) => ({ text: c.front, priority: "medium" as const })),
    ];

    return {
      quizScore,
      totalQuestions: session.quizQuestions.length,
      answered: answeredQuestions.length,
      correct: correctQuestions.length,
      wrong: wrongQuestions.length,
      hardCards: hardCards.length,
      mediumCards: mediumCards.length,
      easyCards: easyCards.length,
      ratedCards: ratedCards.length,
      totalCards: session.flashcards.length,
      weakAreas: [...weakFromQuiz, ...weakFromFlashcards],
      revisionItems,
    };
  }, [session]);

  if (!session) {
    return (
      <div className="container max-w-3xl py-20 text-center">
        <p className="text-muted-foreground">No study session. Generate one first.</p>
      </div>
    );
  }

  if (!analysis) return null;

  const hasData = analysis.answered > 0 || analysis.ratedCards > 0;

  return (
    <div className="container max-w-3xl py-6 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-2">📊 Weakness Analyzer</h1>
      <p className="text-muted-foreground mb-6 text-sm">Tracks your performance and identifies areas for improvement</p>

      {!hasData ? (
        <div className="text-center py-16 space-y-4">
          <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Complete the quiz and rate flashcards to see your analysis.</p>
          <p className="text-xs text-muted-foreground">
            Quiz answered: {analysis.answered}/{analysis.totalQuestions} · Cards rated: {analysis.ratedCards}/{analysis.totalCards}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Performance Overview */}
          <section className="grid grid-cols-2 gap-3">
            {analysis.quizScore !== null && (
              <div className="border rounded-xl p-4 bg-card text-center">
                <p className="text-3xl font-bold text-foreground">{analysis.quizScore}%</p>
                <p className="text-xs text-muted-foreground mt-1">Quiz Score</p>
                <p className="text-xs text-muted-foreground">{analysis.correct}/{analysis.answered} correct</p>
              </div>
            )}
            <div className="border rounded-xl p-4 bg-card text-center">
              <p className="text-3xl font-bold text-foreground">{analysis.hardCards + analysis.wrong}</p>
              <p className="text-xs text-muted-foreground mt-1">Weak Areas Found</p>
              <p className="text-xs text-muted-foreground">{analysis.hardCards} hard cards · {analysis.wrong} wrong answers</p>
            </div>
          </section>

          {/* Weak Areas */}
          {analysis.weakAreas.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-destructive" /> Your Weak Areas
              </h2>
              <div className="space-y-2">
                {analysis.weakAreas.map((w, i) => (
                  <div key={i} className="border rounded-lg p-3 bg-card">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{w.source}</Badge>
                      <span className="text-sm font-medium text-foreground">{w.topic}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{w.explanation}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Revision Plan */}
          {analysis.revisionItems.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                <RefreshCcw className="h-5 w-5 text-primary" /> Recommended Revision Plan
              </h2>
              <div className="space-y-2">
                {analysis.revisionItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 border rounded-lg p-3 bg-card">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${item.priority === "high" ? "bg-destructive" : "bg-yellow-500"}`} />
                    <span className="text-sm text-foreground flex-1">{item.text}</span>
                    <Badge variant="outline" className={`text-xs ${item.priority === "high" ? "border-destructive/30 text-destructive" : "border-yellow-500/30 text-yellow-600"}`}>
                      {item.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Flashcard Breakdown */}
          {analysis.ratedCards > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                <BookOpen className="h-5 w-5 text-green-500" /> Flashcard Difficulty Breakdown
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-lg p-3 bg-card text-center">
                  <p className="text-xl font-bold text-green-600">{analysis.easyCards}</p>
                  <p className="text-xs text-muted-foreground">Easy</p>
                </div>
                <div className="border rounded-lg p-3 bg-card text-center">
                  <p className="text-xl font-bold text-yellow-600">{analysis.mediumCards}</p>
                  <p className="text-xs text-muted-foreground">Medium</p>
                </div>
                <div className="border rounded-lg p-3 bg-card text-center">
                  <p className="text-xl font-bold text-red-600">{analysis.hardCards}</p>
                  <p className="text-xs text-muted-foreground">Hard</p>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
