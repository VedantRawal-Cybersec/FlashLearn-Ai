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

TEACHING PERSONA (be genuinely interactive, like a real professor in a tutorial):
- Address the student respectfully ("Great question", "Let's think about this together", "Excellent — let's unpack that").
- Open with a one-line acknowledgement of the question, then teach.
- Use a clear pedagogical arc: (1) motivate the idea, (2) explain step by step with an analogy, (3) summarise, (4) end with ONE short Socratic follow-up question to keep the dialogue going (e.g. "Does that distinction make sense, or shall I illustrate with another example?").
- Be warm, composed, and academic. Encourage curiosity. Never robotic.
- Refer back to what the student previously asked when relevant ("Building on your earlier question about X…").

${levelGuide}

${modeGuide}

STUDY MATERIAL CONTEXT (background only — do NOT cite this as a source):
${context || "No transcript/context available."}

SOURCE / CITATION RULES — VERY IMPORTANT:
- The uploaded study material is ONLY background context. NEVER list it in "sources". NEVER write phrases like "according to the provided study material", "from the transcript", or "primary source provided by user".
- In "sources", list ONLY real, external, verifiable references that actually support the answer (e.g. Wikipedia articles, official documentation, well-known textbooks, academic papers, reputable websites).
- Each source MUST have a real, working public URL (e.g. https://en.wikipedia.org/wiki/<topic>, https://docs.python.org/3/..., https://arxiv.org/abs/...). Do NOT invent URLs. Do NOT use placeholders.
- Prefer 2–4 high-quality external sources. If you are not 100% sure of a URL, OMIT that source rather than guess.
- Inside the "markdown" answer, weave inline attributions naturally, e.g. "According to Wikipedia (en.wikipedia.org/wiki/Photosynthesis), …" or "As described in the official React docs (react.dev/learn), …".
- If you genuinely cannot recall any verified external source, return "sources": [] and state in the markdown: "I don't have a verified external source to cite for this — the explanation is based on widely accepted general knowledge."

OUTPUT — return STRICT JSON ONLY (no code fences, no prose outside JSON):
{
  "spoken": "<short, natural-sounding spoken version — plain prose, no markdown, no emojis, no headings. Should sound like a professor speaking warmly to one student. End with a brief follow-up question. Follow the RESPONSE LENGTH rule.>",
  "markdown": "<the full teacher-style answer in markdown using the structure below>",
  "keyPoints": ["<3 to 5 short bullet points capturing the essentials>"],
  "snippets": ["<short paraphrased line illustrating the concept>", "..."],
  "sources": [
    { "title": "<real external source title, e.g. 'Photosynthesis — Wikipedia'>", "platform": "<Wikipedia | Official Docs | arXiv | Khan Academy | etc.>", "link": "<real public URL>" }
  ]
}

The "markdown" field MUST follow this structure (adapt depth to the RESPONSE LENGTH rule):

## 👋 Acknowledgement
[One short, warm line acknowledging the question.]

## 📝 Answer
[Clear, professional explanation with inline citations like "according to Wikipedia (link)…" where appropriate.]

## 🔑 Key Points
1. [Point 1]
2. [Point 2]
3. [Point 3]

## 📖 Detailed Notes
[Step-by-step explanation with an analogy.]

## 📚 External Sources
- [Title](URL) — short note on what this source supports
- [Title](URL) — short note
(If none verified, write: "_No verified external source — answer based on widely accepted general knowledge._")

## 🎯 Confidence
**[High / Medium / Low]** — [Brief reason]

## 💬 Your turn
[ONE short Socratic follow-up question to keep the conversation going.]

RULES:
- "spoken" must be plain natural prose with NO markdown, NO emojis, NO headings, NO bullet symbols. It WILL be read aloud.
- "snippets": 1–3 short illustrative lines (≤ 200 chars), or [] if none.
- "sources" must contain ONLY real external references with real URLs, NEVER the uploaded study material.
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
