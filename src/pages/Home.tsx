import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { Loader2, Youtube, Clock, Trash2, Upload, FileText, Image, X, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useReveal, useParallax } from "@/hooks/use-reveal";
import {
  PixelStar, PixelCoin, PixelBolt, PixelCloud, PixelPlanet, PixelChest, PixelSlime,
  PixelWizard, PixelRobot, PixelBook, PixelScroll, PixelTrophy, PixelController,
  PixelBadge, PixelTerrain, PixelPipe,
} from "@/components/PixelArt";

export default function Home() {
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState<"youtube" | "file">("youtube");
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoading, setLoading, addSession, sessions, sessionsLoaded, loadSessions, selectSession, deleteSession } = useAppStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useParallax(setScrollY);
  useReveal([sessions.length, tab]);

  useEffect(() => {
    if (!sessionsLoaded) loadSessions();
  }, [sessionsLoaded, loadSessions]);

  const handleYouTubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-study-materials", {
        body: { videoUrl: url.trim(), questionCount },
      });

      if (error) throw new Error(error.message || "Failed to generate materials");
      if (data?.error) throw new Error(data.error);

      addSession(data.session);
      setUrl("");
      toast({ title: "Quest ready!", description: "Your flashcards, quiz battle and roadmap have been generated." });
      navigate("/flashcards");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSubmit = async () => {
    if (!selectedFile) return;

    const maxSize = 10 * 1024 * 1024;
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
          questionCount,
        },
      });

      if (error) throw new Error(error.message || "Failed to generate materials");
      if (data?.error) throw new Error(data.error);

      addSession(data.session);
      setSelectedFile(null);
      toast({ title: "Quest ready!", description: "Your flashcards, quiz battle and roadmap have been generated." });
      navigate("/flashcards");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isValidFile = (file: File) =>
    ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/jpg"].includes(file.type);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && isValidFile(file)) setSelectedFile(file);
    else toast({ title: "Invalid file", description: "Please upload a PDF or image (PNG, JPG, WEBP).", variant: "destructive" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidFile(file)) setSelectedFile(file);
    else if (file) toast({ title: "Invalid file", description: "Please upload a PDF or image (PNG, JPG, WEBP).", variant: "destructive" });
  };

  const handleSelectSession = (id: string) => {
    selectSession(id);
    navigate("/dashboard");
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteSession(id);
    toast({ title: "Quest deleted" });
  };

  const features = [
    { Art: PixelController, title: "QUIZ BATTLE", desc: "Defeat questions, earn XP and level up your knowledge.", color: "#e8547c", to: "/quiz" },
    { Art: PixelBook, title: "FLASHCARDS", desc: "Flip pixel cards and grind spaced repetition.", color: "#4a7fe0", to: "/flashcards" },
    { Art: PixelScroll, title: "NOTES SCROLL", desc: "Full structured study notes written by your AI scribe.", color: "#57a944", to: "/notes" },
    { Art: PixelChest, title: "ROADMAP LOOT", desc: "A step-by-step quest line from novice to master.", color: "#f5b722", to: "/roadmap" },
    { Art: PixelWizard, title: "AI TUTOR", desc: "Summon Professor Aria for voice-guided explanations.", color: "#8c5ada", to: "/tutor" },
    { Art: PixelBadge, title: "WEAK SPOTS", desc: "Scan your run and get a personalised revision plan.", color: "#c98f13", to: "/weakness" },
  ];

  const stats = [
    { label: "QUESTS", value: sessions.length, Art: PixelChest },
    { label: "CARDS", value: sessions.reduce((a, s) => a + s.flashcards.length, 0), Art: PixelCoin },
    { label: "BATTLES", value: sessions.reduce((a, s) => a + s.quizQuestions.length, 0), Art: PixelTrophy },
  ];

  const submitting = isLoading;

  return (
    <div className="relative overflow-hidden">
      {/* ---------- Parallax sky ---------- */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(250_35%_9%),hsl(250_30%_7%)_55%,hsl(252_30%_6%))]" />
        <div className="absolute inset-0 starfield opacity-70" style={{ transform: `translate3d(0, ${scrollY * -0.06}px, 0)` }} />
        <div className="absolute inset-0 starfield opacity-40" style={{ transform: `translate3d(0, ${scrollY * -0.14}px, 0) scale(1.6)` }} />
        <PixelPlanet size={90} className="absolute right-[6%] top-[8%] float-slow opacity-80" style={{ transform: `translate3d(0, ${scrollY * -0.2}px, 0)` }} />
        <PixelCloud size={120} className="absolute left-[4%] top-[16%] opacity-25" style={{ transform: `translate3d(${scrollY * 0.12}px, 0, 0)` }} />
        <PixelCloud size={80} className="absolute right-[22%] top-[30%] opacity-15" style={{ transform: `translate3d(${scrollY * -0.16}px, 0, 0)` }} />
        <PixelStar size={14} className="absolute left-[12%] top-[9%] text-[#f5b722] twinkle" />
        <PixelStar size={10} className="absolute left-[78%] top-[20%] text-[#e8ecf5] twinkle" style={{ animationDelay: "0.6s" }} />
        <PixelStar size={12} className="absolute left-[30%] top-[42%] text-[#4a7fe0] twinkle" style={{ animationDelay: "1.2s" }} />
        <PixelStar size={9} className="absolute left-[88%] top-[48%] text-[#e8547c] twinkle" style={{ animationDelay: "0.3s" }} />
      </div>

      {/* ---------- HERO ---------- */}
      <section className="container max-w-5xl px-4 pt-14 pb-20 md:pt-20 relative">
        <div className="text-center relative">
          <div className="reveal reveal-pop is-visible inline-flex items-center gap-2 pixel-chip bg-[#f5b722] text-[hsl(var(--ink))] mb-8">
            <PixelBolt size={14} />
            PRESS START · LEVEL UP
          </div>

          <h1 className="pixel-text text-[1.6rem] leading-[1.5] sm:text-4xl md:text-[2.9rem] text-[hsl(var(--cream))] pixel-shadow-text mb-6">
            TURN ANY VIDEO
            <br />
            INTO A{" "}
            <span className="text-[#f5b722]">LEARNING</span>
            <br />
            <span className="text-[#57a944]">QUEST</span>
          </h1>

          <p className="pixel-body text-lg md:text-xl text-[hsl(var(--cream)/0.72)] max-w-2xl mx-auto mb-10">
            Drop a YouTube link, a PDF or an image. Your AI game master forges flashcards,
            quiz battles and a roadmap of loot — instantly.
          </p>

          {/* floating side sprites */}
          <PixelSlime size={54} className="hidden md:block absolute -left-2 bottom-6 float-mid" />
          <PixelRobot size={78} className="hidden md:block absolute -right-4 top-2 float-slow" />
        </div>

        {/* ---------- QUEST CONSOLE ---------- */}
        <div className="reveal is-visible mt-4 max-w-2xl mx-auto pixel-panel p-5 sm:p-7 relative">
          <PixelCoin size={26} className="absolute -top-5 -left-5 float-fast" />
          <PixelHeartRow />

          {/* Tab selector */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => setTab("youtube")}
              className={cn(
                "pixel-chip flex items-center justify-center gap-2",
                tab === "youtube" ? "bg-[#e8547c] text-white" : "bg-[hsl(var(--cream-deep))] text-[hsl(var(--ink))]"
              )}
            >
              <Youtube className="h-3.5 w-3.5" /> YOUTUBE
            </button>
            <button
              onClick={() => setTab("file")}
              className={cn(
                "pixel-chip flex items-center justify-center gap-2",
                tab === "file" ? "bg-[#4a7fe0] text-white" : "bg-[hsl(var(--cream-deep))] text-[hsl(var(--ink))]"
              )}
            >
              <Upload className="h-3.5 w-3.5" /> PDF / IMAGE
            </button>
          </div>

          {tab === "youtube" ? (
            <form onSubmit={handleYouTubeSubmit} className="space-y-4">
              <label className="pixel-text text-[0.6rem] text-[hsl(var(--ink)/0.7)] block">VIDEO URL</label>
              <input
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={submitting}
                className="pixel-input w-full h-12 px-3 text-base outline-none focus:ring-0 focus:border-[#4a7fe0]"
              />
              <QuestionStepper value={questionCount} onChange={setQuestionCount} disabled={submitting} />
              <button type="submit" disabled={submitting || !url.trim()} className="pixel-btn w-full bg-[#57a944] text-white flex items-center justify-center gap-3">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> FORGING…</> : <><PixelBolt size={16} /> BEGIN QUEST</>}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-4 border-dashed p-7 text-center cursor-pointer transition-colors",
                  dragOver || selectedFile ? "border-[#4a7fe0] bg-[#4a7fe0]/10" : "border-[hsl(var(--ink)/0.4)] hover:border-[#e8547c]"
                )}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} className="hidden" />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    {selectedFile.type === "application/pdf"
                      ? <FileText className="h-7 w-7 text-[#e8547c]" />
                      : <Image className="h-7 w-7 text-[#4a7fe0]" />}
                    <div className="text-left">
                      <p className="pixel-body font-semibold text-[hsl(var(--ink))]">{selectedFile.name}</p>
                      <p className="pixel-text text-[0.55rem] text-[hsl(var(--ink)/0.6)] mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="ml-2 p-1 text-[hsl(var(--ink)/0.6)] hover:text-[#e8547c]">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <PixelScroll size={48} className="mx-auto mb-3 float-mid" />
                    <p className="pixel-text text-[0.62rem] text-[hsl(var(--ink))]">DROP YOUR SCROLL HERE</p>
                    <p className="pixel-body text-base text-[hsl(var(--ink)/0.65)] mt-2">PDF, PNG, JPG or WEBP — max 10MB</p>
                  </>
                )}
              </div>
              <QuestionStepper value={questionCount} onChange={setQuestionCount} disabled={submitting} />
              <button onClick={handleFileSubmit} disabled={submitting || !selectedFile} className="pixel-btn w-full bg-[#4a7fe0] text-white flex items-center justify-center gap-3">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> FORGING…</> : <><PixelBolt size={16} /> BEGIN QUEST</>}
              </button>
            </div>
          )}
        </div>

        {/* pixel pipe connector */}
        <PixelPipe d="M40 0 L40 90 L360 90 L360 190" className="hidden md:block w-full h-24 mt-10 opacity-50" />
      </section>

      <PixelTerrain className="-mb-1" />

      {/* ---------- STATS BAR ---------- */}
      <section className="bg-[#7a4a24] py-8">
        <div className="container max-w-4xl px-4 grid grid-cols-3 gap-3 sm:gap-5">
          {stats.map((s, i) => (
            <div key={s.label} className={cn("reveal pixel-panel p-3 sm:p-4 flex items-center gap-3 justify-center", `stagger-${i + 1}`)}>
              <s.Art size={28} />
              <div className="text-left">
                <p className="pixel-text text-base sm:text-xl text-[hsl(var(--ink))]">{s.value}</p>
                <p className="pixel-text text-[0.5rem] text-[hsl(var(--ink)/0.6)] mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="relative py-20">
        <div className="container max-w-5xl px-4">
          <div className="reveal text-center mb-12">
            <h2 className="pixel-text text-xl sm:text-2xl text-[hsl(var(--cream))] pixel-shadow-text mb-4">CHOOSE YOUR CLASS</h2>
            <p className="pixel-body text-lg text-[hsl(var(--cream)/0.65)]">Six modes. One knowledge run.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <button
                key={f.title}
                onClick={() => navigate(f.to)}
                className={cn("reveal pixel-card pixel-panel p-6 text-left flex flex-col gap-4", `stagger-${(i % 6) + 1}`)}
              >
                <div
                  className="w-16 h-16 flex items-center justify-center border-4 border-[hsl(var(--ink))]"
                  style={{ backgroundColor: f.color }}
                >
                  <f.Art size={40} />
                </div>
                <h3 className="pixel-text text-[0.72rem] text-[hsl(var(--ink))]">{f.title}</h3>
                <p className="pixel-body text-base text-[hsl(var(--ink)/0.72)] leading-snug">{f.desc}</p>
                <span className="pixel-text text-[0.55rem] mt-auto pt-2" style={{ color: f.color }}>ENTER →</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- HISTORY ---------- */}
      {sessions.length > 0 && (
        <section className="pb-24">
          <div className="container max-w-3xl px-4">
            <div className="reveal flex items-center gap-3 mb-6">
              <Clock className="h-5 w-5 text-[#f5b722]" />
              <h2 className="pixel-text text-base sm:text-lg text-[hsl(var(--cream))]">SAVE FILES</h2>
            </div>

            <div className="space-y-4">
              {sessions.map((s, i) => (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectSession(s.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleSelectSession(s.id)}
                  className={cn("reveal pixel-card pixel-panel-dark p-4 flex items-center gap-4 cursor-pointer group", `stagger-${Math.min(i + 1, 8)}`)}
                >
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center border-2 border-[hsl(var(--border))] bg-[hsl(250_30%_9%)]">
                    <PixelCoin size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="pixel-body text-lg text-foreground truncate">{s.title}</p>
                    <p className="pixel-text text-[0.5rem] text-muted-foreground mt-1.5 leading-relaxed">
                      {new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{s.flashcards.length} CARDS · {s.quizQuestions.length} BATTLES · {s.roadmap.length} STEPS
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, s.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Delete quest"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- small pieces ---------- */

function PixelHeartRow() {
  return (
    <div className="absolute -top-5 right-4 flex gap-1" aria-hidden>
      <PixelStar size={12} className="text-[#f5b722] twinkle" />
      <PixelStar size={12} className="text-[#f5b722] twinkle" style={{ animationDelay: ".4s" }} />
      <PixelStar size={12} className="text-[#f5b722] twinkle" style={{ animationDelay: ".8s" }} />
    </div>
  );
}

function QuestionStepper({
  value, onChange, disabled,
}: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between border-4 border-[hsl(var(--ink))] bg-[hsl(var(--cream-deep))] px-3 py-2.5">
      <span className="pixel-text text-[0.58rem] text-[hsl(var(--ink))]">QUESTIONS</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled || value <= 5}
          onClick={() => onChange(Math.max(5, value - 5))}
          className="w-8 h-8 border-[3px] border-[hsl(var(--ink))] bg-[#e8547c] text-white flex items-center justify-center disabled:opacity-40 active:translate-y-0.5 transition-transform"
          aria-label="Fewer questions"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="pixel-text text-sm text-[hsl(var(--ink))] w-8 text-center">{value}</span>
        <button
          type="button"
          disabled={disabled || value >= 25}
          onClick={() => onChange(Math.min(25, value + 5))}
          className="w-8 h-8 border-[3px] border-[hsl(var(--ink))] bg-[#57a944] text-white flex items-center justify-center disabled:opacity-40 active:translate-y-0.5 transition-transform"
          aria-label="More questions"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
