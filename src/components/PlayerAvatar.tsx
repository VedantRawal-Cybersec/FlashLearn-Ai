import { PlayerAvatar as AvatarData } from "@/lib/player";

export default function PlayerAvatar({ avatar, size = 120, className = "" }: { avatar: AvatarData; size?: number; className?: string }) {
  const armor = `hsl(var(--${avatar.color}))`;
  return <svg width={size} height={size} viewBox="0 0 32 36" role="img" aria-label={`${avatar.name}, ${avatar.role}`} className={`pixelated shrink-0 ${className}`} shapeRendering="crispEdges">
    <ellipse cx="16" cy="34" rx="11" ry="2" fill="hsl(var(--ink) / .3)" />
    <g className="avatar-body">
      <path d="M9 19h14v10H9zM6 21h3v8H6zM23 21h3v8h-3z" fill={armor} />
      <path d="M10 28h5v5h-5zM18 28h5v5h-5z" fill="hsl(var(--ink))" />
      <path d="M9 6h14v13H9zM7 9h2v7H7zM23 9h2v7h-2z" fill="hsl(var(--cream-deep))" />
      <path d="M9 5h14v5H9zM7 8h4v4H7zM21 8h4v4h-4z" fill="hsl(var(--ink))" />
      <path d="M12 12h2v3h-2zM19 12h2v3h-2zM14 17h5v1h-5z" fill="hsl(var(--ink))" />
      <path d="M10 20h12v2H10zM15 22h3v5h-3z" fill="hsl(var(--cream))" />
      {avatar.role === "knight" && <><path d="M3 22h5v8H3z" fill="hsl(var(--pixel-gold))" /><path d="M27 14h2v14h-2zM25 25h6v2h-6z" fill="hsl(var(--paper))" /></>}
      {avatar.role === "mage" && <><path d="M8 7h17L17 0z" fill={armor} /><path d="M27 13h2v17h-2z" fill="hsl(var(--pixel-orange))" /><path d="M25 10h6v5h-6z" fill="hsl(var(--pixel-gold))" /></>}
      {avatar.role === "ranger" && <><path d="M9 5h14v3H9zM21 2h3v4h-3z" fill={armor} /><path d="M27 17h2v2h-2zM29 19h2v9h-2zM27 28h2v2h-2z" fill="hsl(var(--pixel-orange))" /></>}
      {avatar.accessory === "crown" && <path d="M10 3h3v2h2V2h3v3h2V3h3v5H10z" fill="hsl(var(--pixel-gold))" />}
      {avatar.accessory === "headband" && <path d="M8 10h16v2H8zM23 11h4v2h-4z" fill="hsl(var(--pixel-pink))" />}
    </g>
  </svg>;
}