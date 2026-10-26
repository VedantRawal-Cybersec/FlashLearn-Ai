import { Link, useLocation } from "react-router-dom";
import { Languages, BookOpenCheck, Users, BarChart3, Cloud, BrainCircuit, Timer, CalendarClock, ClipboardList, Atom, Compass, HeartPulse, CalendarDays, BookCheck, PencilRuler, LayoutDashboard, Layers, HelpCircle, Map, MessageCircle, BookOpen, Sun, Moon, Zap, AlertTriangle, Target, TrendingDown, Network, Menu, X, Swords, UserRound, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useAppStore } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
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
  { path: "/coach", label: "Study Coach", icon: BrainCircuit },
  { path: "/account", label: "My Account", icon: Cloud },
  { path: "/insights", label: "Learning Insights", icon: BarChart3 },
  { path: "/circles", label: "Study Circles", icon: Users },
  { path: "/advanced-formats", label: "Advanced Formats", icon: BookOpenCheck },
  { path: "/languages", label: "Bilingual Glossary", icon: Languages },
  { path: "/brain", label: "Exam Brain", icon: Compass },
  { path: "/rescue", label: "Rescue Mode", icon: HeartPulse },
  { path: "/planner", label: "Study Planner", icon: CalendarDays },
  { path: "/pattern-lab", label: "Exam Pattern Lab", icon: BookCheck },
  { path: "/labs", label: "Concept Labs", icon: Atom },
  { path: "/clinic", label: "Step Clinic", icon: PencilRuler },
  { path: "/drill", label: "Exam Drill", icon: Timer },
  { path: "/review", label: "Due Reviews", icon: CalendarClock },
  { path: "/mistakes", label: "Mistake Book", icon: ClipboardList },
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
  const sessionsLoaded = useAppStore((s) => s.sessionsLoaded);
  const loadSessions = useAppStore((s) => s.loadSessions);
  useEffect(() => {
    // Restore the active lesson on direct URLs and browser reloads, not only on Home.
    if (!sessionsLoaded) void loadSessions();
  }, [sessionsLoaded, loadSessions]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);
  const scrollFrame = useRef(0);
  useEffect(() => {
    const update = () => {
      scrollFrame.current = 0;
      const isScrolled = window.scrollY > 60;
      setScrolled(previous => previous === isScrolled ? previous : isScrolled);
    };
    const onScroll = () => {
      if (!scrollFrame.current) scrollFrame.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollFrame.current) cancelAnimationFrame(scrollFrame.current);
    };
  }, []);
  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  const renderLink = (item: typeof navItems[number]) => {
    const disabled = !["/", "/avatar", "/battle", "/rewards", "/coach", "/brain", "/rescue", "/planner", "/pattern-lab", "/labs", "/clinic"].includes(item.path) && !session;
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
            {navItems.filter((item) => ["/", "/flashcards", "/review", "/quiz", "/battle", "/tutor", "/rewards"].includes(item.path)).map(renderLink)}
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
