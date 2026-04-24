import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Bot, User, Mic, MicOff, Volume2, VolumeX, RotateCcw, ChevronDown, BookOpen, Quote, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import AITeacher from "@/components/AITeacher";
import { toast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SourceRef {
  title: string;
  platform: string;
  link: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  snippets?: string[];
  sources?: SourceRef[];
}

// Strip markdown so the speech sounds natural
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[*_~]+/g, "")
    .replace(/^---+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[📝🔑📖📌📚🧠🎯]/g, "")
    .trim();
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastReplyRef = useRef<string>("");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, interimTranscript]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop?.();
    };
  }, []);

  const speak = (text: string) => {
    if (muted || !text) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const clean = stripMarkdown(text);
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 0.98;
    utter.pitch = 1.0;
    utter.volume = 1;
    // Prefer a calm, professional English voice
    const voices = synth.getVoices();
    const preferred =
      voices.find((v) => /en[-_](US|GB)/i.test(v.lang) && /(female|samantha|victoria|karen|google uk english female|google us english)/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0];
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    synth.speak(utter);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const toggleMute = () => {
    if (!muted) stopSpeaking();
    setMuted((m) => !m);
  };

  const replay = () => {
    if (!lastReplyRef.current) return;
    speak(lastReplyRef.current);
  };

  const startListening = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: "Voice input not supported", description: "Try Chrome or Edge for microphone input." });
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    stopSpeaking();
    setInterimTranscript("");
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e: any) => {
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
        setTimeout(() => sendMessage(finalText), 100);
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
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !session) return;
    const userMsg: Message = { role: "user", content: text.trim() };
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
        },
      });

      if (error) throw error;
      const reply = (data?.reply as string) || "";
      const snippets = (data?.snippets as string[]) || [];
      const sources = (data?.sources as SourceRef[]) || [];
      lastReplyRef.current = reply;
      setMessages((prev) => [...prev, { role: "assistant", content: reply, snippets, sources }]);
      speak(reply);
    } catch {
      const fallback = "I apologise — I encountered a brief issue while preparing your answer. Could you please try again?";
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
      lastReplyRef.current = fallback;
      speak(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);

  if (!session) {
    return (
      <div className="container max-w-3xl py-20 text-center">
        <p className="text-muted-foreground">No study session. Generate one first to chat with your AI tutor.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-4 px-4 flex flex-col" style={{ height: "calc(100vh - 4rem - 5rem)" }}>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-foreground">AI Tutor</h1>
        <div className="flex gap-1">
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
            onClick={toggleMute}
            title={muted ? "Unmute teacher" : "Mute teacher"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* AI Teacher avatar panel */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-border p-4 mb-3 flex flex-col items-center">
        <AITeacher speaking={speaking} thinking={loading} listening={listening} />
        <p className="text-xs text-muted-foreground mt-2 text-center min-h-[1rem]">
          {listening
            ? "🎤 Listening..."
            : loading
              ? "Preparing your answer..."
              : speaking
                ? "Professor Aria is explaining..."
                : `Ready to help with "${session.title}"`}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-3 pr-1">
        {messages.length === 0 && !interimTranscript && (
          <div className="text-center py-8">
            <Bot className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Ask me anything — type or tap the microphone 🎙️
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

              {/* "What I used" — only on assistant messages with provenance */}
              {m.role === "assistant" && ((m.snippets && m.snippets.length > 0) || (m.sources && m.sources.length > 0)) && (
                <Collapsible>
                  <CollapsibleTrigger className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-1 rounded">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="font-medium">What I used</span>
                    {m.snippets && m.snippets.length > 0 && (
                      <span className="text-muted-foreground/70">· {m.snippets.length} snippet{m.snippets.length === 1 ? "" : "s"}</span>
                    )}
                    {m.sources && m.sources.length > 0 && (
                      <span className="text-muted-foreground/70">· {m.sources.length} source{m.sources.length === 1 ? "" : "s"}</span>
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

        {/* Live mic transcript bubble (temporary, not yet sent) */}
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
          onClick={startListening}
          disabled={loading}
          title={listening ? "Stop listening" : "Speak your question"}
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
    </div>
  );
}
