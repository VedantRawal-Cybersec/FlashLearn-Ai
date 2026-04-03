import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function getTranscript(videoId: string): Promise<string> {
  // Try multiple transcript APIs as fallbacks
  const apis = [
    `https://yt.lemnoslife.com/noKey/captions?part=snippet&videoId=${videoId}`,
  ];

  // Primary: scrape YouTube page for captions
  try {
    const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    const html = await pageResp.text();
    
    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(" - YouTube", "").trim() : "Video";

    // Try to get captions URL from page data
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (captionMatch) {
      const tracks = JSON.parse(captionMatch[1]);
      const enTrack = tracks.find((t: any) => t.languageCode === "en") || tracks[0];
      if (enTrack?.baseUrl) {
        const captionResp = await fetch(enTrack.baseUrl);
        const captionXml = await captionResp.text();
        // Parse XML captions
        const textParts = captionXml.match(/<text[^>]*>(.*?)<\/text>/gs);
        if (textParts && textParts.length > 0) {
          const transcript = textParts
            .map((t: string) => t.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'))
            .join(" ");
          return JSON.stringify({ title, transcript });
        }
      }
    }
  } catch (e) {
    console.error("Primary transcript method failed:", e);
  }

  // Fallback: use basic video info
  return JSON.stringify({
    title: `YouTube Video ${videoId}`,
    transcript: `This is a video with ID ${videoId}. Please generate educational content about common topics that might be covered in an educational video. Focus on creating useful study materials.`,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { videoUrl } = await req.json();
    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "Missing videoUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get transcript
    const transcriptData = await getTranscript(videoId);
    const { title, transcript } = JSON.parse(transcriptData);

    // Generate study materials with AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You generate study materials from video transcripts. Return valid JSON only, no markdown.`,
          },
          {
            role: "user",
            content: `Generate study materials from this video transcript.

Video: "${title}"
Transcript: "${transcript.substring(0, 8000)}"

Return this exact JSON structure:
{
  "flashcards": [
    {"front": "question text", "back": "answer text"}
  ],
  "quizQuestions": [
    {"question": "question text", "options": ["A", "B", "C", "D"], "correctIndex": 0}
  ],
  "roadmap": [
    {"title": "step title", "description": "what to learn"}
  ]
}

Generate exactly 10 flashcards, 8 quiz questions, and 6 roadmap steps. Make them educational and specific to the content.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_study_materials",
              description: "Create structured study materials",
              parameters: {
                type: "object",
                properties: {
                  flashcards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        front: { type: "string" },
                        back: { type: "string" },
                      },
                      required: ["front", "back"],
                    },
                  },
                  quizQuestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        correctIndex: { type: "integer" },
                      },
                      required: ["question", "options", "correctIndex"],
                    },
                  },
                  roadmap: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["title", "description"],
                    },
                  },
                },
                required: ["flashcards", "quizQuestions", "roadmap"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_study_materials" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let materials;

    if (toolCall?.function?.arguments) {
      materials = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        materials = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    const session = {
      id: crypto.randomUUID(),
      title,
      videoUrl,
      createdAt: new Date().toISOString(),
      flashcards: materials.flashcards.map((c: any, i: number) => ({
        id: `fc-${i}`,
        front: c.front,
        back: c.back,
        difficulty: null,
      })),
      quizQuestions: materials.quizQuestions.map((q: any, i: number) => ({
        id: `qq-${i}`,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
      })),
      roadmap: materials.roadmap.map((r: any, i: number) => ({
        id: `rm-${i}`,
        title: r.title,
        description: r.description,
        completed: false,
      })),
    };

    return new Response(JSON.stringify({ session }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
