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
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert knowledge mapper. Analyze the study material and create a concept map showing relationships between topics.

Return your response in this EXACT JSON format:
{
  "mainTopic": "Main topic title",
  "nodes": [
    { "id": "1", "label": "Concept name", "level": 0, "type": "main" },
    { "id": "2", "label": "Sub-concept", "level": 1, "type": "subtopic" },
    { "id": "3", "label": "Detail", "level": 2, "type": "concept" }
  ],
  "edges": [
    { "from": "1", "to": "2", "label": "relationship description" }
  ]
}

Rules:
- Create 10-20 nodes covering all major concepts
- Use levels: 0 = main topic, 1 = subtopics, 2 = concepts, 3 = details
- Types: "main", "subtopic", "concept", "detail"
- Show meaningful relationships in edges
- Base ONLY on provided content
- Return ONLY valid JSON, no markdown fences`,
          },
          {
            role: "user",
            content: `Title: "${title}"\nContent: "${context.substring(0, 10000)}"`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI error");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    return new Response(JSON.stringify({ conceptMap: JSON.parse(cleaned) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Concept map error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
