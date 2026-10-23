import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
const Home = lazy(() => import("@/pages/Home"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Coach = lazy(() => import("@/pages/Coach"));
const ExamDrill = lazy(() => import("@/pages/ExamDrill"));
const Flashcards = lazy(() => import("@/pages/Flashcards"));
const Quiz = lazy(() => import("@/pages/Quiz"));
const Roadmap = lazy(() => import("@/pages/Roadmap"));
const Tutor = lazy(() => import("@/pages/Tutor"));
const Notes = lazy(() => import("@/pages/Notes"));
const ConfusionDetector = lazy(() => import("@/pages/ConfusionDetector"));
const ExamPredictor = lazy(() => import("@/pages/ExamPredictor"));
const WeaknessAnalyzer = lazy(() => import("@/pages/WeaknessAnalyzer"));
const ConceptMap = lazy(() => import("@/pages/ConceptMap"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Avatar = lazy(() => import("@/pages/Avatar"));
const Battle = lazy(() => import("@/pages/Battle"));
const Rewards = lazy(() => import("@/pages/Rewards"));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false } } });

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<div role="status" aria-live="polite" className="container py-16 text-center text-muted-foreground">Loading Flash Learn…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/avatar" element={<Avatar />} />
<Route path="/battle" element={<Battle />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/drill" element={<ExamDrill />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/tutor" element={<Tutor />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/confusion" element={<ConfusionDetector />} />
            <Route path="/exam-predict" element={<ExamPredictor />} />
            <Route path="/weakness" element={<WeaknessAnalyzer />} />
            <Route path="/concept-map" element={<ConceptMap />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
