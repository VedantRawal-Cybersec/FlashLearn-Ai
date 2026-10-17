import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Layers, HelpCircle, Map, MessageCircle, BookOpen, Sun, Moon, Zap, AlertTriangle, Target, TrendingDown, Network, Menu, X, Swords, UserRound, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PixelBolt } from "@/components/PixelArt";
import PlayerAvatar from "@/components/PlayerAvatar";
import { usePlayer } from "@/lib/player";

const navItems = [
  { path: "/", label: "Home", icon: Zap },
  { path: "/battle", label: "1v1 Arena", icon: Swords },
  { path: "/avatar", label: "My Hero", icon: UserRound },
  { path: "/rewards", label: "Rewards", icon: Trophy },
  { path: "/dashboard", label: "Progress", icon: LayoutDashboard },
  { path: "/flashcards", label: "Flashcards", icon: Layers },
  { path: "/quiz", label: "Quiz Battle", icon: HelpCircle },
  { path: "/roadmap", label: "Roadmap", icon: Map },
  { path: "/tutor", label: "AI Tutor", icon: MessageCircle },
  { path: "/notes", label: "Notes", icon: BookOpen },
  { path: "/confusion", label: "Confusion", icon: AlertTriangle },
  { path: "/exam-predict", label: "Exam Prep", icon: Target },
  { path: "/weakness", label: "Weakness", icon: TrendingDown },
  { path: "/concept-map", label: "Concepts", icon: Network },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const avatar = usePlayer((s) => s.avatar);
  const { theme, toggleTheme } = useTheme();
  const session = useAppStore((s) => s.currentSession);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 60);
    update();
    window.addEventListener("scroll", update, { passive: true });
    if (!document.getElementById("pixel-fonts")) {
      const link = document.createElement("link");
      link.id = "pixel-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pixelify+Sans:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  const renderLink = (item: typeof navItems[number]) => {
    const disabled = !["/", "/avatar", "/battle", "/rewards"].includes(item.path) && !session;
    const active = location.pathname === item.path;
    const Icon = item.icon;
    return (
      <Link key={item.path} to={disabled ? "#" : item.path}
        aria-current={active ? "page" : undefined} aria-disabled={disabled}
        onClick={(e) => { if (disabled) e.preventDefault(); else setMobileMenuOpen(false); }}
        className={cn("flex items-center gap-2 px-3 py-2 text-base border-b-2 transition-colors",
          active ? "border-primary text-primary" : "border-transparent text-foreground hover:text-primary",
          disabled && "opacity-40 cursor-not-allowed")}>
        <Icon className="h-3.5 w-3.5 shrink-0" />{item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className={cn("world-nav sticky top-0 z-50 border-b border-transparent", scrolled && "is-scrolled")}>
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 flex h-[76px] items-center justify-between gap-4">
          <Link to="/" aria-label="Flash Learn home" className="flex items-center gap-2 shrink-0">
            <PixelBolt size={32} />
            <span className="pixel-text text-[0.7rem] leading-[1.5] text-foreground">FLASH<br /><span className="text-primary">LEARN</span></span>
          </Link>
          <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-1">
            {navItems.filter((item) => ["/", "/flashcards", "/quiz", "/battle", "/tutor", "/rewards"].includes(item.path)).map(renderLink)}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" title="Customize your hero"><Link to="/avatar" aria-label="Customize your hero"><PlayerAvatar avatar={avatar} size={34} /></Link></Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
              {theme === "light" ? <Moon /> : <Sun />}
            </Button>
            <Button variant="outline" size="sm" className="pixel-body border-primary/60 gap-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-expanded={mobileMenuOpen} aria-controls="quest-navigation" aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}>
              {mobileMenuOpen ? <X /> : <Menu />}<span className="hidden sm:inline">Quests</span>
            </Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav id="quest-navigation" aria-label="All quests" className="absolute left-0 right-0 border-y-2 border-border bg-deep max-h-[70vh] overflow-y-auto shadow-pixel-control">
            <div className="mx-auto max-w-[1200px] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 p-5">
              {navItems.map(renderLink)}
            </div>
          </nav>
        )}
      </header>
      <main key={location.pathname} className={cn("flex-1 quest-page-enter", location.pathname !== "/" && "study-world")}>{children}</main>
    </div>
  );
}
