import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Level = "beginner" | "advanced";
type Mode = "normal" | "concise" | "detailed" | "simpler";

const SYSTEM_PROMPT = (videoTitle: string, context: string, level: Level, mode: Mode) => {
  const levelGuide =
    level === "beginner"
      ? "The student is a BEGINNER. Use very simple language, short sentences, everyday analogies. Avoid jargon. Always define new terms."
      : "The student is ADVANCED. You may use precise terminology and deeper reasoning, but stay clear and well-structured.";

  const modeGuide = (() => {
    switch (mode) {
      case "concise":
        return "RESPONSE LENGTH: Keep the spoken answer under 40 words. Markdown answer should be brief — 2 short sections max.";
      case "detailed":
        return "RESPONSE LENGTH: Provide a thorough, well-structured explanation with examples and step-by-step reasoning.";
      case "simpler":
        return "RESPONSE LENGTH: Re-explain in the simplest possible way, as if to a complete beginner. Use a short analogy. Spoken answer under 60 words.";
      default:
        return "RESPONSE LENGTH: Keep the spoken answer between 50 and 90 words — clear, conversational, and complete.";
    }
  })();

  return `You are Professor Aria, a warm, articulate, and highly professional AI Teacher guiding a student through the study material titled "${videoTitle}".

TEACHING PERSONA:
- Speak like a respectful university professor: courteous, encouraging, patient, and precise.
- Use clear pedagogical structure: motivate the idea, explain it step by step, then summarise.
- Stay warm but composed and academic. Encourage curiosity.

${levelGuide}

${modeGuide}

PRIMARY SOURCE (use this first):
${context || "No transcript/context available."}

STRICT RULES:
- Use the source material as your PRIMARY source.
- You may supplement with general academic knowledge, but NEVER fabricate citations, paper names, authors, or URLs.
- If you cannot find a verified external source, state: "No verified external source. This answer is based on the study material and general knowledge."

OUTPUT — return STRICT JSON ONLY (no code fences, no prose outside JSON):
{
  "spoken": "<short, natural-sounding spoken version of the answer — plain prose, no markdown, no emojis, no headings. This is what the AI Teacher will SAY OUT LOUD. Follow the RESPONSE LENGTH rule above.>",
  "markdown": "<the full teacher-style answer in markdown using the structure below>",
  "keyPoints": ["<3 to 5 short bullet points capturing the essentials>"],
  "snippets": ["<short quoted or paraphrased line from the study material>", "..."],
  "sources": [
    { "title": "<source title>", "platform": "<e.g. Study material transcript | Wikipedia | arXiv>", "link": "<url or 'Primary source — provided by user'>" }
  ]
}

The "markdown" field MUST follow this structure (adapt depth to the RESPONSE LENGTH rule):

## 📝 Answer
[Clear, professional explanation.]

## 🔑 Key Points
1. [Point 1]
2. [Point 2]
3. [Point 3]

## 📖 Detailed Notes
[Step-by-step explanation. Use bullets and analogies.]

## 📌 Evidence from Source
> [Quoted or closely paraphrased lines from the study material]

## 📚 Source
- **Title**: "${videoTitle}" (provided study material)
- **Platform**: Study material transcript
- **Link**: Primary source — provided by user

## 🎯 Confidence
**[High / Medium / Low]** — [Brief reason]

RULES:
- "spoken" must be plain natural prose with NO markdown, NO emojis, NO headings, NO bullet symbols. It will be read aloud.
- "snippets": 1–3 short quotes (≤ 200 chars) from the PRIMARY SOURCE, or [] if none.
- "sources": always include the primary study material entry. Add external sources ONLY if 100% certain.
- Return ONLY the JSON object.`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, videoTitle, context, level, mode } = await req.json();
    const safeLevel: Level = level === "advanced" ? "advanced" : "beginner";
    const safeMode: Mode =
      mode === "concise" || mode === "detailed" || mode === "simpler" ? mode : "normal";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT(videoTitle, context?.substring(0, 6000) || "", safeLevel, safeMode),
          },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI error");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    let reply = "I couldn't generate a response.";
    let spoken = "";
    let keyPoints: string[] = [];
    let snippets: string[] = [];
    let sources: { title: string; platform: string; link: string }[] = [];

    try {
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === "object") {
        reply = typeof parsed.markdown === "string" && parsed.markdown.trim() ? parsed.markdown : reply;
        spoken = typeof parsed.spoken === "string" ? parsed.spoken.trim() : "";
        keyPoints = Array.isArray(parsed.keyPoints)
          ? parsed.keyPoints.filter((s: any) => typeof s === "string").slice(0, 6)
          : [];
        snippets = Array.isArray(parsed.snippets)
          ? parsed.snippets.filter((s: any) => typeof s === "string").slice(0, 5)
          : [];
        sources = Array.isArray(parsed.sources)
          ? parsed.sources
              .filter((s: any) => s && typeof s === "object")
              .map((s: any) => ({
                title: String(s.title ?? "").slice(0, 200),
                platform: String(s.platform ?? "").slice(0, 120),
                link: String(s.link ?? "").slice(0, 500),
              }))
              .slice(0, 6)
          : [];
      }
    } catch {
      reply = raw || reply;
    }

    if (!spoken) {
      // Fallback: derive a short spoken version from the markdown
      spoken = reply
        .replace(/```[\s\S]*?```/g, "")
        .replace(/[#*_>`~]+/g, "")
        .replace(/[📝🔑📖📌📚🧠🎯]/g, "")
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 600);
    }

    if (sources.length === 0) {
      sources = [{ title: videoTitle, platform: "Study material transcript", link: "Primary source — provided by user" }];
    }

    return new Response(JSON.stringify({ reply, spoken, keyPoints, snippets, sources }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Tutor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
