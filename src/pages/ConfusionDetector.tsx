import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConfusingArea {
  original: string;
  simplified: string;
  why_confusing: string;
}

export default function ConfusionDetector() {
  const session = useAppStore((s) => s.currentSession);
  const [areas, setAreas] = useState<ConfusingArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

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
      const { data, error } = await supabase.functions.invoke("confusion-detector", {
        body: { title: session.title, context },
      });
      if (error) throw error;
      setAreas(data.areas || []);
      setGenerated(true);
    } catch {
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i: number) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="container max-w-3xl py-6 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-2">🔍 Confusion Detector</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Identifies complex sections and provides simplified explanations
      </p>

      {!generated ? (
        <div className="text-center py-16 space-y-4">
          <AlertTriangle className="h-12 w-12 text-primary mx-auto" />
          <p className="text-muted-foreground">
            Analyze <span className="font-medium text-foreground">"{session.title}"</span> for confusing areas
          </p>
          <Button onClick={handleGenerate} disabled={loading} size="lg">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
            ) : (
              <><AlertTriangle className="h-4 w-4 mr-2" /> Detect Confusing Areas</>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {areas.map((area, i) => (
            <div key={i} className="border rounded-xl bg-card shadow-sm overflow-hidden">
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
              >
                <span className="mt-1 flex-shrink-0 h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{area.original}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">⚠️ Students often get confused here</p>
                </div>
                {expanded[i] ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
              </button>
              {expanded[i] && (
                <div className="px-4 pb-4 border-t">
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Simplified Explanation</span>
                    </div>
                    <p className="text-sm text-foreground">{area.simplified}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Why it's confusing:</strong> {area.why_confusing}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
