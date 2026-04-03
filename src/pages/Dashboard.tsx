import { useAppStore } from "@/lib/store";
import { Layers, HelpCircle, Map, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const session = useAppStore((s) => s.currentSession);
  const navigate = useNavigate();

  if (!session) {
    return (
      <div className="container max-w-3xl py-20 text-center">
        <p className="text-muted-foreground">No study session yet. Go to Home to generate one.</p>
      </div>
    );
  }

  const totalCards = session.flashcards.length;
  const reviewedCards = session.flashcards.filter((c) => c.difficulty !== null).length;
  const totalQuiz = session.quizQuestions.length;
  const answeredQuiz = session.quizQuestions.filter((q) => q.userAnswer !== undefined).length;
  const correctQuiz = session.quizQuestions.filter((q) => q.userAnswer === q.correctIndex).length;
  const totalRoadmap = session.roadmap.length;
  const completedRoadmap = session.roadmap.filter((r) => r.completed).length;

  const stats = [
    {
      label: "Flashcards",
      value: `${reviewedCards}/${totalCards}`,
      sub: "reviewed",
      icon: Layers,
      path: "/flashcards",
    },
    {
      label: "Quiz Score",
      value: answeredQuiz > 0 ? `${Math.round((correctQuiz / answeredQuiz) * 100)}%` : "—",
      sub: `${answeredQuiz}/${totalQuiz} answered`,
      icon: HelpCircle,
      path: "/quiz",
    },
    {
      label: "Roadmap",
      value: `${completedRoadmap}/${totalRoadmap}`,
      sub: "completed",
      icon: Map,
      path: "/roadmap",
    },
  ];

  return (
    <div className="container max-w-3xl py-10 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8 truncate">{session.title}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => navigate(s.path)}
            className="rounded-xl border bg-card p-5 text-left hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-2 mb-3">
              <s.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.sub}</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Recent Progress
        </h2>
        <ul className="space-y-2 text-sm">
          <li className="text-muted-foreground">
            Flashcards: {reviewedCards} of {totalCards} reviewed
          </li>
          <li className="text-muted-foreground">
            Quiz: {answeredQuiz} of {totalQuiz} questions attempted
          </li>
          <li className="text-muted-foreground">
            Roadmap: {completedRoadmap} of {totalRoadmap} steps completed
          </li>
        </ul>
      </div>
    </div>
  );
}
