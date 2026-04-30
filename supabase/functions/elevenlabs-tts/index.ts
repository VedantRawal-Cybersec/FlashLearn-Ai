import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Default to Sarah — warm, professional female voice
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, voiceId } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY not configured");

    // Cap to keep latency low
    const rawText = text.slice(0, 2500);

    // Add subtle prosody hints so the voice sounds more human:
    // - small pauses after sentence-ending punctuation
    // - micro-pauses after commas / semicolons
    // - keep ellipses (ElevenLabs treats "..." as a natural pause)
    const humanized = rawText
      .replace(/\s+/g, " ")
      .replace(/([.!?])\s+/g, "$1  ")      // longer beat between sentences
      .replace(/([,;:])\s+/g, "$1 ")        // light beat after commas
      .replace(/\s+—\s+/g, " — ")           // em-dash breath
      .trim();

    const voice = (typeof voiceId === "string" && voiceId.trim()) || DEFAULT_VOICE_ID;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: humanized,
          // Multilingual v2 = highest quality, most natural prosody.
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            // Lower stability = more expressive, varied intonation (less robotic)
            stability: 0.35,
            // High similarity keeps the voice's natural timbre intact
            similarity_boost: 0.85,
            // A touch of style for warmth and emotional inflection
            style: 0.55,
            use_speaker_boost: true,
            // Slightly slower than default for a calm, professorial cadence
            speed: 0.96,
          },
        }),
      }
    );

    if (!response.ok || !response.body) {
      const err = await response.text().catch(() => "");
      console.error("ElevenLabs TTS error:", response.status, err);
      return new Response(
        JSON.stringify({ error: "TTS failed", status: response.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("TTS error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
