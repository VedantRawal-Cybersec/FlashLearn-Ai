import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { Layers, HelpCircle, Map, MessageCircle, Loader2, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const [url, setUrl] = useState("");
  const { isLoading, setLoading, addSession } = useAppStore();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      toast({ title: "Study materials ready!", description: "Your flashcards, quiz, and roadmap have been generated." });
      navigate("/flashcards");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Layers, title: "Flashcards", desc: "AI-generated cards with spaced repetition" },
    { icon: HelpCircle, title: "Quiz", desc: "Multiple choice to test your knowledge" },
    { icon: Map, title: "Roadmap", desc: "Step-by-step learning path" },
    { icon: MessageCircle, title: "AI Tutor", desc: "Chat about the video content" },
  ];

  return (
    <div className="container max-w-3xl py-12 md:py-20 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground mb-4">
          <Youtube className="h-4 w-4" />
          YouTube → Study Materials
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Learn smarter with <span className="text-primary">Flash Study</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Paste a YouTube URL and instantly get flashcards, quizzes, a learning roadmap, and an AI tutor — all powered by AI.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border bg-card p-5 flex items-start gap-4">
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
    </div>
  );
}
