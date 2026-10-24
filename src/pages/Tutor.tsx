import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Loader2,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronDown,
  BookOpen,
  Quote,
  ExternalLink,
  Square,
  Sparkles,
  Wand2,
  Zap,
  ListChecks,
  Phone,
  PhoneOff,
  MessageSquare,
  Headphones,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import AITeacher from "@/components/AITeacher";
import { toast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SourceRef {
  title: string;
  platform: string;
  link: string;
}

type ChatMode = "voice" | "text" | "hybrid";
type Level = "beginner" | "advanced";
type AskMode = "normal" | "concise" | "detailed" | "simpler";

interface Message {
  role: "user" | "assistant";
  content: string;
  spoken?: string;
  keyPoints?: string[];
  snippets?: string[];
  sources?: SourceRef[];
}

// Detect frustration / confusion in user input
function detectsConfusion(text: string): boolean {
  const t = text.toLowerCase();
  return /\b(i\s*don'?t\s*(get|understand)|confused|confusing|too\s*hard|too\s*complex|simpler|simpli(fy|er)|huh\??|what\?+|repeat|again please)\b/.test(
    t
  );
}

// Live waveform driven by mic input
function LiveWaveform({ active, stream }: { active: boolean; stream: MediaStream | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!active || !stream) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
      return;
    }
    const AC: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    let lastPaint = 0;
    const draw = (now: number) => {
      if (document.hidden) { rafRef.current = null; return; }
      // 30fps is plenty for the visualizer, and halves canvas draw cost.
      if (now - lastPaint < 33) { rafRef.current = requestAnimationFrame(draw); return; }
      lastPaint = now;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const c = canvas.getContext("2d");
      if (!c) return;
      const w = canvas.width;
      const h = canvas.height;
      analyser.getByteFrequencyData(data);
      c.clearRect(0, 0, w, h);
      const bars = 28;
      const step = Math.floor(data.length / bars);
      const gap = 3;
      const barWidth = (w - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const v = data[i * step] / 255;
        const bh = Math.max(3, v * h * 0.95);
        const x = i * (barWidth + gap);
        const y = (h - bh) / 2;
        c.fillStyle = `hsl(var(--primary) / ${0.45 + v * 0.55})`;
        c.fillRect(x, y, barWidth, bh);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    const onVisibility = () => {
      if (!document.hidden && !rafRef.current) rafRef.current = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      ctx.close().catch(() => {});
    };
  }, [active, stream]);

  return <canvas ref={canvasRef} width={520} height={64} className="w-full h-12 rounded-lg" />;
}

export default function Tutor() {
  const session = useAppStore((s) => s.currentSession);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("hybrid");
  const [level, setLevel] = useState<Level>("beginner");
  const [conversationActive, setConversationActive] = useState(false);
  const [subtitle, setSubtitle] = useState<string>("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<{ stop: () => void; start: () => void } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const lastReplyRef = useRef<Message | null>(null);
  const lastUserQuestionRef = useRef<string>("");
  const responseCacheRef = useRef<Map<string, { audioUrl: string }>>(new Map());
  const micStreamRef = useRef<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const conversationActiveRef = useRef(false);

  useEffect(() => {
    conversationActiveRef.current = conversationActive;
  }, [conversationActive]);

  useEffect(() => {
    // Avoid restarting a smooth-scroll animation for every spoken subtitle word.
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length, interimTranscript]);

  // Cleanup
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      // Cleanup any cached blob URLs
      responseCacheRef.current.forEach((v) => URL.revokeObjectURL(v.audioUrl));
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
    setSubtitle("");
  }, []);

  // Subtitle progressive reveal driven by audio currentTime
  const startSubtitle = useCallback((text: string, audio: HTMLAudioElement) => {
    if (!text) return;
    const words = text.split(/\s+/);
    let lastIdx = 0;
    const tick = () => {
      if (audio.paused || audio.ended) return;
      const dur = audio.duration || 1;
      const ratio = Math.min(1, audio.currentTime / dur);
      const idx = Math.max(1, Math.floor(words.length * ratio));
      if (idx !== lastIdx) {
        lastIdx = idx;
        setSubtitle(words.slice(0, idx).join(" "));
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  // Pick the most natural-sounding human voice the browser offers.
  // Priority: premium neural voices (Google, Microsoft Natural, Apple Siri/Premium) → en-US/en-GB female teacher-like.
  const pickBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    if (!voices.length) return null;

    const preferredNames = [
      // Apple (macOS / iOS) — very natural
      "Samantha", "Ava", "Allison", "Susan", "Karen", "Serena", "Moira", "Tessa",
      "Siri Female (English (United States))", "Siri Female",
      // Microsoft Natural / Neural (Edge)
      "Microsoft Aria Online (Natural) - English (United States)",
      "Microsoft Jenny Online (Natural) - English (United States)",
      "Microsoft Emma Online (Natural) - English (United States)",
      "Microsoft Libby Online (Natural) - English (United Kingdom)",
      "Microsoft Sonia Online (Natural) - English (United Kingdom)",
      // Google Chrome
      "Google UK English Female", "Google US English",
    ];

    for (const name of preferredNames) {
      const v = voices.find((x) => x.name === name);
      if (v) return v;
    }
    // Fallback: any en-* voice that sounds female / natural
    const enNatural = voices.find(
      (v) => /en[-_]/i.test(v.lang) && /(natural|neural|aria|jenny|emma|libby|sonia|samantha|ava)/i.test(v.name)
    );
    if (enNatural) return enNatural;
    const enFemale = voices.find((v) => /en[-_]/i.test(v.lang) && /female|woman|girl/i.test(v.name));
    if (enFemale) return enFemale;
    const anyEn = voices.find((v) => /en[-_]/i.test(v.lang));
    return anyEn || voices[0];
  }, []);

  // Ensure voices are loaded (Chrome populates async)
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const load = () => synth.getVoices();
    load();
    synth.addEventListener?.("voiceschanged", load);
    return () => synth.removeEventListener?.("voiceschanged", load);
  }, []);

  // Split a long teacher response into natural sentence chunks so the browser
  // doesn't truncate, and so prosody resets between sentences (sounds more human).
  const splitIntoSentences = (text: string): string[] => {
    const cleaned = text.replace(/\s+/g, " ").trim();
    const parts = cleaned.match(/[^.!?]+[.!?]+["')\]]?|[^.!?]+$/g) || [cleaned];
    // Merge tiny fragments into the previous sentence
    const merged: string[] = [];
    for (const p of parts) {
      const s = p.trim();
      if (!s) continue;
      if (merged.length && s.length < 25) merged[merged.length - 1] += " " + s;
      else merged.push(s);
    }
    return merged;
  };

  const playSpeech = useCallback(
    async (text: string) => {
      if (muted || !text) return;
      stopSpeaking();

      const synth = window.speechSynthesis;
      if (!synth) {
        setSpeaking(false);
        return;
      }
      synth.cancel();

      const voice = pickBestVoice();
      const sentences = splitIntoSentences(text);
      if (!sentences.length) return;

      setSpeaking(true);
      setSubtitle("");

      // Progressive subtitle reveal driven by sentence boundaries + word boundaries
      let spokenSoFar = "";
      let currentIndex = 0;

      const speakNext = () => {
        if (!conversationActiveRef.current && currentIndex === 0) {
          // continue regardless — user pressed send/replay
        }
        if (currentIndex >= sentences.length) {
          setSpeaking(false);
          setSubtitle("");
          if (conversationActiveRef.current && chatMode !== "text") {
            setTimeout(() => startListening(true), 250);
          }
          return;
        }
        const sentence = sentences[currentIndex++];
        const u = new SpeechSynthesisUtterance(sentence);
        if (voice) {
          u.voice = voice;
          u.lang = voice.lang;
        } else {
          u.lang = "en-US";
        }
        // Teacher-like delivery: calm, warm, slightly slower than default,
        // with a natural mid-range pitch.
        u.rate = 0.95;
        u.pitch = 1.05;
        u.volume = 1;

        u.onstart = () => {
          setSpeaking(true);
        };
        u.onboundary = (e: SpeechSynthesisEvent) => {
          if (e.name && e.name !== "word") return;
          const upto = sentence.slice(0, e.charIndex || 0);
          setSubtitle((spokenSoFar + " " + upto).trim());
        };
        u.onend = () => {
          spokenSoFar = (spokenSoFar + " " + sentence).trim();
          setSubtitle(spokenSoFar);
          // Tiny natural pause between sentences
          setTimeout(speakNext, 120);
        };
        u.onerror = () => {
          spokenSoFar = (spokenSoFar + " " + sentence).trim();
          setTimeout(speakNext, 60);
        };
        synth.speak(u);
      };

      speakNext();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [muted, stopSpeaking, pickBestVoice, chatMode]
  );

  const ensureMicStream = useCallback(async (): Promise<MediaStream | null> => {
    if (micStreamRef.current && micStreamRef.current.active) return micStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;
      setMicStream(stream);
      return stream;
    } catch {
      toast({
        title: "Microphone blocked",
        description: "Please allow microphone access to talk with the AI Teacher.",
      });
      return null;
    }
  }, []);

  const startListening = useCallback(
    async (silent = false) => {
      const SR =
        (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
      if (!SR) {
        if (!silent)
          toast({
            title: "Voice input not supported",
            description: "Try Chrome or Edge for microphone input.",
          });
        return;
      }
      if (listening) {
        recognitionRef.current?.stop();
        return;
      }
      const stream = await ensureMicStream();
      if (!stream) return;
      stopSpeaking();
      setInterimTranscript("");

      const recognition = new SR() as SpeechRecognitionLike & {
        lang: string;
        interimResults: boolean;
        continuous: boolean;
        onstart: (() => void) | null;
        onresult: ((e: SpeechRecognitionEvent) => void) | null;
        onerror: ((e: unknown) => void) | null;
        onend: (() => void) | null;
      };
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onstart = () => setListening(true);
      recognition.onresult = (e: SpeechRecognitionEvent) => {
        let interim = "";
        let finalText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) finalText += res[0].transcript;
          else interim += res[0].transcript;
        }
        if (interim) setInterimTranscript(interim);
        if (finalText) {
          setInterimTranscript("");
          setListening(false);
          setInput(finalText);
          setTimeout(() => sendMessage(finalText), 80);
        }
      };
      recognition.onerror = () => {
        setListening(false);
        setInterimTranscript("");
      };
      recognition.onend = () => {
        setListening(false);
        setInterimTranscript("");
      };
      recognitionRef.current = recognition;
      recognition.start();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listening, ensureMicStream, stopSpeaking]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop?.();
    setListening(false);
    setInterimTranscript("");
  }, []);

  const sendMessage = useCallback(
    async (text: string, modeOverride: AskMode = "normal") => {
      if (!text.trim() || loading || !session) return;
      const userMsg: Message = { role: "user", content: text.trim() };
      lastUserQuestionRef.current = text.trim();

      // Auto-simplify if confusion is detected
      let askMode: AskMode = modeOverride;
      if (askMode === "normal" && detectsConfusion(text)) {
        askMode = "simpler";
      }

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setInterimTranscript("");
      setLoading(true);
      stopSpeaking();

      try {
        const { data, error } = await supabase.functions.invoke("ai-tutor", {
          body: {
            messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
            videoTitle: session.title,
            context: session.flashcards.map((c) => `Q: ${c.front} A: ${c.back}`).join("\n"),
            level,
            mode: askMode,
          },
        });

        if (error) throw error;
        const reply = (data?.reply as string) || "";
        const spoken = (data?.spoken as string) || "";
        const keyPoints = (data?.keyPoints as string[]) || [];
        const snippets = (data?.snippets as string[]) || [];
        const sources = (data?.sources as SourceRef[]) || [];

        const assistantMsg: Message = {
          role: "assistant",
          content: reply,
          spoken,
          keyPoints,
          snippets,
          sources,
        };
        lastReplyRef.current = assistantMsg;
        setMessages((prev) => [...prev, assistantMsg]);

        // Always speak the spoken version aloud (unless muted) — in every mode
        const toSpeak = spoken || stripPlain(reply);
        if (toSpeak) {
          playSpeech(toSpeak);
        }
      } catch (err) {
        console.error("AI tutor error", err);
        const fallback =
          "I apologise — I encountered a brief issue while preparing your answer. Could you please try again?";
        const fb: Message = { role: "assistant", content: fallback, spoken: fallback };
        setMessages((prev) => [...prev, fb]);
        lastReplyRef.current = fb;
        playSpeech(fallback);
        // Switch to text mode if backend keeps failing
        if (chatMode === "voice") {
          toast({
            title: "Voice mode unavailable",
            description: "Switched to text mode. You can keep typing your questions.",
          });
          setChatMode("hybrid");
        }
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, session, messages, level, chatMode, playSpeech, stopSpeaking]
  );

  const handleSend = () => sendMessage(input);

  const replay = () => {
    const last = lastReplyRef.current;
    if (!last) return;
    playSpeech(last.spoken || stripPlain(last.content));
  };

  const explainSimpler = () => {
    if (!lastUserQuestionRef.current) return;
    sendMessage(lastUserQuestionRef.current, "simpler");
  };
  const askShort = () => {
    if (!lastUserQuestionRef.current) return;
    sendMessage(lastUserQuestionRef.current, "concise");
  };
  const askDetailed = () => {
    if (!lastUserQuestionRef.current) return;
    sendMessage(lastUserQuestionRef.current, "detailed");
  };

  const startConversation = useCallback(async () => {
    const stream = await ensureMicStream();
    if (!stream) return;
    setConversationActive(true);
    setChatMode((m) => (m === "text" ? "hybrid" : m));
    if (messages.length === 0) {
      // Friendly opener so the experience feels like "Talk to your teacher"
      const opener = `Hello! I'm Professor Aria, your tutor for ${session?.title ?? "this lesson"}. What would you like to explore first?`;
      const m: Message = { role: "assistant", content: `## 📝 Welcome\n${opener}`, spoken: opener };
      lastReplyRef.current = m;
      setMessages([m]);
      await playSpeech(opener);
    } else {
      startListening(true);
    }
  }, [ensureMicStream, messages.length, playSpeech, session?.title, startListening]);

  const endConversation = useCallback(() => {
    setConversationActive(false);
    stopListening();
    stopSpeaking();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    setMicStream(null);
  }, [stopListening, stopSpeaking]);

  const statusText = useMemo(() => {
    if (listening) return "Listening…";
    if (loading) return "Thinking…";
    if (speaking) return "Professor Aria is speaking…";
    if (conversationActive) return "Ready — speak or type your question";
    return `Ready to help with “${session?.title ?? ""}”`;
  }, [listening, loading, speaking, conversationActive, session?.title]);

  if (!session) {
    return (
      <div className="container max-w-3xl py-20 text-center">
        <p className="text-muted-foreground">No study session. Generate one first to chat with your AI tutor.</p>
      </div>
    );
  }

  const showInputForm = chatMode !== "voice" || !conversationActive;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="container max-w-3xl py-3 px-3 sm:px-4 flex flex-col min-h-[calc(100dvh-4rem-5rem)] md:h-[calc(100dvh-4rem-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">AI Tutor</h1>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={replay}
            disabled={!lastReplyRef.current || speaking}
            title="Replay last explanation"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => {
              if (!muted) stopSpeaking();
              setMuted((m) => !m);
            }}
            title={muted ? "Unmute teacher" : "Mute teacher"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          {speaking && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={stopSpeaking}
              title="Stop response"
            >
              <Square className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mode + Level controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 sm:mb-3">
        <Tabs value={chatMode} onValueChange={(v) => setChatMode(v as ChatMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="voice" className="text-xs gap-1 px-2">
              <Headphones className="h-3.5 w-3.5" /> Voice
            </TabsTrigger>
            <TabsTrigger value="text" className="text-xs gap-1 px-2">
              <MessageSquare className="h-3.5 w-3.5" /> Text
            </TabsTrigger>
            <TabsTrigger value="hybrid" className="text-xs gap-1 px-2">
              <Sparkles className="h-3.5 w-3.5" /> Hybrid
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Label htmlFor="level-switch" className="cursor-pointer">
            Beginner
          </Label>
          <Switch
            id="level-switch"
            checked={level === "advanced"}
            onCheckedChange={(c) => setLevel(c ? "advanced" : "beginner")}
          />
          <Label htmlFor="level-switch" className="cursor-pointer">
            Advanced
          </Label>
        </div>
      </div>

      <>
      {/* AI Teacher avatar + Talk button */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-border p-3 sm:p-4 mb-2 sm:mb-3 shrink-0">
        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2">
          <div className="w-20 h-20 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
            <AITeacher speaking={speaking} thinking={loading} listening={listening} />
          </div>
          <div className="flex-1 sm:w-full sm:text-center min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{statusText}</p>
            <div className="flex flex-wrap gap-2 sm:justify-center">
              {!conversationActive ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={startConversation}
                  className="gap-2 shadow-md"
                >
                  <Phone className="h-4 w-4" />
                  Talk to AI Teacher
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant={listening ? "default" : "outline"}
                    onClick={() => (listening ? stopListening() : startListening())}
                    disabled={loading}
                    className="gap-1.5"
                  >
                    {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    {listening ? "Stop" : "Speak"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={endConversation}
                    className="gap-1.5"
                  >
                    <PhoneOff className="h-3.5 w-3.5" />
                    End
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live waveform when listening */}
        {listening && (
          <div className="mt-3">
            <LiveWaveform active={listening} stream={micStream} />
          </div>
        )}

        {/* Subtitle while AI speaks */}
        {speaking && subtitle && (
          <div className="mt-3 rounded-lg bg-background/60 border border-border px-3 py-2 text-sm text-foreground leading-relaxed">
            {subtitle}
            <span className="inline-block w-1 h-4 bg-primary/70 align-middle ml-1 animate-pulse" />
          </div>
        )}
      </div>

      {/* Smart action buttons */}
      {lastAssistant && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={replay} disabled={speaking}>
            <RefreshCw className="h-3 w-3" /> Repeat
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={explainSimpler}
            disabled={loading || !lastUserQuestionRef.current}
          >
            <Wand2 className="h-3 w-3" /> Simpler
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={askShort}
            disabled={loading || !lastUserQuestionRef.current}
          >
            <Zap className="h-3 w-3" /> Short
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={askDetailed}
            disabled={loading || !lastUserQuestionRef.current}
          >
            <ListChecks className="h-3 w-3" /> Detailed
          </Button>
        </div>
      )}

      {/* Chat scroll area */}
      <div ref={scrollRef} className="flex-1 min-h-[200px] overflow-y-auto space-y-4 mb-3 pr-1">
        {messages.length === 0 && !interimTranscript && (
          <div className="text-center py-8">
            <Bot className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Tap <span className="font-medium text-foreground">Talk to AI Teacher</span> or type a question to begin.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className={`flex flex-col gap-2 ${m.role === "user" ? "max-w-[80%]" : "max-w-[95%]"}`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:text-base prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1 prose-li:my-0.5 prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:my-2 prose-hr:my-3">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>

              {m.role === "assistant" &&
                ((m.snippets && m.snippets.length > 0) || (m.sources && m.sources.length > 0)) && (
                  <Collapsible>
                    <CollapsibleTrigger className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-1 rounded">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span className="font-medium">What I used</span>
                      {m.snippets && m.snippets.length > 0 && (
                        <span className="text-muted-foreground/70">
                          · {m.snippets.length} snippet{m.snippets.length === 1 ? "" : "s"}
                        </span>
                      )}
                      {m.sources && m.sources.length > 0 && (
                        <span className="text-muted-foreground/70">
                          · {m.sources.length} source{m.sources.length === 1 ? "" : "s"}
                        </span>
                      )}
                      <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 rounded-xl border border-border bg-card/50 p-3 space-y-3">
                      {m.snippets && m.snippets.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1.5">
                            <Quote className="h-3.5 w-3.5 text-primary" />
                            Transcript snippets
                          </div>
                          <ul className="space-y-1.5">
                            {m.snippets.map((s, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-2 italic leading-relaxed"
                              >
                                "{s}"
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {m.sources && m.sources.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1.5">
                            <ExternalLink className="h-3.5 w-3.5 text-primary" />
                            Sources
                          </div>
                          <ul className="space-y-1.5">
                            {m.sources.map((src, idx) => {
                              const isUrl = /^https?:\/\//i.test(src.link);
                              return (
                                <li key={idx} className="text-xs">
                                  <div className="font-medium text-foreground">{src.title || "Untitled"}</div>
                                  <div className="text-muted-foreground">
                                    {src.platform}
                                    {src.link && (
                                      <>
                                        {" · "}
                                        {isUrl ? (
                                          <a
                                            href={src.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline break-all"
                                          >
                                            {src.link}
                                          </a>
                                        ) : (
                                          <span className="italic">{src.link}</span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}
            </div>
            {m.role === "user" && (
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
        ))}

        {interimTranscript && (
          <div className="flex gap-3 justify-end">
            <div className="rounded-2xl px-4 py-3 text-sm max-w-[80%] bg-primary/10 text-foreground border border-dashed border-primary/40 italic flex items-center gap-2">
              <Mic className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
              <span>{interimTranscript}</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-2xl bg-muted px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input form (hidden in pure voice mode while a conversation is active) */}
      {showInputForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Button
            type="button"
            size="icon"
            variant={listening ? "default" : "outline"}
            onClick={() => (listening ? stopListening() : startListening())}
            disabled={loading || chatMode === "text"}
            title={
              chatMode === "text"
                ? "Voice disabled in Text mode"
                : listening
                  ? "Stop listening"
                  : "Speak your question"
            }
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            placeholder={listening ? "Listening…" : "Ask a question…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || listening}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
      </>
    </div>
  );
}

// Helpers / minimal types ----------------------------------------------------

function stripPlain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_>`~]+/g, "")
    .replace(/[📝🔑📖📌📚🧠🎯]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface SpeechRecognitionLike {
  start: () => void;
  stop: () => void;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
