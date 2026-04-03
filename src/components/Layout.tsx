import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Layers, HelpCircle, Map, MessageCircle, Sun, Moon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useAppStore } from "@/lib/store";

const navItems = [
  { path: "/", label: "Home", icon: Zap },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/flashcards", label: "Flashcards", icon: Layers },
  { path: "/quiz", label: "Quiz", icon: HelpCircle },
  { path: "/roadmap", label: "Roadmap", icon: Map },
  { path: "/tutor", label: "AI Tutor", icon: MessageCircle },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const session = useAppStore((s) => s.currentSession);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Flash Study</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const disabled = item.path !== "/" && !session;
                return (
                  <Link
                    key={item.path}
                    to={disabled ? "#" : item.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : disabled
                        ? "text-muted-foreground cursor-not-allowed opacity-50"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={(e) => disabled && e.preventDefault()}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const disabled = item.path !== "/" && !session;
          return (
            <Link
              key={item.path}
              to={disabled ? "#" : item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-xs rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : disabled
                  ? "text-muted-foreground opacity-40"
                  : "text-muted-foreground"
              )}
              onClick={(e) => disabled && e.preventDefault()}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-xs rounded-lg text-muted-foreground"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          Theme
        </button>
      </nav>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
