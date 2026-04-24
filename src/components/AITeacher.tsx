import { useEffect, useState } from "react";

interface AITeacherProps {
  speaking: boolean;
  thinking?: boolean;
  listening?: boolean;
}

/**
 * 2D animated cartoon teacher avatar.
 * - Idle: subtle blinking + gentle bobbing
 * - Speaking: animated mouth (lip-sync effect via rapid scaleY toggle)
 * - Listening: glowing ear/headset ring
 * - Thinking: bouncing dots above the head
 */
export default function AITeacher({ speaking, thinking, listening }: AITeacherProps) {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blink, setBlink] = useState(false);

  // Lip-sync: toggle mouth shape rapidly while speaking
  useEffect(() => {
    if (!speaking) {
      setMouthOpen(false);
      return;
    }
    const id = setInterval(() => {
      setMouthOpen((m) => !m);
    }, 130 + Math.random() * 80);
    return () => clearInterval(id);
  }, [speaking]);

  // Blink every few seconds
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3500 + Math.random() * 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full">
      <div
        className={`relative ${speaking ? "animate-[bob_0.6s_ease-in-out_infinite]" : "animate-[bob_3s_ease-in-out_infinite]"}`}
        style={{ width: 180, height: 180 }}
      >
        {/* Listening glow ring */}
        {listening && (
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        )}

        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
          {/* Body / shoulders */}
          <path
            d="M30 200 Q30 140 100 140 Q170 140 170 200 Z"
            fill="hsl(var(--primary))"
            opacity="0.9"
          />
          {/* Tie */}
          <path d="M95 140 L100 155 L105 140 L108 175 L92 175 Z" fill="hsl(var(--accent))" />

          {/* Neck */}
          <rect x="90" y="125" width="20" height="20" fill="#f4c9a0" />

          {/* Head */}
          <ellipse cx="100" cy="85" rx="48" ry="52" fill="#f4c9a0" />

          {/* Hair */}
          <path
            d="M52 75 Q55 35 100 32 Q145 35 148 75 Q140 50 100 50 Q60 50 52 75 Z"
            fill="hsl(var(--foreground))"
          />

          {/* Glasses */}
          <circle cx="82" cy="85" r="11" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <circle cx="118" cy="85" r="11" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <line x1="93" y1="85" x2="107" y2="85" stroke="hsl(var(--foreground))" strokeWidth="2" />

          {/* Eyes (blink) */}
          {blink ? (
            <>
              <line x1="76" y1="85" x2="88" y2="85" stroke="hsl(var(--foreground))" strokeWidth="2" />
              <line x1="112" y1="85" x2="124" y2="85" stroke="hsl(var(--foreground))" strokeWidth="2" />
            </>
          ) : (
            <>
              <circle cx="82" cy="85" r="3" fill="hsl(var(--foreground))" />
              <circle cx="118" cy="85" r="3" fill="hsl(var(--foreground))" />
            </>
          )}

          {/* Eyebrows (raise when thinking) */}
          <path
            d={thinking ? "M72 68 Q82 64 92 68" : "M72 70 Q82 67 92 70"}
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={thinking ? "M108 68 Q118 64 128 68" : "M108 70 Q118 67 128 70"}
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Nose */}
          <path d="M100 92 Q97 102 100 106 Q103 102 100 92" fill="#e0a87a" />

          {/* Mouth — animated for lip sync */}
          {mouthOpen ? (
            <ellipse cx="100" cy="115" rx="9" ry="6" fill="#7a2a2a" />
          ) : (
            <path
              d="M90 115 Q100 119 110 115"
              stroke="hsl(var(--foreground))"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Cheeks */}
          <circle cx="72" cy="103" r="4" fill="#f5a5a5" opacity="0.5" />
          <circle cx="128" cy="103" r="4" fill="#f5a5a5" opacity="0.5" />
        </svg>

        {/* Thinking dots */}
        {thinking && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}

        {/* Speaking sound waves */}
        {speaking && (
          <div className="absolute top-1/2 -right-2 -translate-y-1/2 flex gap-0.5">
            <span className="w-0.5 h-3 bg-primary rounded animate-[wave_0.6s_ease-in-out_infinite]" />
            <span className="w-0.5 h-5 bg-primary rounded animate-[wave_0.6s_ease-in-out_infinite_0.1s]" />
            <span className="w-0.5 h-4 bg-primary rounded animate-[wave_0.6s_ease-in-out_infinite_0.2s]" />
          </div>
        )}
      </div>

      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}
