import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, context } = await req.json();
    if (!title || !context) {
      return new Response(JSON.stringify({ error: "Title and context are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
            content: `You are an expert study notes generator. Create detailed, well-structured, student-friendly notes from the provided content. The notes should be perfect for exam preparation and quick revision.

STRICT RULES:
- Base notes ONLY on the provided content
- Use very simple language, like explaining to a beginner
- Make notes structured and easy to scan
- Cover ALL important concepts from the content`,
          },
          {
            role: "user",
            content: `Generate comprehensive study notes from this content.

Title: "${title}"
Content: "${context.substring(0, 10000)}"

Return the notes in this EXACT markdown format:

# 📘 [Topic Title]

## 🔍 Overview
[Short 2-3 sentence explanation of what this topic is about]

## 📖 Detailed Explanation
[Step-by-step explanation covering all major concepts. Use numbered points and sub-bullets. Break complex ideas into small, digestible parts. Use simple words throughout.]

### [Sub-topic 1]
- Point 1
- Point 2

### [Sub-topic 2]
- Point 1
- Point 2

(Continue for all major sub-topics covered in the content)

## 🔑 Key Points
1. [Important point 1]
2. [Important point 2]
3. [Important point 3]
4. [Important point 4]
5. [Important point 5]
6. [Important point 6]
(4-6 key points)

## 💡 Examples
[Provide 1-2 simple real-life or conceptual examples that help understand the topic. If the content doesn't lend itself to examples, explain a key concept with an analogy.]

## 📝 Summary
[A short, revision-friendly paragraph that captures the essence of the entire topic. Should be useful for last-minute revision before an exam.]

---
Make the notes thorough, covering every important concept from the content. Write as if creating study material for a student preparing for an exam.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const notes = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ notes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Notes error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
