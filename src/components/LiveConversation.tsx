import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Phone, PhoneOff, Mic, Volume2, Loader2, User, Bot, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AGENT_ID_STORAGE_KEY = "elevenlabs_agent_id";

interface Turn {
  role: "user" | "agent";
  text: string;
  ts: number;
}

interface Props {
  videoTitle?: string;
  context?: string;
  level?: "beginner" | "advanced";
}

export default function LiveConversation({ videoTitle, context, level = "beginner" }: Props) {
  const [agentId, setAgentId] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem(AGENT_ID_STORAGE_KEY) || "" : ""
  );
  const [agentIdInput, setAgentIdInput] = useState(agentId);
  const [showSettings, setShowSettings] = useState(!agentId);
  const [connecting, setConnecting] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      toast({ title: "Connected", description: "You're now talking with Professor Aria." });
    },
    onDisconnect: () => {
      toast({ title: "Conversation ended" });
    },
    onError: (err: unknown) => {
      console.error("Conversation error:", err);
      toast({
        variant: "destructive",
        title: "Connection error",
        description: "Could not connect. Check your Agent ID and try again.",
      });
    },
    onMessage: (message: { source?: string; message?: string }) => {
      // SDK emits { source: 'user' | 'ai', message: string }
      const role: "user" | "agent" = message?.source === "user" ? "user" : "agent";
      const text = (message?.message || "").trim();
      if (!text) return;
      setTurns((prev) => [...prev, { role, text, ts: Date.now() }]);
    },
  });

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, conversation.isSpeaking]);

  const saveAgentId = useCallback(() => {
    const id = agentIdInput.trim();
    if (!id) {
      toast({ variant: "destructive", title: "Agent ID required" });
      return;
    }
    localStorage.setItem(AGENT_ID_STORAGE_KEY, id);
    setAgentId(id);
    setShowSettings(false);
    toast({ title: "Agent saved" });
  }, [agentIdInput]);

  const start = useCallback(async () => {
    if (!agentId) {
      setShowSettings(true);
      return;
    }
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", {
        body: { agentId },
      });
      if (error || !data?.token) {
        throw new Error((data as { error?: string })?.error || error?.message || "No token");
      }

      // Build a contextual override so the agent knows what the student is studying.
      const trimmedContext = (context || "").slice(0, 4000);
      const overrides = {
        agent: {
          prompt: {
            prompt: `You are Professor Aria, a warm, articulate, highly professional AI Teacher. You are tutoring a student through the study material titled "${videoTitle || "their current lesson"}".

TEACHING PERSONA:
- Speak like a real, conversational university professor — warm, patient, encouraging.
- Have a real two-way conversation: ask the student what they already know, check understanding often, invite questions.
- Keep each turn SHORT (1–3 sentences). Pause and let the student respond.
- Use simple analogies. ${level === "beginner" ? "Avoid jargon; define new terms." : "You may use precise terminology."}
- Never lecture for more than 3 sentences in a row before checking in ("Does that make sense?", "Want me to go deeper or move on?").
- If the student is silent, gently prompt them with a question.

STUDY MATERIAL CONTEXT (background only, never cite as a source):
${trimmedContext || "No transcript available — rely on general knowledge and ask the student what they're working on."}

When citing sources, refer to real external references (Wikipedia, official docs, etc.), never the uploaded material.`,
          },
          firstMessage:
            videoTitle
              ? `Hello! I'm Professor Aria. I see you're studying "${videoTitle}". What would you like to explore first — should I give you a quick overview, or is there a specific part you'd like to dive into?`
              : "Hello! I'm Professor Aria, your AI tutor. What would you like to learn about today?",
        },
      };

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
        overrides,
      });
    } catch (e) {
      console.error("start failed:", e);
      toast({
        variant: "destructive",
        title: "Could not start conversation",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setConnecting(false);
    }
  }, [agentId, conversation, context, level, videoTitle]);

  const stop = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === "connected";
  const statusLabel = useMemo(() => {
    if (connecting) return "Connecting…";
    if (isConnected && conversation.isSpeaking) return "Professor is speaking…";
    if (isConnected) return "Listening — speak naturally";
    return "Idle";
  }, [connecting, isConnected, conversation.isSpeaking]);

  return (
    <div className="space-y-4">
      {/* Settings */}
      {(showSettings || !agentId) && (
        <Card className="p-4 space-y-3 border-primary/30 bg-primary/5">
          <div>
            <Label htmlFor="agent-id" className="font-semibold">ElevenLabs Agent ID</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Create an agent at{" "}
              <a
                href="https://elevenlabs.io/app/conversational-ai"
                target="_blank"
                rel="noreferrer"
                className="underline text-primary"
              >
                elevenlabs.io/app/conversational-ai
              </a>
              {" "}then paste its Agent ID below.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              id="agent-id"
              value={agentIdInput}
              onChange={(e) => setAgentIdInput(e.target.value)}
              placeholder="agent_xxxxxxxxxxxxx"
              className="font-mono"
            />
            <Button onClick={saveAgentId}>Save</Button>
          </div>
        </Card>
      )}

      {/* Controls */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
              isConnected
                ? conversation.isSpeaking
                  ? "bg-primary/20 ring-4 ring-primary/40 animate-pulse"
                  : "bg-emerald-500/20 ring-2 ring-emerald-500/40"
                : "bg-muted"
            }`}
          >
            {conversation.isSpeaking ? (
              <Volume2 className="h-5 w-5 text-primary" />
            ) : isConnected ? (
              <Mic className="h-5 w-5 text-emerald-500" />
            ) : (
              <Bot className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="font-semibold">Professor Aria</div>
            <div className="text-xs text-muted-foreground">{statusLabel}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {agentId && (
            <Button variant="ghost" size="icon" onClick={() => setShowSettings((v) => !v)} title="Agent settings">
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {isConnected ? (
            <Button onClick={stop} variant="destructive">
              <PhoneOff className="h-4 w-4 mr-2" />
              End conversation
            </Button>
          ) : (
            <Button onClick={start} disabled={connecting || !agentId}>
              {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Phone className="h-4 w-4 mr-2" />}
              Talk to Professor Aria
            </Button>
          )}
        </div>
      </Card>

      {/* Live transcript */}
      <Card className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Live transcript</div>
        <div ref={transcriptRef} className="max-h-[340px] overflow-y-auto space-y-3 pr-1">
          {turns.length === 0 ? (
            <div className="text-sm text-muted-foreground italic py-6 text-center">
              {isConnected
                ? "Say hello to start the conversation…"
                : "Tap “Talk to Professor Aria” to begin a real, two-way voice conversation."}
            </div>
          ) : (
            turns.map((t, i) => (
              <div key={i} className={`flex gap-2 ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                {t.role === "agent" && (
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    t.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {t.text}
                </div>
                {t.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        Tip: you can interrupt the professor any time by speaking — it's a real conversation, not a recording.
      </p>
    </div>
  );
}
