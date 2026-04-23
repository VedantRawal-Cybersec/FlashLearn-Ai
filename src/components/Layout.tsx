import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Layers, HelpCircle, Map, MessageCircle, BookOpen, Sun, Moon, Zap, AlertTriangle, Target, TrendingDown, Network, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useAppStore } from "@/lib/store";
import { useState } from "react";

const navItems = [
  { path: "/", label: "Home", icon: Zap },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/flashcards", label: "Flashcards", icon: Layers },
  { path: "/quiz", label: "Quiz", icon: HelpCircle },
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
  const { theme, toggleTheme } = useTheme();
  const session = useAppStore((s) => s.currentSession);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Flash Study</span>
          </Link>
          <div className="hidden lg:flex items-center gap-0.5">
            <nav className="flex items-center gap-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const disabled = item.path !== "/" && !session;
                return (
                  <Link
                    key={item.path}
                    to={disabled ? "#" : item.path}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : disabled
                        ? "text-muted-foreground cursor-not-allowed opacity-50"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={(e) => disabled && e.preventDefault()}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={toggleTheme}
              className="ml-1 p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-card absolute left-0 right-0 z-50 shadow-lg max-h-[70vh] overflow-y-auto">
            <nav className="grid grid-cols-3 gap-1 p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const disabled = item.path !== "/" && !session;
                return (
                  <Link
                    key={item.path}
                    to={disabled ? "#" : item.path}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : disabled
                        ? "text-muted-foreground opacity-40"
                        : "text-muted-foreground hover:bg-accent"
                    )}
                    onClick={(e) => {
                      if (disabled) e.preventDefault();
                      else setMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t p-3 flex justify-center">
              <button
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent"
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
