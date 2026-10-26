import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

export default function Notes() {
  const session = useAppStore((s) => s.currentSession);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  if (!session) {
    return (
      <div className="container max-w-3xl py-20 text-center">
        <p className="text-muted-foreground">No study session. Generate one first to create notes.</p>
      </div>
    );
  }

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const context = session.sourceContext?.text || session.flashcards
        .map((c) => `Q: ${c.front}\nA: ${c.back}`)
        .join("\n\n");

      const { data, error } = await supabase.functions.invoke("generate-notes", {
        body: { title: session.title, context },
      });

      if (error) throw error;
      setNotes(data.notes);
      setGenerated(true);
    } catch {
      setNotes("Sorry, failed to generate notes. Please try again.");
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([notes], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.title.replace(/[^a-zA-Z0-9]/g, "_")}_notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container max-w-3xl py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">📝 Study Notes</h1>
        {generated && notes && (
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
      </div>

      {!generated ? (
        <div className="text-center py-16 space-y-4">
          <BookOpen className="h-12 w-12 text-primary mx-auto" />
          <p className="text-muted-foreground">
            Generate detailed study notes from{" "}
            <span className="font-medium text-foreground">"{session.title}"</span>
          </p>
          <Button onClick={handleGenerate} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Notes...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Generate Notes
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:mt-6 prose-headings:mb-2 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:my-2 prose-li:my-1 prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded prose-blockquote:py-1 prose-blockquote:px-3 prose-hr:my-4 bg-card border rounded-xl p-6 shadow-sm">
          <ReactMarkdown>{notes}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
