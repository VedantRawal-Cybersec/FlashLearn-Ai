import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Shuffle, Swords, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "@/components/PlayerAvatar";
import { avatarColors, AvatarClass, PlayerAvatar as AvatarData, usePlayer } from "@/lib/player";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const colorClasses = { "pixel-blue": "bg-pixel-blue", "pixel-pink": "bg-pixel-pink", "pixel-green": "bg-pixel-green", "pixel-purple": "bg-pixel-purple", "pixel-gold": "bg-pixel-gold" };
export default function Avatar() {
  const { avatar, saveAvatar, battles, wins } = usePlayer();
  const [draft, setDraft] = useState<AvatarData>(avatar);
  const { toast } = useToast();
  const set = (values: Partial<AvatarData>) => setDraft((a) => ({ ...a, ...values }));
  return <div className="container max-w-5xl px-5 py-10 animate-fade-in">
    <p className="pixel-text text-primary text-[0.6rem] mb-4">PLAYER PROFILE</p>
    <h1 className="mb-8">Your pixel hero</h1>
    <div className="grid md:grid-cols-2 gap-10 items-center">
      <div className="avatar-stage relative flex flex-col items-center justify-center min-h-[340px] overflow-hidden">
        <div className="starfield absolute inset-0 opacity-60" aria-hidden />
        <PlayerAvatar avatar={draft} size={240} className="relative avatar-idle" />
        <p className="pixel-text text-primary text-xs mt-5 relative break-words max-w-full text-center">{draft.name || "Player One"}</p>
        <p className="text-muted-foreground mt-4 relative">{wins} wins · {battles} battles</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); saveAvatar({ ...draft, name: draft.name.trim() || "Player One" }); toast({ title: "Hero saved!" }); }} className="space-y-6">
        <div><label htmlFor="hero-name" className="block mb-2 text-lg">Hero name</label><input id="hero-name" maxLength={20} value={draft.name} onChange={(e) => set({ name: e.target.value })} className="pixel-input w-full px-3 py-3" /></div>
        <fieldset><legend className="mb-3 text-lg">Class</legend><div className="grid grid-cols-3 gap-2">{(["knight", "mage", "ranger"] as AvatarClass[]).map((role) => <Button key={role} type="button" variant={draft.role === role ? "default" : "outline"} aria-pressed={draft.role === role} onClick={() => set({ role })} className="capitalize">{role}</Button>)}</div></fieldset>
        <fieldset><legend className="mb-3 text-lg">Armor color</legend><div className="flex gap-3">{avatarColors.map((color) => <Button key={color} type="button" size="icon" variant="outline" title={color.replace("pixel-", "")} aria-label={`${color.replace("pixel-", "")} armor`} aria-pressed={draft.color === color} onClick={() => set({ color })} className={cn(colorClasses[color], "text-ink border-2", draft.color === color && "ring-2 ring-ring ring-offset-2 ring-offset-background")}>{draft.color === color && <Check />}</Button>)}</div></fieldset>
        <fieldset><legend className="mb-3 text-lg">Accessory</legend><div className="grid grid-cols-3 gap-2">{(["none", "headband", "crown"] as const).map((accessory) => <Button type="button" key={accessory} variant={draft.accessory === accessory ? "default" : "outline"} aria-pressed={draft.accessory === accessory} onClick={() => set({ accessory })} className="capitalize">{accessory}</Button>)}</div></fieldset>
        <div className="flex gap-3"><Button type="submit"><Save />Save hero</Button><Button type="button" variant="outline" aria-label="Randomize avatar" title="Randomize avatar" onClick={() => set({ color: avatarColors[Math.floor(Math.random() * avatarColors.length)], role: (["knight", "mage", "ranger"] as const)[Math.floor(Math.random() * 3)], accessory: (["none", "headband", "crown"] as const)[Math.floor(Math.random() * 3)] })}><Shuffle /></Button></div>
      </form>
    </div>
    <Button asChild variant="outline" className="mt-10"><Link to="/battle"><Swords />Enter the arena</Link></Button>
  </div>;
}