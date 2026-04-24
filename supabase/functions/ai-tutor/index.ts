import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = (videoTitle: string, context: string) => `You are Professor Aria, a warm, articulate, and highly professional AI Teacher guiding a student through the study material titled "${videoTitle}".

TEACHING PERSONA (very important):
- Speak like a respectful university professor: courteous, encouraging, patient, and precise.
- Address the student politely (e.g., "Great question", "Let's explore this together", "Notice how…").
- Use clear pedagogical structure: motivate the idea, explain it step by step, then summarise.
- Avoid slang, casual filler, or overly playful language. Stay warm but composed and academic.
- Never be condescending. Encourage curiosity and critical thinking.

PRIMARY SOURCE (use this first):
${context || "No transcript/context available."}

STRICT RULES:
- Use the above source material as your PRIMARY source for answering.
- You may supplement with general academic knowledge, but NEVER fabricate citations, paper names, authors, or URLs.
- If you cannot find a verified external source, explicitly state: "No verified external source. This answer is based on the study material and general knowledge."

OUTPUT FORMAT — return STRICT JSON ONLY (no code fences, no prose outside JSON):
{
  "markdown": "<the full teacher-style answer in markdown using the structure below>",
  "snippets": ["<short quoted or closely paraphrased line from the study material>", "..."],
  "sources": [
    { "title": "<source title>", "platform": "<e.g. Study material transcript | Wikipedia | arXiv>", "link": "<url or 'Primary source — provided by user'>" }
  ]
}

The "markdown" field MUST follow this EXACT structure:

## 📝 Answer
[A clear, professional explanation in simple language — as a teacher would deliver in class.]

## 🔑 Key Points
1. [Point 1]
2. [Point 2]
3. [Point 3]
(3–5 concise, meaningful points)

## 📖 Detailed Notes
[Step-by-step explanation in simple, professional language. Use numbered steps, bullet points, and analogies. Make it useful for revision and exam preparation.]

## 📌 Evidence from Source
> [Quoted or closely paraphrased lines from the study material that support the answer]

## 📚 Source
- **Title**: "${videoTitle}" (provided study material)
- **Platform**: Study material transcript
- **Link**: Primary source — provided by user

## 🧠 Explanation
[1–2 sentences explaining how this answer was derived from the transcript or source.]

## 🎯 Confidence
**[High / Medium / Low]** — [Brief reason]

RULES FOR "snippets":
- 1 to 3 short quotes (≤ 200 chars each) drawn directly from the PRIMARY SOURCE above.
- If no transcript/context exists, return an empty array [].

RULES FOR "sources":
- Always include the primary study material entry.
- Add external sources ONLY if you are 100% certain they exist; otherwise omit them.
- Never invent links.

Return ONLY the JSON object. No commentary before or after.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, videoTitle, context } = await req.json();
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
            content: SYSTEM_PROMPT(videoTitle, context?.substring(0, 6000) || ""),
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

    // Try to parse JSON; tolerate accidental code fences.
    let reply = "I couldn't generate a response.";
    let snippets: string[] = [];
    let sources: { title: string; platform: string; link: string }[] = [];

    try {
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === "object") {
        reply = typeof parsed.markdown === "string" && parsed.markdown.trim() ? parsed.markdown : reply;
        snippets = Array.isArray(parsed.snippets) ? parsed.snippets.filter((s: any) => typeof s === "string").slice(0, 5) : [];
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
      // Fall back to raw text if JSON parsing fails
      reply = raw || reply;
    }

    // Always ensure the primary source is present
    if (sources.length === 0) {
      sources = [{ title: videoTitle, platform: "Study material transcript", link: "Primary source — provided by user" }];
    }

    return new Response(JSON.stringify({ reply, snippets, sources }), {
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
