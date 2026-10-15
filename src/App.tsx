import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Flashcards from "@/pages/Flashcards";
import Quiz from "@/pages/Quiz";
import Roadmap from "@/pages/Roadmap";
import Tutor from "@/pages/Tutor";
import Notes from "@/pages/Notes";
import ConfusionDetector from "@/pages/ConfusionDetector";
import ExamPredictor from "@/pages/ExamPredictor";
import WeaknessAnalyzer from "@/pages/WeaknessAnalyzer";
import ConceptMap from "@/pages/ConceptMap";
import NotFound from "@/pages/NotFound";
import Avatar from "@/pages/Avatar";
import Battle from "@/pages/Battle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/avatar" element={<Avatar />} />
            <Route path="/battle" element={<Battle />} />
            <Route path="/dashboard" element={<Dashboard />} />
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
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
