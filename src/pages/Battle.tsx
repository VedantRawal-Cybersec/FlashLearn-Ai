import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw, Swords, Trophy, Clock, Check, X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "@/components/PlayerAvatar";
import { usePlayer, PlayerAvatar as AvatarData } from "@/lib/player";
import { useAppStore, QuizQuestion } from "@/lib/store";
import { BattleDifficulty, chooseOpponentAnswer } from "@/lib/battle";
import { useMouseParallax } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const rival: AvatarData = { name: "Arcane AI", role: "mage", color: "pixel-pink", accessory: "crown" };
interface Round { player: number | null; ai: number; question: QuizQuestion }
export default function Battle() {
  const { avatar, recordBattle } = usePlayer();
  const { currentSession, sessions, sessionsLoaded, loadSessions } = useAppStore();
  const [sessionId, setSessionId] = useState(currentSession?.id ?? "");
  const [difficulty, setDifficulty] = useState<BattleDifficulty>("scholar");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [phase, setPhase] = useState<"setup" | "playing" | "reveal" | "results">("setup");
  const [seconds, setSeconds] = useState(20);
  const stage = useRef<HTMLDivElement>(null);
  useMouseParallax(stage);
  const locked = useRef(false);
  const completed = useRef(false);
  useEffect(() => { if (!sessionsLoaded) void loadSessions(); }, [sessionsLoaded, loadSessions]);
  const available = [currentSession, ...sessions].filter((s, i, all) => s && s.quizQuestions.length > 0 && all.findIndex((x) => x?.id === s.id) === i);
  const chosen = available.find((s) => s?.id === sessionId) ?? available[0];
  const q = questions[rounds.length];
  const latest = rounds[rounds.length - 1];
  const playerScore = rounds.filter((r) => r.player === r.question.correctIndex).length * 100;
  const aiScore = rounds.filter((r) => r.ai === r.question.correctIndex).length * 100;
  const answer = (choice: number | null) => {
    if (phase !== "playing" || locked.current || !q) return;
    locked.current = true;
    setRounds((r) => [...r, { player: choice, ai: chooseOpponentAnswer(q, difficulty), question: q }]);
    setPhase("reveal");
  };
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);
  useEffect(() => { if (seconds === 0 && phase === "playing") answer(null); }, [seconds, phase]);
  const start = () => {
    if (!chosen) return;
    setQuestions([...chosen.quizQuestions].sort(() => Math.random() - .5).slice(0, 10));
    setRounds([]); setSeconds(20); locked.current = false; completed.current = false; setPhase("playing");
  };
  const next = () => {
    if (rounds.length === questions.length) {
      if (!completed.current) { recordBattle(playerScore > aiScore); completed.current = true; }
      setPhase("results");
    } else { locked.current = false; setSeconds(20); setPhase("playing"); }
  };
  const shareCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600; canvas.height = 340;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#141428"; ctx.fillRect(0, 0, 600, 340);
    ctx.strokeStyle = "#FFB800"; ctx.lineWidth = 8; ctx.strokeRect(8, 8, 584, 324);
    ctx.fillStyle = "#FFB800"; ctx.font = "bold 28px monospace"; ctx.textAlign = "center";
    ctx.fillText(playerScore > aiScore ? "VICTORY!" : "GOOD BATTLE!", 300, 80);
    ctx.fillStyle = "#FFF6E0"; ctx.font = "bold 52px monospace";
    ctx.fillText(`${playerScore} — ${aiScore}`, 300, 170);
    ctx.font = "20px monospace";
    ctx.fillText(`${avatar.name} vs Arcane AI · ${playerScore / 100}/${questions.length} correct`, 300, 230);
    ctx.fillStyle = "#7EB6FF"; ctx.fillText("FLASH LEARN · QUIZ ARENA", 300, 290);
    const a = document.createElement("a");
    a.download = "flash-learn-victory.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  return <div className="container max-w-5xl px-5 py-8 animate-fade-in">
    <div className="flex justify-between items-center gap-4 mb-6"><div><p className="pixel-text text-primary text-[0.6rem] mb-3">1V1 · VS AI</p><h1>Quiz arena</h1></div><Button asChild variant="outline" size="icon" title="Customize hero"><Link to="/avatar" aria-label="Customize hero"><PlayerAvatar avatar={avatar} size={32} /></Link></Button></div>
    <div ref={stage} className="battle-stage relative overflow-hidden mb-8 min-h-[265px] flex items-center justify-center">
      <div className="battle-mountains absolute inset-0" aria-hidden data-mx="7" />
      <div className="starfield absolute inset-0 opacity-60" aria-hidden />
      <div className="battle-floor absolute inset-x-0 bottom-0 h-14" aria-hidden />
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center w-full max-w-2xl px-4 gap-3">
        <div className="flex flex-col items-center min-w-0"><span className="pixel-text text-[0.6rem] break-words text-center max-w-full text-cream">{avatar.name}</span><PlayerAvatar avatar={avatar} size={140} className={cn("arena-avatar avatar-idle", phase === "reveal" && latest?.player === latest?.question.correctIndex && "battle-attack")} /><span className="pixel-text text-primary text-sm">{playerScore} XP</span></div>
        <span className="pixel-text text-primary text-lg duel-vs glow-pulse">VS</span>
        <div className="flex flex-col items-center min-w-0"><span className="pixel-text text-[0.6rem] text-cream">ARCANE AI</span><PlayerAvatar avatar={rival} size={140} className="arena-avatar avatar-idle rival-avatar" /><span className="pixel-text text-pixel-pink text-sm">{aiScore} XP</span></div>
      </div>
    </div>
    {phase === "setup" && <div className="max-w-2xl mx-auto space-y-6">
      <div><label htmlFor="battle-source" className="block text-lg mb-2">Study quest</label><select id="battle-source" className="pixel-input w-full p-3" value={chosen?.id ?? ""} onChange={(e) => setSessionId(e.target.value)} disabled={!available.length}>{available.length ? available.map((s) => s && <option key={s.id} value={s.id}>{s.title}</option>) : <option>No study quests yet</option>}</select></div>
      <fieldset><legend className="text-lg mb-3">AI difficulty</legend><div className="grid grid-cols-3 gap-2">{(["apprentice", "scholar", "master"] as const).map((d) => <Button key={d} variant={difficulty === d ? "default" : "outline"} onClick={() => setDifficulty(d)} aria-pressed={difficulty === d} className="capitalize">{d}</Button>)}</div></fieldset>
      <p className="text-muted-foreground">{Math.min(chosen?.quizQuestions.length ?? 0, 10)} rounds · 20 seconds per round · 100 XP per correct answer</p>
      <Button onClick={start} disabled={!chosen} className="w-full" variant="pixel" size="natural"><Swords />Start duel</Button>
      {!chosen && <Button asChild variant="link"><Link to="/">Create a study quest</Link></Button>}
    </div>}
    {(phase === "playing" || phase === "reveal") && <div className="max-w-2xl mx-auto">
      <div className="flex justify-between text-muted-foreground mb-4"><span>Round {phase === "reveal" ? rounds.length : rounds.length + 1} / {questions.length}</span><span className={cn("flex items-center gap-2", seconds < 6 && phase === "playing" && "text-destructive animate-pulse")}><Clock size={16} />{seconds}s</span></div>
      <progress aria-label="Round time remaining" max={20} value={seconds} className="battle-timer w-full h-2 mb-6" />
      <div key={`${rounds.length}-${phase}`} className="animate-fade-in"><h2 className="mb-5">{(phase === "playing" ? q : latest?.question)?.question}</h2>
      <div className="grid gap-3">{(phase === "playing" ? q : latest?.question)?.options.map((option, i) => <Button key={i} variant="outline" disabled={phase === "reveal"} onClick={() => answer(i)} className={cn("h-auto min-h-14 py-3 px-4 justify-start whitespace-normal text-left text-base", phase === "reveal" && i === latest?.question.correctIndex && "border-success bg-success/15 text-foreground", phase === "reveal" && i === latest?.player && i !== latest.question.correctIndex && "border-destructive bg-destructive/15")}>{phase === "reveal" && i === latest?.question.correctIndex ? <Check /> : <span className="text-primary shrink-0">{String.fromCharCode(65 + i)}.</span>}{option}</Button>)}</div></div>
      {phase === "reveal" && latest && <div className="mt-6 animate-fade-in" aria-live="polite"><p className="flex gap-2 items-center text-lg">{latest.player === latest.question.correctIndex ? <Check className="text-success" /> : <X className="text-destructive" />}{latest.player === null ? "Time’s up!" : latest.player === latest.question.correctIndex ? "Your attack lands! +100 XP" : "Missed attack."}</p><p className="text-muted-foreground mt-2">Arcane AI chose: {latest.question.options[latest.ai]} {latest.ai === latest.question.correctIndex ? "(+100 XP)" : "(miss)"}</p><p className="mt-3 text-foreground">{latest.question.explanation ?? `Correct answer: ${latest.question.options[latest.question.correctIndex]}`}</p><Button onClick={next} className="mt-5">{rounds.length === questions.length ? "Battle results" : "Next round"}<ArrowRight /></Button></div>}
    </div>}
    {phase === "results" && <div className="text-center max-w-2xl mx-auto animate-scale-in" aria-live="polite"><Trophy className="h-14 w-14 text-primary mx-auto mb-5 victory-trophy" /><h2>{playerScore > aiScore ? "Victory!" : playerScore === aiScore ? "An even match!" : "Arcane AI wins!"}</h2><p className="text-xl mt-4">{playerScore} — {aiScore} XP</p><p className="text-muted-foreground mt-2">{playerScore / 100} of {questions.length} correct</p><div className="flex flex-wrap justify-center gap-3 mt-6"><Button onClick={start}><RotateCcw />Rematch</Button><Button variant="outline" onClick={shareCard}><Share2 />Share win card</Button><Button variant="outline" onClick={() => setPhase("setup")}>Change challenge</Button></div></div>}
  </div>;
}