import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = (videoTitle: string, context: string) => `You are an expert AI Tutor for the study material titled "${videoTitle}".

PRIMARY SOURCE (use this first):
${context || "No transcript/context available."}

STRICT RULES:
- Use the above source material as your PRIMARY source for answering.
- You may supplement with general knowledge, but NEVER fabricate citations, paper names, authors, or URLs.
- If you cannot find a verified external source, explicitly state: "No verified source found. This answer is based on general knowledge."

RESPONSE FORMAT (use this EXACT structure with markdown headings for EVERY answer):

## 📝 Answer
[Clear, concise answer in simple language. Explain like teaching a beginner.]

## 🔑 Key Points
1. [Point 1]
2. [Point 2]
3. [Point 3]
(3–5 points, short and meaningful)

## 📖 Detailed Notes
[Step-by-step explanation in very simple language. Break complex ideas into small parts. Use numbered steps, bullet points, and analogies. Make it useful for revision and exam prep.]

## 📌 Evidence from Source
> [Quoted or closely paraphrased lines from the study material that support the answer]

## 📚 Source
- **Title**: "${videoTitle}" (provided study material)
- **Platform**: Study material transcript
- **Link**: Primary source — provided by user

If you reference any external source, you MUST:
- Provide the exact title
- Name the platform (e.g., Wikipedia, arXiv, Khan Academy)
- Include a direct link to the source page
- Only include sources you are 100% certain are real

If no verified external source exists, write:
"No verified external source. This answer is based on the study material and general knowledge."

## 🧠 Explanation
[1–2 sentences explaining how this answer was derived from the transcript or source]

## 🎯 Confidence
**[High / Medium / Low]** — [Brief reason, e.g., "High — directly covered in the study material"]

---
Keep language simple, beginner-friendly, and structured for easy reading and exam revision.`;

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
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT(videoTitle, context?.substring(0, 6000) || ""),
          },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
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
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
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
