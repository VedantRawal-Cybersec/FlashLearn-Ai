import { Button } from "@/components/ui/button";
import { memo, useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { Loader2, Youtube, Clock, Trash2, Upload, FileText, Image, X, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useReveal, useParallax, useMouseParallax, usePauseOffscreenMotion } from "@/hooks/use-reveal";
import PlayerAvatar from "@/components/PlayerAvatar";
import StudyOptions from "@/components/StudyOptions";
import { DEFAULT_STUDY_OPTIONS } from "../../supabase/functions/_shared/study-options";
import { usePlayer } from "@/lib/player";
import {
  PixelStar, PixelCoin, PixelBolt, PixelCloud, PixelPlanet, PixelChest, PixelSlime,
  PixelWizard, PixelScroll, PixelController, PixelBadge, PixelTerrain,
  PixelKnight, PixelMonster, PixelFlashcard, PixelQuill, PixelAstronaut, PixelHeroine,
  PixelFlower, PixelChip, PixelHeartShield, PixelPhone, PixelLock, PixelSword,
  PixelTree, PixelHeart, XPBar, PipeRun,
} from "@/components/PixelArt";

/* Never display invented user counts, reviews or other unverifiable social proof. */
const SHOWCASE_STATS = [
  { value: "0", label: "Quests Created" },
  { value: "0", label: "Questions Ready" },
  { value: "0", label: "Cards Forged" },
];

const QUESTION_PRESETS = [5, 10, 20, 30, 50];

const WorldBackdrop = memo(function WorldBackdrop() {
  return (
    <div className="world-backdrop pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-deep" data-py="-0.02" />
        <div className="absolute inset-0 starfield opacity-80" data-py="-0.05" />
        <div className="absolute inset-0 starfield opacity-40" data-py="-0.1" style={{ scale: "1.7" }} />
        {[
          { l: "8%", t: "6%", c: "hsl(var(--pixel-gold))", s: 12, d: "0s" },
          { l: "22%", t: "14%", c: "hsl(var(--pixel-pink))", s: 9, d: ".5s" },
          { l: "46%", t: "5%", c: "hsl(var(--cream))", s: 10, d: "1.1s" },
          { l: "63%", t: "18%", c: "hsl(var(--pixel-blue))", s: 11, d: ".8s" },
          { l: "86%", t: "10%", c: "hsl(var(--pixel-gold))", s: 9, d: "1.6s" },
          { l: "5%", t: "38%", c: "hsl(var(--pixel-purple))", s: 10, d: ".3s" },
          { l: "92%", t: "44%", c: "hsl(var(--pixel-pink))", s: 12, d: "1.3s" },
          { l: "35%", t: "56%", c: "hsl(var(--cream))", s: 8, d: ".9s" },
          { l: "72%", t: "66%", c: "hsl(var(--pixel-gold))", s: 10, d: "1.8s" },
          { l: "14%", t: "72%", c: "hsl(var(--pixel-green))", s: 9, d: ".6s" },
        ].map((s, i) => (
          <PixelStar key={i} size={s.s} className="absolute twinkle" style={{ left: s.l, top: s.t, color: s.c, animationDelay: s.d }} />
        ))}
        {/* spinning stars */}
        {[
          { l: "30%", t: "24%", s: 14, d: "0s" },
          { l: "78%", t: "30%", s: 12, d: "1.2s" },
          { l: "55%", t: "48%", s: 10, d: ".7s" },
        ].map((s, i) => (
          <PixelStar key={`spin-${i}`} size={s.s} className="absolute star-spin text-pixel-gold" style={{ left: s.l, top: s.t, animationDelay: s.d }} data-py="-0.08" />
        ))}
        {/* floating coins */}
        {[
          { l: "12%", t: "22%", s: 22, d: "0s", f: "float-mid" },
          { l: "68%", t: "8%", s: 18, d: ".4s", f: "float-fast" },
          { l: "40%", t: "70%", s: 20, d: ".9s", f: "float-slow" },
          { l: "90%", t: "58%", s: 16, d: ".2s", f: "float-mid" },
        ].map((c, i) => (
          <PixelCoin key={`coin-${i}`} size={c.s} className={`absolute coin-spin ${c.f}`} style={{ left: c.l, top: c.t, animationDelay: c.d }} data-py="-0.12" />
        ))}
        {/* drifting planets */}
        <PixelPlanet size={54} className="absolute left-[58%] top-[12%] planet-drift opacity-80" data-py="-0.06" />
        <PixelPlanet size={38} className="absolute left-[3%] top-[58%] planet-drift opacity-60" style={{ animationDelay: "-4s" }} data-py="-0.04" />
        {/* drifting clouds */}
        <PixelCloud size={90} className="absolute left-[18%] top-[9%] cloud-drift opacity-40" data-py="-0.07" />
        <PixelCloud size={64} className="absolute left-[74%] top-[52%] cloud-drift-slow opacity-30" data-py="-0.05" />
      </div>
  );
});



export default function Home() {
  const avatar = usePlayer((s) => s.avatar);
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState<"youtube" | "file">("youtube");
  const [questionCount, setQuestionCount] = useState(20);
  const [studyOptions, setStudyOptions] = useState(DEFAULT_STUDY_OPTIONS);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const { isLoading, setLoading, addSession, sessions, sessionsLoaded, loadSessions, selectSession, deleteSession } = useAppStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useParallax(worldRef);
  usePauseOffscreenMotion();
  useReveal([sessions.length, tab]);
  useMouseParallax(heroRef);

  useEffect(() => {
    if (!sessionsLoaded) loadSessions();
  }, [sessionsLoaded, loadSessions]);

  const handleYouTubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-study-materials", {
        body: { videoUrl: url.trim(), ...studyOptions, questionCount },
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
          ...studyOptions,
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

  const questCards = useMemo(() => [
    {
      n: "01", title: "QUIZ BATTLES", cta: "START BATTLE!", ctaColor: "hsl(var(--pixel-blue))", to: "/quiz",
      desc: ["Challenge yourself with", "AI-generated quizzes.", "Review your mistakes and", "improve your score!"],
      art: (
        <div className="flex items-center justify-center gap-2">
          <PixelKnight size={64} className="float-mid" />
          <span className="pixel-text text-[0.6rem] text-ink">VS</span>
          <PixelMonster size={64} className="float-fast" />
        </div>
      ),
    },
    {
      n: "02", title: "FLASHCARDS", cta: "OPEN DECK", ctaColor: "hsl(var(--pixel-purple))", to: "/flashcards",
      desc: ["Smart flashcards", "generated from your topic.", "Review, flip, and master", "key concepts."],
      art: <PixelFlashcard size={78} className="mx-auto float-slow" />,
    },
    {
      n: "03", title: "NOTES", cta: "VIEW NOTES", ctaColor: "hsl(var(--pixel-gold))", ctaInk: true, to: "/notes",
      desc: ["Get AI-generated notes", "summarized from the video.", "Edit, save, and make it", "your own."],
      art: <PixelQuill size={78} className="mx-auto float-mid" />,
    },
  ], []);

  const bottomCards = useMemo(() => [
    {
      n: "04", title: "PROGRESS TRACKING", cta: "VIEW PROGRESS", ctaColor: "hsl(var(--pixel-green))", to: "/dashboard",
      desc: ["Track your XP, accuracy,", "streaks and time.", "See your growth and", "level up!"],
      art: <XPBar value={72} level={12} className="w-full" />,
    },
    {
      n: "05", title: "REWARDS & ACHIEVEMENTS", cta: "SEE REWARDS", ctaColor: "hsl(var(--pixel-pink))", to: "/weakness",
      desc: ["Earn badges, unlock themes,", "and collect epic rewards.", "The more you learn,", "the more you earn!"],
      art: <PixelChest size={76} className="mx-auto float-mid" />,
    },
  ], []);

  const benefits = useMemo(() => [
    { Art: PixelChip, title: "AI-Powered", desc: ["Smart content from", "any video"] },
    { Art: PixelHeartShield, title: "Fun & Engaging", desc: ["Gamified learning", "that sticks"] },
    { Art: PixelPhone, title: "Study Anywhere", desc: ["Web, mobile,", "anytime"] },
    { Art: PixelLock, title: "Device-Private", desc: ["New study history", "stays on this device"] },
  ], []);

  return (
    <div ref={worldRef} className="quest-world relative overflow-hidden bg-background">
      <WorldBackdrop />

      {/* ============ HERO ============ */}
      <section ref={heroRef} className="relative">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 pt-8 md:pt-10 pb-0">
          <div className="grid md:grid-cols-[48%_46%] gap-6 md:gap-[6%] items-start">

            {/* ---- LEFT ---- */}
            <div className="relative pb-2 md:pb-0">
              <div className="reveal is-visible inline-block pixel-tag bg-pixel-pink text-accent-foreground text-[0.55rem] px-4 py-2 mb-7">
                LEVEL UP YOUR STUDY GAME
              </div>

              <h1 className="pixel-text text-[2.5rem] sm:text-[3.4rem] lg:text-[4.25rem] leading-[1.2] pixel-shadow-text mb-6">
                <span className="text-cream">FLASH</span>
                <br />
                <span className="text-pixel-gold">LEARN</span>
                <PixelBolt size={34} className="inline-block ml-3 align-top float-fast wiggle" />
              </h1>

              <div className="inline-block pixel-tag bg-pixel-blue text-accent-foreground text-[0.6rem] px-4 py-2.5 mb-7">
                PIXEL QUEST STUDY WORLD
              </div>

              <p className="pixel-body text-base sm:text-lg text-cream/80 leading-relaxed max-w-md">
                Turn any topic into an epic adventure.
                <br />
                Paste a YouTube link, pick your challenge,
                <br />
                and let AI craft your quest!
              </p>

              {/* characters standing on the terrain */}
              <div className="flex flex-wrap gap-3 mt-5">
                <Button variant="outline" onClick={() => navigate("/battle")}><PixelSword size={20} />1v1 AI Arena</Button>
                <Button variant="ghost" onClick={() => navigate("/avatar")}><PlayerAvatar avatar={avatar} size={28} />My Hero</Button>
              </div>
              <div className="relative h-[112px] mt-4 hidden md:block" aria-hidden>
                <PixelWizard size={104} className="absolute left-0 bottom-0 float-slow" data-mx="8" />
                <PixelSlime size={54} className="absolute left-[140px] bottom-0 float-mid" data-mx="6" />
                <PixelFlower size={20} className="absolute left-[210px] bottom-1" color="hsl(var(--pixel-pink))" />
                <PixelFlower size={18} className="absolute left-[240px] bottom-0" color="hsl(var(--pixel-gold))" />
              </div>
            </div>

            {/* ---- RIGHT : QUEST CARD ---- */}
            <div className="relative pb-4 md:pb-8">
              <PixelCloud size={130} className="absolute -top-6 right-2 opacity-90 hidden md:block" data-mx="10" />
              <PixelPlanet size={70} className="absolute -left-16 -top-8 float-slow hidden xl:block" data-mx="6" />
              <PixelCoin size={30} className="absolute -right-6 top-28 float-fast hidden md:block" data-mx="12" />

              <div className="relative z-10 max-w-[500px] mx-auto">
                {/* pink tag above card */}
                <div className="flex justify-center -mb-3 relative z-20">
                  <div className="pixel-tag glow-pulse bg-pixel-pink text-accent-foreground text-[0.6rem] px-5 py-2.5">START YOUR QUEST</div>
                  <p className="blink pixel-text text-[0.5rem] text-pixel-gold text-center mt-3" aria-hidden>▸ INSERT COIN TO PLAY ◂</p>
                </div>

                <div className="reveal is-visible pixel-panel p-4 sm:p-6 pt-7">
                  {/* source tabs — keeps existing PDF/image support */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button variant="pixel" size="natural"
                      onClick={() => setTab("youtube")}
                      className={cn("pixel-chip flex items-center justify-center gap-2",
                        tab === "youtube" ? "bg-pixel-pink text-accent-foreground" : "bg-cream-deep text-ink")}
                    >
                      <Youtube className="h-3.5 w-3.5" /> YOUTUBE
                    </Button>
                    <Button variant="pixel" size="natural"
                      onClick={() => setTab("file")}
                      className={cn("pixel-chip flex items-center justify-center gap-2",
                        tab === "file" ? "bg-pixel-blue text-accent-foreground" : "bg-cream-deep text-ink")}
                    >
                      <Upload className="h-3.5 w-3.5" /> PDF / IMAGE
                    </Button>
                  </div>

                  {tab === "youtube" ? (
                    <form onSubmit={handleYouTubeSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="yt-url" className="pixel-body block text-lg font-semibold text-ink mb-2">
                          YouTube Video Link
                        </label>
                        <div className="flex items-stretch gap-2">
                          <span className="w-11 shrink-0 flex items-center justify-center bg-destructive border-[3px] border-ink">
                            <Youtube className="h-5 w-5 text-accent-foreground" />
                          </span>
                          <input
                            id="yt-url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={submitting}
                            className="pixel-input min-w-0 flex-1 h-11 px-3 text-base outline-none focus:border-pixel-blue"
                          />
                        </div>
                      </div>

                      <QuestionStepper value={questionCount} onChange={setQuestionCount} disabled={submitting} />
                      <StudyOptions value={studyOptions} onChange={setStudyOptions} disabled={submitting} />

                      <Button variant="pixel" size="natural" type="submit" disabled={submitting || !url.trim()}
                        className="pixel-btn w-full bg-pixel-green text-accent-foreground flex items-center justify-center gap-3 text-[0.75rem]">
                        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> FORGING…</> : <>BEGIN QUEST! <PixelSword size={24} /></>}
                      </Button>

                      <p className="pixel-body text-center text-sm text-[hsl(var(--ink)/0.7)] flex items-center justify-center gap-2">
                        <PixelCoin size={16} /> Earn XP. Unlock rewards. Become legendary.
                      </p>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn("border-4 border-dashed p-7 text-center cursor-pointer transition-colors",
                          dragOver || selectedFile ? "border-pixel-blue bg-pixel-blue/10" : "border-[hsl(var(--ink)/0.4)] hover:border-pixel-pink")}
                      >
                        <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} className="hidden" />
                        {selectedFile ? (
                          <div className="flex items-center justify-center gap-3">
                            {selectedFile.type === "application/pdf"
                              ? <FileText className="h-7 w-7 text-pixel-pink" />
                              : <Image className="h-7 w-7 text-pixel-blue" />}
                            <div className="text-left">
                              <p className="pixel-body font-semibold text-ink">{selectedFile.name}</p>
                              <p className="pixel-text text-[0.55rem] text-[hsl(var(--ink)/0.6)] mt-1">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button variant="pixel" size="natural" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="ml-2 p-1 text-[hsl(var(--ink)/0.6)] hover:text-pixel-pink" aria-label="Remove file">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <PixelScroll size={48} className="mx-auto mb-3 float-mid" />
                            <p className="pixel-text text-[0.62rem] text-ink">DROP YOUR SCROLL HERE</p>
                            <p className="pixel-body text-base text-[hsl(var(--ink)/0.65)] mt-2">PDF, PNG, JPG or WEBP — max 10MB</p>
                          </>
                        )}
                      </div>

                      <QuestionStepper value={questionCount} onChange={setQuestionCount} disabled={submitting} />
                      <StudyOptions value={studyOptions} onChange={setStudyOptions} disabled={submitting} />

                      <Button variant="pixel" size="natural" onClick={handleFileSubmit} disabled={submitting || !selectedFile}
                        className="pixel-btn w-full bg-pixel-green text-accent-foreground flex items-center justify-center gap-3 text-[0.75rem]">
                        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> FORGING…</> : <>BEGIN QUEST! <PixelSword size={24} /></>}
                      </Button>

                      <p className="pixel-body text-center text-sm text-[hsl(var(--ink)/0.7)] flex items-center justify-center gap-2">
                        <PixelCoin size={16} /> Earn XP. Unlock rewards. Become legendary.
                      </p>
                    </div>
                  )}
                </div>

                <PixelChest size={82} className="absolute -bottom-4 -right-2 float-mid hidden md:block" data-mx="12" />
              </div>
            </div>
          </div>
        </div>

        <PixelTerrain className="-mb-1 relative z-0" />
      </section>

      {/* ============ STATS ============ */}
      <section className="cv-auto relative py-6 md:py-8">
        <PipeRun d="M10 20 L10 130 L120 130 L120 190" color="hsl(var(--pixel-purple))" className="reveal absolute left-0 top-0 w-[18%] h-[240px] hidden lg:block opacity-90" />
        <PipeRun d="M390 20 L390 120 L280 120 L280 200" color="hsl(var(--pixel-blue))" className="reveal absolute right-0 top-0 w-[18%] h-[240px] hidden lg:block opacity-90" />

        <div className="mx-auto max-w-[1040px] px-6">
          <div className="reveal pixel-panel-dark px-6 py-6 md:px-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="flex-1">
              <p className="pixel-text text-[0.55rem] text-pixel-gold mb-3">YOUR LEARNING ADVENTURE STARTS HERE</p>
              <div className="flex -space-x-1">
                {[PixelWizard, PixelKnight, PixelHeroine, PixelAstronaut, PixelSlime, PixelMonster].map((Art, i) => (
                  <Art key={i} size={28} />
                ))}
              </div>
            </div>
            <div className="hidden md:block w-1 self-stretch bg-[hsl(var(--border))]" aria-hidden />
            <div className="grid grid-cols-3 gap-6 md:gap-10 text-center">
              {realStats.map((s) => (
                <div key={s.label}>
                  <p className="pixel-text text-base md:text-lg text-pixel-gold">{s.value}</p>
                  <p className="pixel-body text-sm text-[hsl(var(--cream)/0.7)] mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CHOOSE YOUR QUEST ============ */}
      <section className="cv-auto relative py-5 md:py-8">
        <PipeRun d="M0 40 L120 40 L120 160 L20 160" color="hsl(var(--pixel-pink))" className="reveal absolute left-0 top-24 w-[16%] h-[280px] hidden lg:block opacity-80" />
        <PipeRun d="M400 40 L300 40 L300 170 L390 170" color="hsl(var(--pixel-green))" className="reveal absolute right-0 top-52 w-[16%] h-[300px] hidden lg:block opacity-80" />

        <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
          <div className="reveal flex justify-center mb-8">
            <div className="pixel-plaque px-8 py-4 flex items-center gap-4">
              <PixelStar size={12} className="text-pixel-pink" />
              <h2 className="pixel-text text-[0.75rem] md:text-base text-ink">CHOOSE YOUR QUEST</h2>
              <PixelStar size={12} className="text-pixel-pink" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mb-7">
            {questCards.map((c, i) => (
              <QuestCard key={c.n} {...c} index={i} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 max-w-[760px] mx-auto">
            {bottomCards.map((c, i) => (
              <QuestCard key={c.n} {...c} index={i + 3} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ QUEST IN ACTION ============ */}
      <section className="cv-auto relative py-6 md:py-8">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
          <div className="reveal pixel-panel-dark p-6 md:p-9 relative">
            <p className="pixel-body text-center text-lg text-pixel-gold mb-7">✦ Quest in Action</p>

            <PixelAstronaut size={78} className="absolute left-2 bottom-6 float-slow hidden lg:block" />
            <PixelHeroine size={72} className="absolute right-2 bottom-6 float-mid hidden lg:block" />

            <div className="flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-3 lg:px-24">
              {/* question */}
              <div className="reveal flex-1 border-4 border-border bg-deep p-4">
                <p className="pixel-body text-base text-cream mb-3">What is the powerhouse<br />of the cell?</p>
                {[["A", "Nucleus"], ["B", "Mitochondria"], ["C", "Ribosome"], ["D", "Golgi Apparatus"]].map(([k, v]) => (
                  <div key={k} className={cn("flex items-center gap-2 border-2 border-ink px-2 py-1.5 mb-1.5",
                    v === "Mitochondria" ? "bg-pixel-green text-accent-foreground" : "bg-cream-deep text-ink")}>
                    <span className="pixel-text text-[0.45rem] border-2 border-ink bg-cream text-ink px-1.5 py-1">{k}</span>
                    <span className="pixel-body text-sm">{v}</span>
                  </div>
                ))}
              </div>

              <span className="pixel-text self-center text-pixel-gold rotate-90 lg:rotate-0" aria-hidden>›</span>

              {/* correct */}
              <div className="reveal stagger-2 flex-1 border-4 border-border bg-deep p-5 flex flex-col items-center justify-center gap-3">
                <PixelStar size={14} className="text-pixel-gold twinkle" />
                <p className="pixel-text text-sm text-cream">Correct!</p>
                <p className="pixel-text text-lg text-pixel-gold xp-pop" style={{ animationIterationCount: "infinite" }}>+50 XP</p>
                <XPBar value={72} level={12} className="w-full" />
              </div>

              <span className="pixel-text self-center text-pixel-gold rotate-90 lg:rotate-0" aria-hidden>›</span>

              {/* badge */}
              <div className="reveal stagger-3 flex-1 border-4 border-border bg-deep p-5 flex flex-col items-center justify-center gap-3">
                <p className="pixel-body text-base text-cream">New Badge Unlocked!</p>
                <PixelBadge size={70} className="float-mid" />
                <p className="pixel-text text-[0.62rem] text-pixel-gold">CELL CHAMPION</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BLUE CTA SCENE ============ */}
      <section className="cv-auto relative py-6 md:py-10">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
          <div className="reveal quest-scene relative overflow-hidden border-4 border-ink">
            {/* scenery */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute bottom-0 left-0 right-0 h-14 bg-grass" />
              <div className="absolute bottom-14 left-0 right-0 h-8 bg-sky opacity-60" data-px="0.03" />
              <PixelCloud size={110} className="absolute left-[8%] top-6 opacity-90" data-px="0.08" />
              <PixelCloud size={80} className="absolute right-[14%] top-10 opacity-70" data-px="-0.06" />
              <PixelTree size={64} className="absolute left-[3%] bottom-6" />
              <PixelTree size={52} className="absolute left-[12%] bottom-6" />
              <PixelTree size={70} className="absolute right-[4%] bottom-6" />
              <PixelTree size={48} className="absolute right-[14%] bottom-6" />
            </div>

            <div className="relative z-10 px-5 py-9 md:py-10 text-center">
              <h2 className="pixel-text text-base md:text-2xl text-cream pixel-shadow-text mb-4">READY TO LEVEL UP?</h2>
              <p className="pixel-body text-lg text-foreground mb-7">Your next adventure in learning starts now.</p>
              <Button variant="pixel" size="natural"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="pixel-btn bg-pixel-gold text-ink text-[0.7rem] min-h-[48px]"
              >
                START YOUR QUEST!
              </Button>
<PixelController size={92} className="absolute right-[12%] bottom-4 bob hidden md:block" />
              <PixelCoin size={24} className="absolute left-[10%] top-6 coin-spin float-fast hidden md:block" />
              <PixelStar size={16} className="absolute left-[20%] bottom-8 star-spin text-pixel-gold hidden md:block" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ BENEFITS ============ */}
      <section className="cv-auto py-6">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
          <div className="pixel-panel-dark grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y-4 lg:divide-y-0 lg:divide-x-4 divide-[hsl(var(--border))]">
            {benefits.map((b, i) => (
              <div key={b.title} className={cn("reveal flex items-center gap-4 p-6", `stagger-${i + 1}`)}>
                <b.Art size={40} />
                <div>
                  <p className="pixel-body text-lg font-semibold text-cream">{b.title}</p>
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
              <Clock className="h-5 w-5 text-pixel-gold" />
              <h2 className="pixel-text text-[0.75rem] sm:text-base text-cream">SAVE FILES</h2>
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
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center border-2 border-border bg-deep">
                    <PixelCoin size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="pixel-body text-lg text-foreground truncate">{s.title}</p>
                    <p className="pixel-text text-[0.5rem] text-muted-foreground mt-1.5 leading-relaxed">
                      {new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{s.flashcards.length} CARDS · {s.quizQuestions.length} BATTLES · {s.roadmap.length} STEPS
                    </p>
                  </div>
                  <Button variant="pixel" size="natural"
                    onClick={(e) => handleDelete(e, s.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Delete quest"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border bg-deep">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <PixelBolt size={26} />
              <span className="pixel-text text-[0.7rem] leading-[1.4] text-cream">
                FLASH<br /><span className="text-pixel-gold">LEARN</span>
              </span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {[
                ["Flashcards", "/flashcards"], ["Quiz", "/quiz"], ["Notes", "/notes"],
                ["Roadmap", "/roadmap"], ["Progress", "/dashboard"], ["AI Tutor", "/tutor"],
              ].map(([label, to]) => (
                <Button variant="pixel" size="natural" key={to} onClick={() => navigate(to)} className="pixel-body text-base text-[hsl(var(--cream)/0.72)] hover:text-pixel-gold transition-colors">
                  {label}
                </Button>
              ))}
            </nav>
            <div className="flex gap-3 text-primary">
              <Button variant="ghost" size="icon" onClick={() => navigate("/notes")} aria-label="Open notes"><FileText /></Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/flashcards")} aria-label="Open flashcards"><PixelFlashcard size={24} /></Button>
            </div>
          </div>
          <div className="mt-8 pt-5 border-t-2 border-border flex flex-col sm:flex-row justify-between gap-3">
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

const QuestCard = memo(function QuestCard({
  n, title, desc, cta, ctaColor, ctaInk, art, index, to,
}: {
  n: string; title: string; desc: string[]; cta: string; ctaColor: string;
  ctaInk?: boolean; art: React.ReactNode; index: number; to: string;
}) {
  const navigate = useNavigate();
  return (
    <div className={cn("reveal pixel-card relative isolate p-6 pt-8 flex flex-col", `stagger-${index + 1}`)}>
      <div className="pixel-panel absolute inset-0 -z-10" aria-hidden />
      <span className="absolute -top-3 left-4 pixel-tag bg-pixel-pink text-accent-foreground text-[0.5rem] px-2 py-1.5">{n}</span>
      <h3 className="pixel-text text-[0.68rem] text-ink text-center mb-5">{title}</h3>
      <div className="min-h-[92px] flex items-center justify-center mb-5">{art}</div>
      <p className="pixel-body text-base text-[hsl(var(--ink)/0.75)] text-center leading-snug mb-6">
        {desc.map((l) => <span key={l} className="block">{l}</span>)}
      </p>
      <Button variant="pixel" size="natural"
        onClick={onGo}
        className="pixel-btn mt-auto w-full text-[0.6rem]"
        style={{ backgroundColor: ctaColor, color: ctaInk ? "hsl(var(--ink))" : "hsl(var(--accent-foreground))" }}
      >
        {cta}
      </Button>
    </div>
  );
});

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
      <p className="pixel-body text-lg font-semibold text-ink mb-2">Number of Questions</p>
      <div className="flex items-center gap-3">
        <Button variant="pixel" size="natural"
          type="button"
          disabled={disabled || value <= QUESTION_PRESETS[0]}
          onClick={() => step(-1)}
          className="w-11 h-11 border-[3px] border-ink bg-cream-deep text-ink flex items-center justify-center disabled:opacity-40 active:translate-y-0.5 transition-transform"
          aria-label="Fewer questions"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <input aria-label="Number of questions" type="number" min={5} max={50} value={value} disabled={disabled}
          onChange={(e) => { const next = Number(e.target.value); if (next >= 5 && next <= 50) onChange(next); }}
          className="pixel-input min-w-0 flex-1 w-full h-11 text-center pixel-body text-2xl font-bold" />
        <Button variant="pixel" size="natural"
          type="button"
          disabled={disabled || value >= QUESTION_PRESETS[QUESTION_PRESETS.length - 1]}
          onClick={() => step(1)}
          className="w-11 h-11 border-[3px] border-ink bg-cream-deep text-ink flex items-center justify-center disabled:opacity-40 active:translate-y-0.5 transition-transform"
          aria-label="More questions"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="pixel-body text-sm text-[hsl(var(--ink)/0.6)] text-center mt-2">Recommended: 10 – 50</p>
      <div className="flex justify-center gap-1.5 mt-2">
        {QUESTION_PRESETS.map((n) => <Button key={n} variant="ghost" size="natural" type="button" disabled={disabled} aria-pressed={value === n} onClick={() => onChange(n)} className={cn("px-2 py-1 text-sm border-b-2 rounded-none text-ink hover:bg-cream-deep", value === n ? "border-pixel-pink" : "border-transparent")}>{n}</Button>)}
      </div>
    </div>
  );
}
