import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Flashcards() {
  const session = useAppStore((s) => s.currentSession);
  const updateDifficulty = useAppStore((s) => s.updateFlashcardDifficulty);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  if (!session || session.flashcards.length === 0) {
    return (
      <div className="container max-w-3xl py-20 text-center animate-fade-in">
        <p className="text-muted-foreground">No flashcards available. Generate a study session first.</p>
      </div>
    );
  }

  const card = session.flashcards[currentIndex];
  const total = session.flashcards.length;

  const goNext = () => {
    setFlipped(false);
    setCurrentIndex((i) => Math.min(i + 1, total - 1));
    setAnimKey((k) => k + 1);
  };
  const goPrev = () => {
    setFlipped(false);
    setCurrentIndex((i) => Math.max(i - 1, 0));
    setAnimKey((k) => k + 1);
  };

  const handleDifficulty = (d: 'easy' | 'medium' | 'hard') => {
    updateDifficulty(card.id, d);
    if (currentIndex < total - 1) goNext();
  };

  return (
    <div className="container max-w-2xl py-10 px-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
        <span className="text-sm text-muted-foreground font-medium">
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        key={animKey}
        className={cn(
          "relative cursor-pointer rounded-2xl border bg-card p-8 min-h-[260px] flex items-center justify-center text-center",
          "hover-lift animate-card-flip-in",
          flipped && "border-primary/30"
        )}
        onClick={() => setFlipped(!flipped)}
      >
        <div className={flipped ? "animate-scale-in" : ""}>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
            {flipped ? "Answer" : "Question"}
          </span>
          <p className="text-lg font-medium text-foreground leading-relaxed">
            {flipped ? card.back : card.front}
          </p>
        </div>
        <button
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-transform duration-200 hover:rotate-[-30deg]"
          onClick={(e) => {
            e.stopPropagation();
            setFlipped(!flipped);
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Difficulty buttons */}
      {flipped && (
        <div className="flex gap-3 justify-center mt-6 animate-slide-in-bottom">
          {(["easy", "medium", "hard"] as const).map((d, i) => (
            <Button
              key={d}
              variant={card.difficulty === d ? "default" : "outline"}
              onClick={() => handleDifficulty(d)}
              className={cn(
                "capitalize hover-scale",
                `stagger-${i + 1}`,
                card.difficulty === d && d === "easy" && "bg-success hover:bg-success/90",
                card.difficulty === d && d === "hard" && "bg-destructive hover:bg-destructive/90"
              )}
            >
              {d}
            </Button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0} className="hover-scale">
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button variant="outline" onClick={goNext} disabled={currentIndex === total - 1} className="hover-scale">
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
