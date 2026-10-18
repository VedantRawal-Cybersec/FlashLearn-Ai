import { PixelCoin, PixelStar } from "@/components/PixelArt";

/**
 * One-shot coin/star burst for XP gains. Render conditionally:
 *   {burst && <CoinBurst key={burstId} />}
 * Pure CSS animation (transform/opacity), removes itself via onDone.
 */
const PIECES = [
  { x: "-46px", y: "-52px", d: "0ms", s: 18, star: false },
  { x: "40px", y: "-60px", d: "60ms", s: 16, star: false },
  { x: "-8px", y: "-74px", d: "110ms", s: 20, star: false },
  { x: "58px", y: "-28px", d: "40ms", s: 14, star: true },
  { x: "-58px", y: "-22px", d: "90ms", s: 14, star: true },
  { x: "16px", y: "-44px", d: "140ms", s: 12, star: true },
];

export default function CoinBurst({ onDone, className }: { onDone?: () => void; className?: string }) {
  return (
    <div
      className={`coin-burst ${className ?? ""}`}
      aria-hidden
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget.querySelector("span:last-child")) onDone?.();
      }}
    >
      {PIECES.map((p, i) => (
        <span
          key={i}
          style={{ "--bx": p.x, "--by": p.y, "--bd": p.d } as React.CSSProperties}
        >
          {p.star ? (
            <PixelStar size={p.s} className="text-pixel-gold" />
          ) : (
            <PixelCoin size={p.s} />
          )}
        </span>
      ))}
    </div>
  );
}
