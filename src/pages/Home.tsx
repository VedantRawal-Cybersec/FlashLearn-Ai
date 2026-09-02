import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { Loader2, Youtube, Clock, Trash2, Upload, FileText, Image, X, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useReveal, useParallax, useMouseParallax } from "@/hooks/use-reveal";
import {
  PixelStar, PixelCoin, PixelBolt, PixelCloud, PixelPlanet, PixelChest, PixelSlime,
  PixelWizard, PixelScroll, PixelController, PixelBadge, PixelTerrain,
  PixelKnight, PixelMonster, PixelFlashcard, PixelQuill, PixelAstronaut, PixelHeroine,
  PixelFlower, PixelChip, PixelHeartShield, PixelPhone, PixelLock, PixelSword,
  PixelTree, PixelHeart, XPBar, PipeRun,
} from "@/components/PixelArt";

/* Editable placeholder stats (replaced by real numbers when the user has sessions) */
const SHOWCASE_STATS = [
  { value: "250K+", label: "Quests Created" },
  { value: "10M+", label: "Questions Answered" },
  { value: "4.9★", label: "Learner Rating" },
];

const QUESTION_PRESETS = [5, 10, 20, 30, 50];

export default function Home() {
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState<"youtube" | "file">("youtube");
  const [questionCount, setQuestionCount] = useState(20);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { isLoading, setLoading, addSession, sessions, sessionsLoaded, loadSessions, selectSession, deleteSession } = useAppStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useParallax(setScrollY);
  useReveal([sessions.length, tab]);
  const m = useMouseParallax(heroRef);

  useEffect(() => {
    if (!sessionsLoaded) loadSessions();
  }, [sessionsLoaded, loadSessions]);

  const px = (depth: number) => `translate3d(${(m.x * depth).toFixed(2)}px, ${(m.y * depth).toFixed(2)}px, 0)`;

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

  const submitting = isLoading;

  const realStats = sessions.length
    ? [
        { value: `${sessions.length}`, label: "Quests Created" },
        { value: `${sessions.reduce((a, s) => a + s.quizQuestions.length, 0)}`, label: "Questions Ready" },
        { value: `${sessions.reduce((a, s) => a + s.flashcards.length, 0)}`, label: "Cards Forged" },
      ]
    : SHOWCASE_STATS;

  const questCards = [
    {
      n: "01", title: "QUIZ BATTLES", cta: "START BATTLE!", ctaColor: "#346bd7", to: "/quiz",
      desc: ["Challenge yourself with", "AI-generated quizzes.", "Beat your high score and", "conquer the leaderboards!"],
      art: (
        <div className="flex items-center justify-center gap-2">
          <PixelKnight size={64} className="float-mid" />
          <span className="pixel-text text-[0.6rem] text-[hsl(var(--ink))]">VS</span>
          <PixelMonster size={64} className="float-fast" />
        </div>
      ),
    },
    {
      n: "02", title: "FLASHCARDS", cta: "OPEN DECK", ctaColor: "#8c4bb3", to: "/flashcards",
      desc: ["Smart flashcards", "generated from your topic.", "Review, flip, and master", "key concepts."],
      art: <PixelFlashcard size={78} className="mx-auto float-slow" />,
    },
    {
      n: "03", title: "NOTES", cta: "VIEW NOTES", ctaColor: "#ffcb3d", ctaInk: true, to: "/notes",
      desc: ["Get AI-generated notes", "summarized from the video.", "Edit, save, and make it", "your own."],
      art: <PixelQuill size={78} className="mx-auto float-mid" />,
    },
  ];

  const bottomCards = [
    {
      n: "04", title: "PROGRESS TRACKING", cta: "VIEW PROGRESS", ctaColor: "#65b94d", to: "/dashboard",
      desc: ["Track your XP, accuracy,", "streaks and time.", "See your growth and", "level up!"],
      art: <XPBar value={72} level={12} className="w-full" />,
    },
    {
      n: "05", title: "REWARDS & ACHIEVEMENTS", cta: "SEE REWARDS", ctaColor: "#ef4f84", to: "/weakness",
      desc: ["Earn badges, unlock themes,", "and collect epic rewards.", "The more you learn,", "the more you earn!"],
      art: <PixelChest size={76} className="mx-auto float-mid" />,
    },
  ];

  const benefits = [
    { Art: PixelChip, title: "AI-Powered", desc: ["Smart content from", "any video"] },
    { Art: PixelHeartShield, title: "Fun & Engaging", desc: ["Gamified learning", "that sticks"] },
    { Art: PixelPhone, title: "Study Anywhere", desc: ["Web, mobile,", "anytime"] },
    { Art: PixelLock, title: "Safe & Secure", desc: ["Your data,", "always protected"] },
  ];

  return (
    <div className="relative overflow-hidden bg-[hsl(var(--background))]">
      {/* ---------- LAYER 0/1 : deep field + stars ---------- */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(213_68%_7%),hsl(213_65%_5%)_60%,hsl(213_68%_7%))]" style={{ transform: `translate3d(0, ${scrollY * -0.02}px, 0)` }} />
        <div className="absolute inset-0 starfield opacity-80" style={{ transform: `translate3d(0, ${scrollY * -0.05}px, 0)` }} />
        <div className="absolute inset-0 starfield opacity-40" style={{ transform: `translate3d(0, ${scrollY * -0.1}px, 0) scale(1.7)` }} />
        {[
          { l: "8%", t: "6%", c: "#ffcb3d", s: 12, d: "0s" },
          { l: "22%", t: "14%", c: "#ef4f84", s: 9, d: ".5s" },
          { l: "46%", t: "5%", c: "#fff5df", s: 10, d: "1.1s" },
          { l: "63%", t: "18%", c: "#346bd7", s: 11, d: ".8s" },
          { l: "86%", t: "10%", c: "#ffcb3d", s: 9, d: "1.6s" },
          { l: "5%", t: "38%", c: "#8c4bb3", s: 10, d: ".3s" },
          { l: "92%", t: "44%", c: "#ef4f84", s: 12, d: "1.3s" },
          { l: "35%", t: "56%", c: "#fff5df", s: 8, d: ".9s" },
          { l: "72%", t: "66%", c: "#ffcb3d", s: 10, d: "1.8s" },
          { l: "14%", t: "72%", c: "#65b94d", s: 9, d: ".6s" },
        ].map((s, i) => (
          <PixelStar key={i} size={s.s} className="absolute twinkle" style={{ left: s.l, top: s.t, color: s.c, animationDelay: s.d }} />
        ))}
      </div>

      {/* ============ HERO ============ */}
      <section ref={heroRef} className="relative">
        <div className="mx-auto max-w-[1420px] px-6 md:px-12 pt-16 md:pt-20 pb-0 min-h-[640px] md:min-h-[720px]">
          <div className="grid lg:grid-cols-[48%_44%] gap-[6%] items-start">

            {/* ---- LEFT ---- */}
            <div className="relative pb-10">
              <div className="reveal is-visible inline-block pixel-tag bg-[#ef4f84] text-white text-[0.55rem] px-4 py-2 mb-7">
                LEVEL UP YOUR STUDY GAME
              </div>

              <h1 className="pixel-text text-[2.6rem] sm:text-[4rem] md:text-[5.2rem] leading-[1.05] pixel-shadow-text mb-6">
                <span className="text-[#fff5df]">FLASH</span>
                <br />
                <span className="text-[#ffcb3d]">LEARN</span>
                <PixelBolt size={34} className="inline-block ml-3 align-top float-fast" />
              </h1>

              <div className="inline-block pixel-tag bg-[#346bd7] text-white text-[0.6rem] px-4 py-2.5 mb-7">
                PIXEL QUEST STUDY WORLD
              </div>

              <p className="pixel-body text-lg md:text-xl text-[hsl(var(--cream)/0.8)] leading-relaxed max-w-md">
                Turn any topic into an epic adventure.
                <br />
                Paste a YouTube link, pick your challenge,
                <br />
                and let AI craft your quest!
              </p>

              {/* characters standing on the terrain */}
              <div className="relative h-[120px] mt-6 hidden sm:block" aria-hidden>
                <PixelWizard size={104} className="absolute left-0 bottom-0 float-slow" style={{ transform: px(8) }} />
                <PixelSlime size={54} className="absolute left-[140px] bottom-0 float-mid" style={{ transform: px(6) }} />
                <PixelFlower size={20} className="absolute left-[210px] bottom-1" color="#ef4f84" />
                <PixelFlower size={18} className="absolute left-[240px] bottom-0" color="#ffcb3d" />
              </div>
            </div>

            {/* ---- RIGHT : QUEST CARD ---- */}
            <div className="relative pb-16" style={{ transform: px(5) }}>
              <PixelCloud size={130} className="absolute -top-6 right-2 opacity-90 hidden md:block" style={{ transform: px(10) }} />
              <PixelPlanet size={70} className="absolute -left-16 -top-8 float-slow hidden xl:block" style={{ transform: px(6) }} />
              <PixelCoin size={30} className="absolute -right-6 top-28 float-fast hidden md:block" style={{ transform: px(12) }} />

              <div className="relative z-10 max-w-[500px] mx-auto">
                {/* pink tag above card */}
                <div className="flex justify-center -mb-3 relative z-20">
                  <div className="pixel-tag bg-[#ef4f84] text-white text-[0.6rem] px-5 py-2.5">START YOUR QUEST</div>
                </div>

                <div className="reveal is-visible pixel-panel p-5 sm:p-7 pt-8">
                  {/* source tabs — keeps existing PDF/image support */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <button
                      onClick={() => setTab("youtube")}
                      className={cn("pixel-chip flex items-center justify-center gap-2",
                        tab === "youtube" ? "bg-[#ef4f84] text-white" : "bg-[hsl(var(--cream-deep))] text-[hsl(var(--ink))]")}
                    >
                      <Youtube className="h-3.5 w-3.5" /> YOUTUBE
                    </button>
                    <button
                      onClick={() => setTab("file")}
                      className={cn("pixel-chip flex items-center justify-center gap-2",
                        tab === "file" ? "bg-[#346bd7] text-white" : "bg-[hsl(var(--cream-deep))] text-[hsl(var(--ink))]")}
                    >
                      <Upload className="h-3.5 w-3.5" /> PDF / IMAGE
                    </button>
                  </div>

                  {tab === "youtube" ? (
                    <form onSubmit={handleYouTubeSubmit} className="space-y-5">
                      <div>
                        <label htmlFor="yt-url" className="pixel-body block text-lg font-semibold text-[hsl(var(--ink))] mb-2">
                          YouTube Video Link
                        </label>
                        <div className="flex items-stretch gap-2">
                          <span className="w-11 shrink-0 flex items-center justify-center bg-[#ef2f2f] border-[3px] border-[hsl(var(--ink))]">
                            <Youtube className="h-5 w-5 text-white" />
                          </span>
                          <input
                            id="yt-url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={submitting}
                            className="pixel-input flex-1 h-11 px-3 text-base outline-none focus:border-[#346bd7]"
                          />
                        </div>
                      </div>

                      <QuestionStepper value={questionCount} onChange={setQuestionCount} disabled={submitting} />

                      <button type="submit" disabled={submitting || !url.trim()}
                        className="pixel-btn w-full bg-[#65b94d] text-white flex items-center justify-center gap-3 text-[0.8rem]">
                        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> FORGING…</> : <>BEGIN QUEST! <PixelSword size={24} /></>}
                      </button>

                      <p className="pixel-body text-center text-base text-[hsl(var(--ink)/0.7)] flex items-center justify-center gap-2">
                        <PixelCoin size={16} /> Earn XP. Unlock rewards. Become legendary.
                      </p>
                    </form>
                  ) : (
                    <div className="space-y-5">
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn("border-4 border-dashed p-7 text-center cursor-pointer transition-colors",
                          dragOver || selectedFile ? "border-[#346bd7] bg-[#346bd7]/10" : "border-[hsl(var(--ink)/0.4)] hover:border-[#ef4f84]")}
                      >
                        <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} className="hidden" />
                        {selectedFile ? (
                          <div className="flex items-center justify-center gap-3">
                            {selectedFile.type === "application/pdf"
                              ? <FileText className="h-7 w-7 text-[#ef4f84]" />
                              : <Image className="h-7 w-7 text-[#346bd7]" />}
                            <div className="text-left">
                              <p className="pixel-body font-semibold text-[hsl(var(--ink))]">{selectedFile.name}</p>
                              <p className="pixel-text text-[0.55rem] text-[hsl(var(--ink)/0.6)] mt-1">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="ml-2 p-1 text-[hsl(var(--ink)/0.6)] hover:text-[#ef4f84]" aria-label="Remove file">
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

                      <button onClick={handleFileSubmit} disabled={submitting || !selectedFile}
                        className="pixel-btn w-full bg-[#65b94d] text-white flex items-center justify-center gap-3 text-[0.8rem]">
                        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> FORGING…</> : <>BEGIN QUEST! <PixelSword size={24} /></>}
                      </button>

                      <p className="pixel-body text-center text-base text-[hsl(var(--ink)/0.7)] flex items-center justify-center gap-2">
                        <PixelCoin size={16} /> Earn XP. Unlock rewards. Become legendary.
                      </p>
                    </div>
                  )}
                </div>

                <PixelChest size={82} className="absolute -bottom-4 -right-2 float-mid hidden md:block" style={{ transform: px(12) }} />
              </div>
            </div>
          </div>
        </div>

        <PixelTerrain className="-mb-1 relative z-0" />
      </section>

      {/* ============ STATS ============ */}
      <section className="relative py-14 md:py-20">
        <PipeRun d="M10 20 L10 130 L120 130 L120 190" color="#8c4bb3" className="reveal absolute left-0 top-0 w-[18%] h-[240px] hidden lg:block opacity-90" />
        <PipeRun d="M390 20 L390 120 L280 120 L280 200" color="#346bd7" className="reveal absolute right-0 top-0 w-[18%] h-[240px] hidden lg:block opacity-90" />

        <div className="mx-auto max-w-[1100px] px-6">
          <div className="reveal pixel-panel-dark px-6 py-6 md:px-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="flex-1">
              <p className="pixel-text text-[0.55rem] text-[#ffcb3d] mb-3">TRUSTED BY THOUSANDS OF LEARNERS</p>
              <div className="flex -space-x-1">
                {["#c9d4e8", "#f39b35", "#ef4f84", "#8c4bb3", "#65b94d", "#ffcb3d", "#346bd7"].map((c, i) => (
                  <span key={i} className="w-7 h-7 border-2 border-[#171717]" style={{ backgroundColor: c }} aria-hidden />
                ))}
              </div>
            </div>
            <div className="hidden md:block w-1 self-stretch bg-[hsl(var(--border))]" aria-hidden />
            <div className="grid grid-cols-3 gap-6 md:gap-10 text-center">
              {realStats.map((s) => (
                <div key={s.label}>
                  <p className="pixel-text text-base md:text-lg text-[#ffcb3d]">{s.value}</p>
                  <p className="pixel-body text-sm text-[hsl(var(--cream)/0.7)] mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CHOOSE YOUR QUEST ============ */}
      <section className="relative py-10 md:py-16">
        <PipeRun d="M0 40 L120 40 L120 160 L20 160" color="#ef4f84" className="reveal absolute left-0 top-24 w-[16%] h-[280px] hidden lg:block opacity-80" />
        <PipeRun d="M400 40 L300 40 L300 170 L390 170" color="#65b94d" className="reveal absolute right-0 top-52 w-[16%] h-[300px] hidden lg:block opacity-80" />

        <div className="mx-auto max-w-[1200px] px-6">
          <div className="reveal flex justify-center mb-12">
            <div className="pixel-plaque px-8 py-4 flex items-center gap-4">
              <PixelStar size={12} className="text-[#ef4f84]" />
              <h2 className="pixel-text text-[0.8rem] md:text-base text-[hsl(var(--ink))]">CHOOSE YOUR QUEST</h2>
              <PixelStar size={12} className="text-[#ef4f84]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mb-7">
            {questCards.map((c, i) => (
              <QuestCard key={c.n} {...c} index={i} onGo={() => navigate(c.to)} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 max-w-[760px] mx-auto">
            {bottomCards.map((c, i) => (
              <QuestCard key={c.n} {...c} index={i + 3} onGo={() => navigate(c.to)} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ QUEST IN ACTION ============ */}
      <section className="relative py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="reveal pixel-panel-dark p-6 md:p-9 relative">
            <p className="pixel-body text-center text-lg text-[#ffcb3d] mb-7">✦ Quest in Action</p>

            <PixelAstronaut size={78} className="absolute left-2 bottom-6 float-slow hidden lg:block" />
            <PixelHeroine size={72} className="absolute right-2 bottom-6 float-mid hidden lg:block" />

            <div className="flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-3 lg:px-24">
              {/* question */}
              <div className="reveal flex-1 border-4 border-[hsl(var(--border))] bg-[hsl(213_65%_5%)] p-4">
                <p className="pixel-body text-base text-[hsl(var(--cream))] mb-3">What is the powerhouse<br />of the cell?</p>
                {[["A", "Nucleus"], ["B", "Mitochondria"], ["C", "Ribosome"], ["D", "Golgi Apparatus"]].map(([k, v]) => (
                  <div key={k} className={cn("flex items-center gap-2 border-2 border-[#171717] px-2 py-1.5 mb-1.5",
                    v === "Mitochondria" ? "bg-[#65b94d] text-white" : "bg-[hsl(var(--cream-deep))] text-[hsl(var(--ink))]")}>
                    <span className="pixel-text text-[0.45rem] border-2 border-[#171717] bg-[hsl(var(--cream))] text-[hsl(var(--ink))] px-1.5 py-1">{k}</span>
                    <span className="pixel-body text-sm">{v}</span>
                  </div>
                ))}
              </div>

              <span className="pixel-text self-center text-[#ffcb3d] rotate-90 lg:rotate-0" aria-hidden>›</span>

              {/* correct */}
              <div className="reveal stagger-2 flex-1 border-4 border-[hsl(var(--border))] bg-[hsl(213_65%_5%)] p-5 flex flex-col items-center justify-center gap-3">
                <PixelStar size={14} className="text-[#ffcb3d] twinkle" />
                <p className="pixel-text text-sm text-[hsl(var(--cream))]">Correct!</p>
                <p className="pixel-text text-lg text-[#ffcb3d]">+50 XP</p>
                <XPBar value={72} level={12} className="w-full" />
              </div>

              <span className="pixel-text self-center text-[#ffcb3d] rotate-90 lg:rotate-0" aria-hidden>›</span>

              {/* badge */}
              <div className="reveal stagger-3 flex-1 border-4 border-[hsl(var(--border))] bg-[hsl(213_65%_5%)] p-5 flex flex-col items-center justify-center gap-3">
                <p className="pixel-body text-base text-[hsl(var(--cream))]">New Badge Unlocked!</p>
                <PixelBadge size={70} className="float-mid" />
                <p className="pixel-text text-[0.62rem] text-[#ffcb3d]">CELL CHAMPION</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BLUE CTA SCENE ============ */}
      <section className="relative py-6 md:py-10">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="reveal relative overflow-hidden border-4 border-[#171717] bg-[linear-gradient(180deg,#3f86d8,#2f6bbd)]"
            style={{ boxShadow: "8px 8px 0 0 hsl(213 65% 3% / .6)" }}>
            {/* scenery */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#3f7f32]" />
              <div className="absolute bottom-14 left-0 right-0 h-8 bg-[#2b5f8f] opacity-60"
                style={{ transform: `translate3d(${scrollY * 0.03}px,0,0)` }} />
              <PixelCloud size={110} className="absolute left-[8%] top-6 opacity-90" style={{ transform: `translate3d(${scrollY * 0.08}px,0,0)` }} />
              <PixelCloud size={80} className="absolute right-[14%] top-10 opacity-70" style={{ transform: `translate3d(${scrollY * -0.06}px,0,0)` }} />
              <PixelTree size={64} className="absolute left-[3%] bottom-6" />
              <PixelTree size={52} className="absolute left-[12%] bottom-6" />
              <PixelTree size={70} className="absolute right-[4%] bottom-6" />
              <PixelTree size={48} className="absolute right-[14%] bottom-6" />
            </div>

            <div className="relative z-10 px-6 py-14 md:py-16 text-center">
              <h2 className="pixel-text text-base md:text-2xl text-[#fff5df] pixel-shadow-text mb-4">READY TO LEVEL UP?</h2>
              <p className="pixel-body text-lg text-[#e8f1ff] mb-7">Your next adventure in learning starts now.</p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="pixel-btn bg-[#ffcb3d] text-[hsl(var(--ink))] text-[0.7rem] min-h-[48px]"
              >
                START YOUR QUEST!
              </button>
              <PixelController size={92} className="absolute right-[12%] bottom-4 float-slow hidden md:block"
                style={{ transform: `translate3d(0, ${Math.sin(scrollY / 200) * 6}px, 0)` }} />
            </div>
          </div>
        </div>
      </section>

      {/* ============ BENEFITS ============ */}
      <section className="py-14">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="pixel-panel-dark grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y-4 lg:divide-y-0 lg:divide-x-4 divide-[hsl(var(--border))]">
            {benefits.map((b, i) => (
              <div key={b.title} className={cn("reveal flex items-center gap-4 p-6", `stagger-${i + 1}`)}>
                <b.Art size={40} />
                <div>
                  <p className="pixel-body text-lg font-semibold text-[hsl(var(--cream))]">{b.title}</p>
                  <p className="pixel-body text-sm text-[hsl(var(--cream)/0.65)] leading-tight">
                    {b.desc.map((l) => <span key={l} className="block">{l}</span>)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SAVE FILES (real sessions) ============ */}
      {sessions.length > 0 && (
        <section className="pb-24">
          <div className="mx-auto max-w-[900px] px-6">
            <div className="reveal flex items-center gap-3 mb-6">
              <Clock className="h-5 w-5 text-[#ffcb3d]" />
              <h2 className="pixel-text text-[0.75rem] sm:text-base text-[hsl(var(--cream))]">SAVE FILES</h2>
            </div>

            <div className="space-y-4">
              {sessions.map((s, i) => (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectSession(s.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleSelectSession(s.id)}
                  className={cn("reveal pixel-card pixel-panel-dark p-4 flex items-center gap-4 cursor-pointer", `stagger-${Math.min(i + 1, 8)}`)}
                >
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center border-2 border-[hsl(var(--border))] bg-[hsl(213_65%_5%)]">
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

      {/* ============ FOOTER ============ */}
      <footer className="border-t-4 border-[hsl(var(--border))] bg-[hsl(213_65%_5%)]">
        <div className="mx-auto max-w-[1200px] px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <PixelBolt size={26} />
              <span className="pixel-text text-[0.7rem] leading-[1.4] text-[#fff5df]">
                FLASH<br /><span className="text-[#ffcb3d]">LEARN</span>
              </span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {[
                ["Flashcards", "/flashcards"], ["Quiz", "/quiz"], ["Notes", "/notes"],
                ["Roadmap", "/roadmap"], ["Progress", "/dashboard"], ["AI Tutor", "/tutor"],
              ].map(([label, to]) => (
                <button key={to} onClick={() => navigate(to)} className="pixel-body text-base text-[hsl(var(--cream)/0.72)] hover:text-[#ffcb3d] transition-colors">
                  {label}
                </button>
              ))}
            </nav>
            <div className="flex gap-2" aria-hidden>
              {["#ef2f2f", "#346bd7", "#ef4f84", "#8c4bb3"].map((c) => (
                <span key={c} className="w-7 h-7 border-2 border-[#171717]" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="mt-8 pt-5 border-t-2 border-[hsl(var(--border))] flex flex-col sm:flex-row justify-between gap-3">
            <p className="pixel-body text-sm text-[hsl(var(--cream)/0.5)]">© {new Date().getFullYear()} Flash Learn. All rights reserved.</p>
            <p className="pixel-body text-sm text-[hsl(var(--cream)/0.5)] flex items-center gap-2">
              <PixelHeart size={12} /> Built for learners
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- pieces ---------- */

function QuestCard({
  n, title, desc, cta, ctaColor, ctaInk, art, index, onGo,
}: {
  n: string; title: string; desc: string[]; cta: string; ctaColor: string;
  ctaInk?: boolean; art: React.ReactNode; index: number; onGo: () => void;
}) {
  return (
    <div className={cn("reveal pixel-card pixel-panel relative p-6 pt-8 flex flex-col", `stagger-${index + 1}`)}>
      <span className="absolute -top-3 -left-3 pixel-tag bg-[#ef4f84] text-white text-[0.5rem] px-2 py-1.5">{n}</span>
      <h3 className="pixel-text text-[0.68rem] text-[hsl(var(--ink))] text-center mb-5">{title}</h3>
      <div className="min-h-[92px] flex items-center justify-center mb-5">{art}</div>
      <p className="pixel-body text-base text-[hsl(var(--ink)/0.75)] text-center leading-snug mb-6">
        {desc.map((l) => <span key={l} className="block">{l}</span>)}
      </p>
      <button
        onClick={onGo}
        className="pixel-btn mt-auto w-full text-[0.6rem]"
        style={{ backgroundColor: ctaColor, color: ctaInk ? "hsl(var(--ink))" : "#fff" }}
      >
        {cta}
      </button>
    </div>
  );
}

function QuestionStepper({
  value, onChange, disabled,
}: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
  const step = (dir: number) => {
    const idx = QUESTION_PRESETS.findIndex((p) => p >= value);
    const cur = idx === -1 ? QUESTION_PRESETS.length - 1 : idx;
    const next = Math.min(QUESTION_PRESETS.length - 1, Math.max(0, cur + dir));
    onChange(QUESTION_PRESETS[next]);
  };

  return (
    <div>
      <p className="pixel-body text-lg font-semibold text-[hsl(var(--ink))] mb-2">Number of Questions</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled || value <= QUESTION_PRESETS[0]}
          onClick={() => step(-1)}
          className="w-11 h-11 border-[3px] border-[hsl(var(--ink))] bg-[hsl(var(--cream-deep))] text-[hsl(var(--ink))] flex items-center justify-center disabled:opacity-40 active:translate-y-0.5 transition-transform"
          aria-label="Fewer questions"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="flex-1 h-11 border-[3px] border-[hsl(var(--ink))] bg-white flex items-center justify-center">
          <span className="pixel-body text-2xl font-bold text-[hsl(var(--ink))]">{value}</span>
        </div>
        <button
          type="button"
          disabled={disabled || value >= QUESTION_PRESETS[QUESTION_PRESETS.length - 1]}
          onClick={() => step(1)}
          className="w-11 h-11 border-[3px] border-[hsl(var(--ink))] bg-[hsl(var(--cream-deep))] text-[hsl(var(--ink))] flex items-center justify-center disabled:opacity-40 active:translate-y-0.5 transition-transform"
          aria-label="More questions"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <p className="pixel-body text-sm text-[hsl(var(--ink)/0.6)] text-center mt-2">Recommended: 10 – 50</p>
    </div>
  );
}
