/**
 * Lightweight pixel-art sprites drawn with SVG rects (no images, no deps).
 * Every sprite scales via the `size` prop and stays crisp (shape-rendering: crispEdges).
 */
type SpriteProps = { size?: number; className?: string; style?: React.CSSProperties };

const base = (size: number, vb: number, className?: string, style?: React.CSSProperties) => ({
  width: size,
  height: size,
  viewBox: `0 0 ${vb} ${vb}`,
  className,
  style,
  shapeRendering: "crispEdges" as const,
  xmlns: "http://www.w3.org/2000/svg",
});

/* pixel helper */
const P = ({ x, y, w = 1, h = 1, c }: { x: number; y: number; w?: number; h?: number; c: string }) => (
  <rect x={x} y={y} width={w} height={h} fill={c} />
);

export const PixelStar = ({ size = 12, className, style }: SpriteProps) => (
  <svg {...base(size, 7, className, style)}>
    <P x={3} y={0} h={7} c="currentColor" />
    <P x={0} y={3} w={7} c="currentColor" />
    <P x={2} y={2} w={3} h={3} c="currentColor" />
  </svg>
);

export const PixelCoin = ({ size = 20, className, style }: SpriteProps) => (
  <svg {...base(size, 10, className, style)}>
    <P x={3} y={0} w={4} c="#8a5a12" />
    <P x={2} y={1} w={6} h={8} c="#f5b722" />
    <P x={1} y={2} w={8} h={6} c="#f5b722" />
    <P x={0} y={3} w={1} h={4} c="#8a5a12" />
    <P x={9} y={3} w={1} h={4} c="#8a5a12" />
    <P x={3} y={9} w={4} c="#8a5a12" />
    <P x={4} y={2} w={2} h={6} c="#ffe08a" />
    <P x={2} y={2} w={1} h={2} c="#ffe9b0" />
  </svg>
);

export const PixelHeart = ({ size = 18, className, style }: SpriteProps) => (
  <svg {...base(size, 8, className, style)}>
    <P x={1} y={1} w={2} c="#e8547c" />
    <P x={5} y={1} w={2} c="#e8547c" />
    <P x={0} y={2} w={8} h={2} c="#e8547c" />
    <P x={1} y={4} w={6} c="#e8547c" />
    <P x={2} y={5} w={4} c="#e8547c" />
    <P x={3} y={6} w={2} c="#e8547c" />
    <P x={1} y={2} w={1} h={1} c="#ff9ab5" />
  </svg>
);

export const PixelBolt = ({ size = 22, className, style }: SpriteProps) => (
  <svg {...base(size, 8, className, style)}>
    <P x={4} y={0} w={3} h={1} c="#f5b722" />
    <P x={3} y={1} w={3} h={1} c="#f5b722" />
    <P x={2} y={2} w={3} h={1} c="#f5b722" />
    <P x={1} y={3} w={6} h={1} c="#f5b722" />
    <P x={3} y={4} w={4} h={1} c="#f5b722" />
    <P x={2} y={5} w={3} h={1} c="#f5b722" />
    <P x={1} y={6} w={3} h={1} c="#f5b722" />
    <P x={1} y={7} w={2} h={1} c="#f5b722" />
  </svg>
);

export const PixelCloud = ({ size = 60, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)} height={size * 0.5} viewBox="0 0 16 8">
    <P x={4} y={1} w={6} h={1} c="#ffffff" />
    <P x={2} y={2} w={11} h={2} c="#ffffff" />
    <P x={0} y={4} w={16} h={2} c="#ffffff" />
    <P x={1} y={6} w={14} h={1} c="#cfe4f7" />
  </svg>
);

export const PixelPlanet = ({ size = 56, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={5} y={2} w={6} c="#7a5ad1" />
    <P x={3} y={3} w={10} h={2} c="#7a5ad1" />
    <P x={2} y={5} w={12} h={6} c="#8c6ce0" />
    <P x={3} y={11} w={10} h={2} c="#6a4bb8" />
    <P x={5} y={13} w={6} c="#6a4bb8" />
    <P x={0} y={7} w={16} h={1} c="#e8547c" />
    <P x={1} y={8} w={14} h={1} c="#f08aa5" />
    <P x={4} y={4} w={2} h={1} c="#c0a8f5" />
  </svg>
);

export const PixelChest = ({ size = 64, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={2} y={3} w={12} h={4} c="#a8672c" />
    <P x={2} y={2} w={12} h={1} c="#6b3a17" />
    <P x={2} y={7} w={12} h={1} c="#6b3a17" />
    <P x={2} y={8} w={12} h={6} c="#c07c38" />
    <P x={2} y={14} w={12} h={1} c="#6b3a17" />
    <P x={1} y={2} w={1} h={13} c="#6b3a17" />
    <P x={14} y={2} w={1} h={13} c="#6b3a17" />
    <P x={7} y={6} w={2} h={4} c="#f5b722" />
    <P x={7} y={7} w={2} h={1} c="#6b3a17" />
    <P x={3} y={4} w={1} h={2} c="#e0a468" />
  </svg>
);

export const PixelSlime = ({ size = 44, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={6} y={5} w={4} c="#57a944" />
    <P x={4} y={6} w={8} h={2} c="#57a944" />
    <P x={3} y={8} w={10} h={4} c="#68c052" />
    <P x={2} y={12} w={12} h={2} c="#3f7f32" />
    <P x={5} y={8} w={1} h={2} c="#12102a" />
    <P x={10} y={8} w={1} h={2} c="#12102a" />
    <P x={6} y={11} w={4} h={1} c="#2c5a24" />
  </svg>
);

export const PixelWizard = ({ size = 96, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    {/* hat */}
    <P x={7} y={0} w={2} c="#7a4bc4" />
    <P x={6} y={1} w={4} c="#7a4bc4" />
    <P x={5} y={2} w={6} c="#7a4bc4" />
    <P x={4} y={3} w={8} c="#6739ad" />
    <P x={3} y={4} w={10} c="#8c5ada" />
    <P x={7} y={2} w={2} h={1} c="#f5b722" />
    {/* face */}
    <P x={5} y={5} w={6} h={3} c="#f0c9a0" />
    <P x={6} y={6} w={1} c="#12102a" />
    <P x={9} y={6} w={1} c="#12102a" />
    {/* beard */}
    <P x={5} y={8} w={6} h={2} c="#e8e4dd" />
    {/* robe */}
    <P x={4} y={10} w={8} h={5} c="#7a4bc4" />
    <P x={4} y={13} w={8} h={2} c="#6739ad" />
    {/* staff */}
    <P x={13} y={3} w={1} h={12} c="#8b5a2b" />
    <P x={12} y={2} w={3} h={1} c="#f5b722" />
    <P x={13} y={1} w={1} h={1} c="#ffe08a" />
  </svg>
);

export const PixelRobot = ({ size = 80, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={7} y={0} w={2} h={2} c="#9fb3d9" />
    <P x={4} y={2} w={8} h={6} c="#e8ecf5" />
    <P x={5} y={4} w={6} h={2} c="#12102a" />
    <P x={6} y={4} w={1} h={1} c="#4a7fe0" />
    <P x={9} y={4} w={1} h={1} c="#4a7fe0" />
    <P x={5} y={8} w={6} h={5} c="#c9d4e8" />
    <P x={7} y={9} w={2} h={2} c="#e8547c" />
    <P x={3} y={8} w={2} h={4} c="#9fb3d9" />
    <P x={11} y={8} w={2} h={4} c="#9fb3d9" />
    <P x={5} y={13} w={2} h={2} c="#9fb3d9" />
    <P x={9} y={13} w={2} h={2} c="#9fb3d9" />
  </svg>
);

export const PixelBook = ({ size = 72, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={2} y={2} w={12} h={12} c="#3a63c9" />
    <P x={2} y={2} w={12} h={1} c="#26429b" />
    <P x={2} y={13} w={12} h={1} c="#26429b" />
    <P x={2} y={2} w={2} h={12} c="#26429b" />
    <P x={6} y={5} w={4} h={1} c="#f5b722" />
    <P x={5} y={6} w={6} h={3} c="#f5b722" />
    <P x={6} y={9} w={4} h={1} c="#f5b722" />
    <P x={7} y={4} w={2} h={1} c="#ffe08a" />
  </svg>
);

export const PixelScroll = ({ size = 72, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={3} y={2} w={10} h={12} c="#efe2c0" />
    <P x={3} y={2} w={10} h={1} c="#c9b58c" />
    <P x={3} y={13} w={10} h={1} c="#c9b58c" />
    <P x={2} y={2} w={1} h={12} c="#c9b58c" />
    <P x={13} y={2} w={1} h={12} c="#c9b58c" />
    <P x={5} y={5} w={6} h={1} c="#8b7355" />
    <P x={5} y={7} w={6} h={1} c="#8b7355" />
    <P x={5} y={9} w={4} h={1} c="#8b7355" />
  </svg>
);

export const PixelTrophy = ({ size = 72, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={4} y={2} w={8} h={5} c="#f5b722" />
    <P x={5} y={7} w={6} h={2} c="#e0a41a" />
    <P x={7} y={9} w={2} h={3} c="#c98f13" />
    <P x={4} y={12} w={8} h={2} c="#8a5a12" />
    <P x={2} y={3} w={2} h={2} c="#e0a41a" />
    <P x={12} y={3} w={2} h={2} c="#e0a41a" />
    <P x={6} y={3} w={1} h={2} c="#ffe08a" />
  </svg>
);

export const PixelController = ({ size = 80, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)} height={size * 0.625} viewBox="0 0 16 10">
    <P x={1} y={2} w={14} h={6} c="#e8ecf5" />
    <P x={0} y={3} w={1} h={4} c="#b8c3d9" />
    <P x={15} y={3} w={1} h={4} c="#b8c3d9" />
    <P x={3} y={4} w={3} h={1} c="#12102a" />
    <P x={4} y={3} w={1} h={3} c="#12102a" />
    <P x={11} y={4} w={1} h={1} c="#e8547c" />
    <P x={13} y={4} w={1} h={1} c="#4a7fe0" />
    <P x={12} y={6} w={1} h={1} c="#57a944" />
  </svg>
);

export const PixelBadge = ({ size = 64, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={5} y={1} w={2} h={4} c="#4a7fe0" />
    <P x={9} y={1} w={2} h={4} c="#e8547c" />
    <P x={5} y={5} w={6} c="#8a5a12" />
    <P x={4} y={6} w={8} h={7} c="#f5b722" />
    <P x={3} y={7} w={10} h={5} c="#f5b722" />
    <P x={5} y={7} w={6} h={5} c="#ffe08a" />
    <P x={7} y={8} w={2} h={3} c="#8a5a12" />
    <P x={6} y={9} w={4} h={1} c="#8a5a12" />
  </svg>
);

/** Repeating pixel terrain strip (grass + dirt), used as a section edge. */
export const PixelTerrain = ({ className }: { className?: string }) => (
  <div className={className} aria-hidden>
    <svg width="100%" height="40" shapeRendering="crispEdges">
      <defs>
        <pattern id="quest-ground" width="128" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 12H12V4H24V0H36V8H48V12H72V8H88V4H104V12H128V20H0Z" fill="hsl(var(--grass))" />
          <path d="M0 20H128V28H112V36H96V28H72V40H48V32H24V28H8V36H0Z" fill="hsl(var(--dirt))" />
          <path d="M8 20H24V24H8ZM48 24H64V28H48ZM96 20H112V24H96Z" fill="hsl(var(--pixel-orange) / .3)" />
          <path d="M24 8H32V12H24ZM80 8H88V12H80Z" fill="hsl(var(--pixel-green))" />
        </pattern>
      </defs>
      <rect width="100%" height="40" fill="url(#quest-ground)" />
    </svg>
  </div>
);

/** Decorative pixel "pipe" path that draws itself while scrolling into view. */
export const PixelPipe = ({
  d,
  color = "#e8547c",
  className,
}: { d: string; color?: string; className?: string }) => (
  <svg className={className} viewBox="0 0 400 200" fill="none" preserveAspectRatio="none" aria-hidden>
    <path d={d} stroke={color} strokeWidth="10" strokeLinecap="square" strokeDasharray="14 10" />
  </svg>
);

/* ============================================================
   Extra sprites for the Pixel Quest landing page
   ============================================================ */

export const PixelKnight = ({ size = 72, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={5} y={1} w={6} h={1} c="#2f4f9e" />
    <P x={4} y={2} w={8} h={3} c="#3a63c9" />
    <P x={5} y={3} w={6} h={2} c="#f0c9a0" />
    <P x={6} y={4} w={1} h={1} c="#12102a" />
    <P x={9} y={4} w={1} h={1} c="#12102a" />
    <P x={4} y={5} w={8} h={1} c="#2f4f9e" />
    <P x={4} y={6} w={8} h={5} c="#4a7fe0" />
    <P x={6} y={7} w={4} h={3} c="#cfe0ff" />
    <P x={2} y={6} w={2} h={4} c="#3a63c9" />
    <P x={12} y={6} w={2} h={4} c="#3a63c9" />
    <P x={4} y={11} w={3} h={4} c="#2f4f9e" />
    <P x={9} y={11} w={3} h={4} c="#2f4f9e" />
    <P x={0} y={2} w={1} h={9} c="#c9d4e8" />
    <P x={0} y={11} w={2} h={1} c="#8a5a12" />
    <P x={14} y={5} w={2} h={6} c="#b8c3d9" />
  </svg>
);

export const PixelMonster = ({ size = 72, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={3} y={1} w={2} h={2} c="#c23a63" />
    <P x={11} y={1} w={2} h={2} c="#c23a63" />
    <P x={4} y={3} w={8} h={3} c="#e8547c" />
    <P x={3} y={4} w={10} h={6} c="#e8547c" />
    <P x={5} y={5} w={2} h={2} c="#fff" />
    <P x={9} y={5} w={2} h={2} c="#fff" />
    <P x={6} y={6} w={1} h={1} c="#12102a" />
    <P x={10} y={6} w={1} h={1} c="#12102a" />
    <P x={5} y={8} w={6} h={1} c="#7d1f38" />
    <P x={6} y={9} w={1} h={1} c="#fff" />
    <P x={9} y={9} w={1} h={1} c="#fff" />
    <P x={4} y={10} w={8} h={3} c="#c23a63" />
    <P x={4} y={13} w={3} h={2} c="#7d1f38" />
    <P x={9} y={13} w={3} h={2} c="#7d1f38" />
    <P x={1} y={6} w={2} h={4} c="#c23a63" />
    <P x={13} y={6} w={2} h={4} c="#c23a63" />
  </svg>
);

export const PixelFlashcard = ({ size = 72, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={4} y={1} w={10} h={13} c="#26429b" />
    <P x={3} y={2} w={10} h={13} c="#3a63c9" />
    <P x={4} y={3} w={8} h={11} c="#4a7fe0" />
    <P x={7} y={5} w={2} h={1} c="#f5b722" />
    <P x={6} y={6} w={4} h={2} c="#f5b722" />
    <P x={5} y={7} w={6} h={1} c="#ffe08a" />
    <P x={6} y={8} w={4} h={1} c="#f5b722" />
    <P x={6} y={9} w={1} h={2} c="#f5b722" />
    <P x={9} y={9} w={1} h={2} c="#f5b722" />
  </svg>
);

export const PixelQuill = ({ size = 72, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={2} y={2} w={10} h={12} c="#efe2c0" />
    <P x={2} y={2} w={10} h={1} c="#c9b58c" />
    <P x={2} y={13} w={10} h={1} c="#c9b58c" />
    <P x={1} y={2} w={1} h={12} c="#8b7355" />
    <P x={4} y={5} w={6} h={1} c="#8b7355" />
    <P x={4} y={7} w={6} h={1} c="#8b7355" />
    <P x={4} y={9} w={4} h={1} c="#8b7355" />
    <P x={13} y={1} w={2} h={2} c="#e8ecf5" />
    <P x={12} y={3} w={2} h={2} c="#c9d4e8" />
    <P x={11} y={5} w={2} h={2} c="#e8ecf5" />
    <P x={10} y={7} w={2} h={4} c="#b8c3d9" />
    <P x={10} y={11} w={1} h={2} c="#8a5a12" />
  </svg>
);

export const PixelAstronaut = ({ size = 80, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={4} y={2} w={8} h={6} c="#e8ecf5" />
    <P x={5} y={3} w={6} h={4} c="#1b2440" />
    <P x={6} y={4} w={2} h={1} c="#7fa8ff" />
    <P x={4} y={8} w={8} h={5} c="#e8ecf5" />
    <P x={6} y={9} w={4} h={2} c="#4a7fe0" />
    <P x={2} y={8} w={2} h={4} c="#c9d4e8" />
    <P x={12} y={8} w={2} h={4} c="#c9d4e8" />
    <P x={4} y={13} w={3} h={2} c="#c9d4e8" />
    <P x={9} y={13} w={3} h={2} c="#c9d4e8" />
    <P x={11} y={3} w={2} h={2} c="#f39b35" />
  </svg>
);

export const PixelHeroine = ({ size = 72, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={5} y={1} w={6} h={3} c="#a13a52" />
    <P x={4} y={2} w={1} h={7} c="#a13a52" />
    <P x={11} y={2} w={1} h={7} c="#a13a52" />
    <P x={5} y={4} w={6} h={3} c="#f0c9a0" />
    <P x={6} y={5} w={1} h={1} c="#12102a" />
    <P x={9} y={5} w={1} h={1} c="#12102a" />
    <P x={5} y={7} w={6} h={5} c="#f39b35" />
    <P x={3} y={8} w={2} h={3} c="#f0c9a0" />
    <P x={11} y={8} w={2} h={3} c="#f0c9a0" />
    <P x={5} y={12} w={2} h={3} c="#6b4a2c" />
    <P x={9} y={12} w={2} h={3} c="#6b4a2c" />
  </svg>
);

export const PixelFlower = ({ size = 18, color = "#e8547c", className, style }: SpriteProps & { color?: string }) => (
  <svg {...base(size, 8, className, style)}>
    <P x={3} y={4} w={1} h={4} c="#3f7f32" />
    <P x={1} y={5} w={2} h={1} c="#57a944" />
    <P x={4} y={6} w={2} h={1} c="#57a944" />
    <P x={2} y={1} w={3} h={3} c={color} />
    <P x={1} y={2} w={5} h={1} c={color} />
    <P x={3} y={0} w={1} h={1} c={color} />
    <P x={3} y={2} w={1} h={1} c="#ffe08a" />
  </svg>
);

export const PixelChip = ({ size = 40, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={4} y={4} w={8} h={8} c="#e8547c" />
    <P x={6} y={6} w={4} h={4} c="#ff9ab5" />
    <P x={7} y={1} w={1} h={3} c="#f5b722" />
    <P x={10} y={1} w={1} h={3} c="#f5b722" />
    <P x={7} y={12} w={1} h={3} c="#f5b722" />
    <P x={10} y={12} w={1} h={3} c="#f5b722" />
    <P x={1} y={7} w={3} h={1} c="#f5b722" />
    <P x={1} y={10} w={3} h={1} c="#f5b722" />
    <P x={12} y={7} w={3} h={1} c="#f5b722" />
    <P x={12} y={10} w={3} h={1} c="#f5b722" />
  </svg>
);

export const PixelHeartShield = ({ size = 40, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={3} y={1} w={10} h={9} c="#8c5ada" />
    <P x={4} y={10} w={8} h={2} c="#7a4bc4" />
    <P x={6} y={12} w={4} h={2} c="#6739ad" />
    <P x={5} y={4} w={2} h={1} c="#e8547c" />
    <P x={9} y={4} w={2} h={1} c="#e8547c" />
    <P x={4} y={5} w={8} h={2} c="#e8547c" />
    <P x={5} y={7} w={6} h={1} c="#e8547c" />
    <P x={6} y={8} w={4} h={1} c="#e8547c" />
    <P x={7} y={9} w={2} h={1} c="#e8547c" />
  </svg>
);

export const PixelPhone = ({ size = 40, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={4} y={1} w={8} h={14} c="#c9d4e8" />
    <P x={5} y={3} w={6} h={10} c="#1b2440" />
    <P x={7} y={5} w={2} h={1} c="#f5b722" />
    <P x={6} y={6} w={4} h={2} c="#f5b722" />
    <P x={7} y={8} w={2} h={3} c="#f5b722" />
    <P x={7} y={13} w={2} h={1} c="#8a93a8" />
  </svg>
);

export const PixelLock = ({ size = 40, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={5} y={2} w={6} h={1} c="#c9d4e8" />
    <P x={4} y={3} w={1} h={4} c="#c9d4e8" />
    <P x={11} y={3} w={1} h={4} c="#c9d4e8" />
    <P x={3} y={7} w={10} h={7} c="#f5b722" />
    <P x={3} y={7} w={10} h={1} c="#ffe08a" />
    <P x={7} y={9} w={2} h={2} c="#8a5a12" />
    <P x={7} y={11} w={2} h={2} c="#8a5a12" />
  </svg>
);

export const PixelSword = ({ size = 26, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={11} y={1} w={3} h={1} c="#e8ecf5" />
    <P x={10} y={2} w={4} h={1} c="#e8ecf5" />
    <P x={4} y={3} w={9} h={2} c="#c9d4e8" />
    <P x={3} y={5} w={8} h={2} c="#b8c3d9" />
    <P x={2} y={6} w={4} h={4} c="#f5b722" />
    <P x={1} y={9} w={4} h={2} c="#8a5a12" />
    <P x={0} y={11} w={3} h={2} c="#6b3a17" />
  </svg>
);

/** Small tree used in the blue landscape CTA. */
export const PixelTree = ({ size = 60, className, style }: SpriteProps) => (
  <svg {...base(size, 16, className, style)}>
    <P x={7} y={11} w={2} h={5} c="#6b3a17" />
    <P x={7} y={1} w={2} h={2} c="#2f6b2a" />
    <P x={6} y={3} w={4} h={2} c="#3f7f32" />
    <P x={5} y={5} w={6} h={2} c="#2f6b2a" />
    <P x={4} y={7} w={8} h={2} c="#3f7f32" />
    <P x={3} y={9} w={10} h={2} c="#2f6b2a" />
  </svg>
);

/** XP progress bar in retro chunky style. */
export const XPBar = ({ value = 68, level = 12, className }: { value?: number; level?: number; className?: string }) => (
  <div className={`flex items-center gap-2 border-4 border-[#171717] bg-[#1b2440] p-2 ${className ?? ""}`}>
    <span className="pixel-text text-[0.6rem] text-[#f5b722]">XP</span>
    <div className="flex-1 h-4 border-2 border-[#171717] bg-[#0b1220] overflow-hidden">
      <div className="h-full bg-[#65b94d]" style={{ width: `${value}%`, boxShadow: "inset 0 3px 0 hsl(0 0% 100% / .25)" }} />
    </div>
    <span className="pixel-text text-[0.5rem] text-[#fff5df] whitespace-nowrap">LEVEL {level}</span>
  </div>
);

/** Straight/elbow pixel pipe drawn as dashed segments; animates in on reveal. */
export const PipeRun = ({
  d, color = "#ef4f84", width = 12, className, viewBox = "0 0 400 200",
}: { d: string; color?: string; width?: number; className?: string; viewBox?: string }) => (
  <svg className={`pipe-run ${className ?? ""}`} viewBox={viewBox} fill="none" preserveAspectRatio="none" aria-hidden>
    <path d={d} stroke="#171717" strokeWidth={width + 6} strokeLinecap="square" />
    <path d={d} stroke={color} strokeWidth={width} strokeLinecap="square" />
    <path d={d} stroke="hsl(0 0% 100% / .28)" strokeWidth={Math.max(2, width / 4)} strokeLinecap="square" strokeDasharray="10 14" />
  </svg>
);
