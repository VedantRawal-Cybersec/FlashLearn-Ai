import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { Layers, HelpCircle, Map, MessageCircle, Loader2, Youtube, Clock, Trash2, Zap, Upload, FileText, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Home() {
  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoading, setLoading, addSession, sessions, sessionsLoaded, loadSessions, selectSession, deleteSession } = useAppStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!sessionsLoaded) loadSessions();
  }, [sessionsLoaded, loadSessions]);

  const handleYouTubeSubmit = async (e: React.FormEvent) => {
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:...;base64, prefix
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast({ title: "File too large", description: "Please upload a file under 10MB.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const base64 = await fileToBase64(selectedFile);
      const { data, error } = await supabase.functions.invoke("generate-study-materials", {
        body: {
          fileBase64: base64,
          fileType: selectedFile.type,
          fileName: selectedFile.name,
        },
      });

      if (error) throw new Error(error.message || "Failed to generate materials");
      if (data?.error) throw new Error(data.error);

      addSession(data.session);
      setSelectedFile(null);
      toast({ title: "Study materials ready!", description: "Your flashcards, quiz, and roadmap have been generated." });
      navigate("/flashcards");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && isValidFile(file)) {
      setSelectedFile(file);
    } else {
      toast({ title: "Invalid file", description: "Please upload a PDF or image (PNG, JPG, WEBP).", variant: "destructive" });
    }
  };

  const isValidFile = (file: File) => {
    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/jpg"];
    return validTypes.includes(file.type);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidFile(file)) {
      setSelectedFile(file);
    } else if (file) {
      toast({ title: "Invalid file", description: "Please upload a PDF or image (PNG, JPG, WEBP).", variant: "destructive" });
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
    { icon: MessageCircle, title: "AI Tutor", desc: "Chat about the content" },
  ];

  return (
    <div className="container max-w-3xl py-12 md:py-20 px-4 animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground mb-4">
          <Zap className="h-4 w-4" />
          Any Content → Study Materials
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Transform Any Content into{" "}
          <span className="text-primary">Structured Study Material</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Convert YouTube videos, PDFs, or images into AI-powered flashcards, quizzes, and personalized learning roadmaps in seconds.
        </p>
      </div>

      <Tabs defaultValue="youtube" className="mb-14">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="youtube" className="flex items-center gap-2">
            <Youtube className="h-4 w-4" />
            YouTube URL
          </TabsTrigger>
          <TabsTrigger value="file" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            PDF / Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="youtube">
          <form onSubmit={handleYouTubeSubmit} className="flex flex-col sm:flex-row gap-3">
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
                <>
                  <Zap className="h-4 w-4 fill-current" />
                  Generate
                </>
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="file">
          <div className="space-y-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                selectedFile && "border-primary bg-primary/5"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  {selectedFile.type === "application/pdf" ? (
                    <FileText className="h-8 w-8 text-primary" />
                  ) : (
                    <Image className="h-8 w-8 text-primary" />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="ml-2 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">Drop your file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">Supports PDF, PNG, JPG, WEBP (max 10MB)</p>
                </>
              )}
            </div>
            <Button
              onClick={handleFileSubmit}
              size="lg"
              className="w-full h-12"
              disabled={isLoading || !selectedFile}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-current" />
                  Generate from File
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

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
