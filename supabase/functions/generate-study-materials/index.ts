import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

// Fallback 1: Scrape YouTube page for captions
async function tryYouTubeScrape(videoId: string): Promise<{ title: string; transcript: string } | null> {
  try {
    const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    const html = await resp.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(" - YouTube", "").trim() : "";

    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) return title ? { title, transcript: "" } : null;

    const tracks = JSON.parse(captionMatch[1]);
    const enTrack = tracks.find((t: any) => t.languageCode === "en") || tracks[0];
    if (!enTrack?.baseUrl) return title ? { title, transcript: "" } : null;

    const captionResp = await fetch(enTrack.baseUrl);
    const xml = await captionResp.text();
    const parts = xml.match(/<text[^>]*>(.*?)<\/text>/gs);
    if (!parts?.length) return title ? { title, transcript: "" } : null;

    const transcript = parts.map((t: string) => decodeHtmlEntities(t.replace(/<[^>]+>/g, ""))).join(" ");
    return { title, transcript };
  } catch (e) {
    console.error("Fallback 1 (YouTube scrape) failed:", e);
    return null;
  }
}

// Fallback 2: Piped API (privacy-friendly YouTube frontend)
async function tryPipedAPI(videoId: string): Promise<{ title: string; transcript: string } | null> {
  const instances = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://pipedapi.in.projectsegfau.lt",
  ];
  for (const base of instances) {
    try {
      const resp = await fetch(`${base}/streams/${videoId}`, { signal: AbortSignal.timeout(8000) });
      if (!resp.ok) { await resp.text(); continue; }
      const data = await resp.json();
      const title = data.title || "";

      // Try to get subtitles
      if (data.subtitles?.length) {
        const enSub = data.subtitles.find((s: any) => s.code === "en") || data.subtitles[0];
        if (enSub?.url) {
          const subResp = await fetch(enSub.url, { signal: AbortSignal.timeout(5000) });
          const subText = await subResp.text();
          // Parse VTT or XML
          if (subText.includes("WEBVTT")) {
            const transcript = subText.replace(/WEBVTT.*?\n\n/s, "")
              .replace(/\d{2}:\d{2}[\d:.]+\s*-->\s*\d{2}:\d{2}[\d:.]+\n?/g, "")
              .replace(/<[^>]+>/g, "").replace(/\n+/g, " ").trim();
            if (transcript.length > 50) return { title, transcript };
          } else {
            const parts = subText.match(/<text[^>]*>(.*?)<\/text>/gs);
            if (parts?.length) {
              const transcript = parts.map((t: string) => decodeHtmlEntities(t.replace(/<[^>]+>/g, ""))).join(" ");
              if (transcript.length > 50) return { title, transcript };
            }
          }
        }
      }

      // Use description as fallback content
      if (data.description && title) {
        return { title, transcript: data.description };
      }
    } catch (e) {
      console.error(`Piped instance ${base} failed:`, e);
    }
  }
  return null;
}

// Fallback 3: LemnosLife API
async function tryLemnosLife(videoId: string): Promise<{ title: string; transcript: string } | null> {
  try {
    const resp = await fetch(`https://yt.lemnoslife.com/noKey/captions?part=snippet&videoId=${videoId}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) { await resp.text(); return null; }
    const data = await resp.json();
    const items = data?.items;
    if (!items?.length) return null;

    const enItem = items.find((i: any) => i.snippet?.language === "en") || items[0];
    if (!enItem?.snippet?.baseUrl) return null;

    const captionResp = await fetch(enItem.snippet.baseUrl, { signal: AbortSignal.timeout(5000) });
    const xml = await captionResp.text();
    const parts = xml.match(/<text[^>]*>(.*?)<\/text>/gs);
    if (!parts?.length) return null;

    const transcript = parts.map((t: string) => decodeHtmlEntities(t.replace(/<[^>]+>/g, ""))).join(" ");
    return { title: "", transcript };
  } catch (e) {
    console.error("Fallback 3 (LemnosLife) failed:", e);
    return null;
  }
}

// Fallback 4: Invidious API
async function tryInvidious(videoId: string): Promise<{ title: string; transcript: string } | null> {
  const instances = [
    "https://inv.nadeko.net",
    "https://invidious.fdn.fr",
    "https://vid.puffyan.us",
  ];
  for (const base of instances) {
    try {
      const resp = await fetch(`${base}/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(8000) });
      if (!resp.ok) { await resp.text(); continue; }
      const data = await resp.json();
      const title = data.title || "";
      const description = data.description || "";

      // Try captions
      if (data.captions?.length) {
        const enCap = data.captions.find((c: any) => c.language_code === "en") || data.captions[0];
        if (enCap?.url) {
          const capUrl = enCap.url.startsWith("http") ? enCap.url : `${base}${enCap.url}`;
          const capResp = await fetch(capUrl, { signal: AbortSignal.timeout(5000) });
          const capText = await capResp.text();
          const parts = capText.match(/<text[^>]*>(.*?)<\/text>/gs);
          if (parts?.length) {
            const transcript = parts.map((t: string) => decodeHtmlEntities(t.replace(/<[^>]+>/g, ""))).join(" ");
            if (transcript.length > 50) return { title, transcript };
          }
        }
      }

      if (description.length > 100) return { title, transcript: description };
    } catch (e) {
      console.error(`Invidious instance ${base} failed:`, e);
    }
  }
  return null;
}

// Fallback 5: YouTube oEmbed (title only) + noembed
async function tryOEmbed(videoId: string): Promise<{ title: string; transcript: string } | null> {
  try {
    const resp = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) { await resp.text(); return null; }
    const data = await resp.json();
    if (data.title) return { title: data.title, transcript: "" };
  } catch (e) {
    console.error("Fallback 5 (oEmbed) failed:", e);
  }
  return null;
}

async function getTranscript(videoId: string): Promise<{ title: string; transcript: string }> {
  console.log(`Getting transcript for video: ${videoId}`);

  // Try each fallback in order
  const result1 = await tryYouTubeScrape(videoId);
  if (result1?.transcript && result1.transcript.length > 50) {
    console.log("Got transcript via YouTube scrape");
    return result1;
  }
  const scrapedTitle = result1?.title || "";

  const result2 = await tryPipedAPI(videoId);
  if (result2?.transcript && result2.transcript.length > 50) {
    console.log("Got transcript via Piped API");
    return { title: result2.title || scrapedTitle, transcript: result2.transcript };
  }

  const result3 = await tryLemnosLife(videoId);
  if (result3?.transcript && result3.transcript.length > 50) {
    console.log("Got transcript via LemnosLife");
    return { title: scrapedTitle || result3.title, transcript: result3.transcript };
  }

  const result4 = await tryInvidious(videoId);
  if (result4?.transcript && result4.transcript.length > 50) {
    console.log("Got transcript via Invidious");
    return { title: result4.title || scrapedTitle, transcript: result4.transcript };
  }

  // Fallback: use title from any source + ask AI to work with what we have
  const result5 = await tryOEmbed(videoId);
  const finalTitle = scrapedTitle || result2?.title || result4?.title || result5?.title || `YouTube Video ${videoId}`;

  // Combine any partial content we got
  const partialContent = [result2?.transcript, result4?.transcript].filter(Boolean).join(" ");

  console.log("Using fallback: title + partial content for AI generation");
  return {
    title: finalTitle,
    transcript: partialContent || `This is a video titled "${finalTitle}". Generate educational study materials based on what this topic likely covers.`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { videoUrl } = await req.json();
    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "Missing videoUrl" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, transcript } = await getTranscript(videoId);

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
                      properties: { front: { type: "string" }, back: { type: "string" } },
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
                      properties: { title: { type: "string" }, description: { type: "string" } },
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        id: `fc-${i}`, front: c.front, back: c.back, difficulty: null,
      })),
      quizQuestions: materials.quizQuestions.map((q: any, i: number) => ({
        id: `qq-${i}`, question: q.question, options: q.options, correctIndex: q.correctIndex,
      })),
      roadmap: materials.roadmap.map((r: any, i: number) => ({
        id: `rm-${i}`, title: r.title, description: r.description, completed: false,
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
