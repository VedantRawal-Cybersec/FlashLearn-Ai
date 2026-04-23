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
            content: `You are an expert exam coach. Analyze the study material and predict important exam topics and likely questions.

Return your response in this EXACT JSON format:
{
  "highPriorityTopics": [
    { "topic": "Topic name", "reason": "Why this is high priority", "priority": "high" }
  ],
  "frequentlyAskedTypes": [
    { "type": "Question type (e.g., MCQ, Short Answer, Essay)", "examples": ["Example question 1", "Example question 2"] }
  ],
  "predictedQuestions": [
    { "question": "The predicted exam question", "difficulty": "easy|medium|hard", "type": "MCQ|Short Answer|Long Answer|True/False", "hint": "Brief hint for answering" }
  ]
}

Rules:
- Identify 4-6 high priority topics
- Include 3-4 question types with 2 examples each
- Predict 6-10 likely exam questions with varying difficulty
- Base predictions ONLY on the provided content
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

    return new Response(JSON.stringify({ predictions: JSON.parse(cleaned) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Exam predictor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
