import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Loader2, Star, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PriorityTopic {
  topic: string;
  reason: string;
  priority: string;
}
interface QuestionType {
  type: string;
  examples: string[];
}
interface PredictedQuestion {
  question: string;
  difficulty: string;
  type: string;
  hint: string;
}
interface Predictions {
  highPriorityTopics: PriorityTopic[];
  frequentlyAskedTypes: QuestionType[];
  predictedQuestions: PredictedQuestion[];
}

export default function ExamPredictor() {
  const session = useAppStore((s) => s.currentSession);
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});

  if (!session) {
    return (
      <div className="container max-w-3xl py-20 text-center">
        <p className="text-muted-foreground">No study session. Generate one first.</p>
      </div>
    );
  }

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const context = session.flashcards.map((c) => `Q: ${c.front}\nA: ${c.back}`).join("\n\n");
      const { data, error } = await supabase.functions.invoke("exam-predictor", {
        body: { title: session.title, context },
      });
      if (error) throw error;
      setPredictions(data.predictions);
    } catch {
      toast.error("Failed to predict. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = (d: string) => {
    if (d === "easy") return "bg-green-500/10 text-green-700 dark:text-green-400";
    if (d === "hard") return "bg-red-500/10 text-red-700 dark:text-red-400";
    return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  };

  return (
    <div className="container max-w-3xl py-6 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-2">🎯 AI Practice Focus</h1>
      <p className="text-muted-foreground mb-6 text-sm">Suggests practice areas from your lesson, not statistically verified predictions of actual exam questions.</p>

      {!predictions ? (
        <div className="text-center py-16 space-y-4">
          <Target className="h-12 w-12 text-primary mx-auto" />
          <p className="text-muted-foreground">
            Suggest question ideas for <span className="font-medium text-foreground">"{session.title}"</span>
          </p>
          <Button onClick={handleGenerate} disabled={loading} size="lg">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Predicting...</> : <><Target className="h-4 w-4 mr-2" /> Suggest Practice Questions</>}
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* High Priority Topics */}
          <section>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-yellow-500" /> High Priority Topics
            </h2>
            <div className="space-y-2">
              {predictions.highPriorityTopics?.map((t, i) => (
                <div key={i} className="border rounded-lg p-3 bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs">Suggested</Badge>
                    <span className="font-medium text-sm text-foreground">{t.topic}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.reason}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Question Types */}
          <section>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
              <HelpCircle className="h-5 w-5 text-blue-500" /> Suggested Question Types
            </h2>
            <div className="space-y-3">
              {predictions.frequentlyAskedTypes?.map((qt, i) => (
                <div key={i} className="border rounded-lg p-3 bg-card">
                  <p className="font-medium text-sm text-foreground mb-2">{qt.type}</p>
                  <ul className="space-y-1">
                    {qt.examples?.map((ex, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Predicted Questions */}
          <section>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-red-500" /> Suggested Practice Questions
            </h2>
            <div className="space-y-3">
              {predictions.predictedQuestions?.map((q, i) => (
                <div key={i} className="border rounded-lg p-3 bg-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-foreground flex-1">{q.question}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">{q.type}</Badge>
                      <Badge className={`text-xs ${difficultyColor(q.difficulty)}`}>{q.difficulty}</Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHints((prev) => ({ ...prev, [i]: !prev[i] }))}
                    className="text-xs text-primary hover:underline"
                  >
                    {showHints[i] ? "Hide Hint" : "Show Hint"}
                  </button>
                  {showHints[i] && (
                    <p className="text-xs text-muted-foreground mt-1 p-2 rounded bg-primary/5">💡 {q.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
