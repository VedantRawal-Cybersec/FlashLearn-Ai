import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { Layers, HelpCircle, Map, MessageCircle, Loader2, Youtube, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const [url, setUrl] = useState("");
  const { isLoading, setLoading, addSession, sessions, sessionsLoaded, loadSessions, selectSession, deleteSession } = useAppStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!sessionsLoaded) loadSessions();
  }, [sessionsLoaded, loadSessions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-study-materials", {
        body: { videoUrl: url.trim() },
      });

      if (error) throw new Error(error.message || "Failed to generate materials");
      if (data?.error) throw new Error(data.error);

      addSession(data.session);
      setUrl("");
      toast({ title: "Study materials ready!", description: "Your flashcards, quiz, and roadmap have been generated." });
      navigate("/flashcards");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = (id: string) => {
    selectSession(id);
    navigate("/dashboard");
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteSession(id);
    toast({ title: "Session deleted" });
  };

  const features = [
    { icon: Layers, title: "Flashcards", desc: "AI-generated cards with spaced repetition" },
    { icon: HelpCircle, title: "Quiz", desc: "Multiple choice to test your knowledge" },
    { icon: Map, title: "Roadmap", desc: "Step-by-step learning path" },
    { icon: MessageCircle, title: "AI Tutor", desc: "Chat about the video content" },
  ];

  return (
    <div className="container max-w-3xl py-12 md:py-20 px-4 animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground mb-4">
          <Youtube className="h-4 w-4" />
          YouTube → Study Materials
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Transform YouTube Videos into{" "}
          <span className="text-primary">Structured Study Material</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Convert any educational video into AI-powered flashcards, quizzes, notes, and personalized learning roadmaps in seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-14">
        <Input
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 h-12 text-base"
          disabled={isLoading}
        />
        <Button type="submit" size="lg" className="h-12 px-8" disabled={isLoading || !url.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate"
          )}
        </Button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
        {features.map((f, i) => (
          <div key={f.title} className={cn("rounded-xl border bg-card p-5 flex items-start gap-4 hover-lift opacity-0 animate-fade-in-up", `stagger-${i + 1}`)}>
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Session History */}
      {sessions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Study History
          </h2>
          <div className="space-y-3">
            {sessions.map((s, i) => (
              <button
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={cn("w-full rounded-xl border bg-card p-4 flex items-center justify-between hover:border-primary transition-all text-left group hover-lift opacity-0 animate-fade-in-up", `stagger-${Math.min(i + 1, 8)}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(s.createdAt).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                    {" · "}
                    {s.flashcards.length} cards · {s.quizQuestions.length} questions · {s.roadmap.length} steps
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, s.id)}
                  className="ml-3 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Delete session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
