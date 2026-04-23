import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Network, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MapNode {
  id: string;
  label: string;
  level: number;
  type: string;
}
interface MapEdge {
  from: string;
  to: string;
  label: string;
}
interface ConceptMapData {
  mainTopic: string;
  nodes: MapNode[];
  edges: MapEdge[];
}

const typeColors: Record<string, string> = {
  main: "bg-primary text-primary-foreground",
  subtopic: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  concept: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  detail: "bg-muted text-muted-foreground border-muted-foreground/20",
};

export default function ConceptMap() {
  const session = useAppStore((s) => s.currentSession);
  const [mapData, setMapData] = useState<ConceptMapData | null>(null);
  const [loading, setLoading] = useState(false);

  if (!session) {
    return (
      <div className="container max-w-3xl py-20 text-center">
        <p className="text-muted-foreground">No study session. Generate one first.</p>
      </div>
    );
  }

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const context = session.flashcards.map((c) => `Q: ${c.front}\nA: ${c.back}`).join("\n\n");
      const { data, error } = await supabase.functions.invoke("concept-map", {
        body: { title: session.title, context },
      });
      if (error) throw error;
      setMapData(data.conceptMap);
    } catch {
      toast.error("Failed to generate concept map. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getNodeById = (id: string) => mapData?.nodes.find((n) => n.id === id);

  // Group nodes by level
  const groupedNodes = mapData?.nodes.reduce<Record<number, MapNode[]>>((acc, node) => {
    if (!acc[node.level]) acc[node.level] = [];
    acc[node.level].push(node);
    return acc;
  }, {}) || {};

  const levelLabels: Record<number, string> = {
    0: "🎯 Main Topic",
    1: "📂 Subtopics",
    2: "💡 Concepts",
    3: "📝 Details",
  };

  return (
    <div className="container max-w-4xl py-6 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-2">🧠 Concept Map</h1>
      <p className="text-muted-foreground mb-6 text-sm">Visual knowledge graph showing concept relationships</p>

      {!mapData ? (
        <div className="text-center py-16 space-y-4">
          <Network className="h-12 w-12 text-primary mx-auto" />
          <p className="text-muted-foreground">
            Generate a concept map for <span className="font-medium text-foreground">"{session.title}"</span>
          </p>
          <Button onClick={handleGenerate} disabled={loading} size="lg">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Network className="h-4 w-4 mr-2" /> Generate Concept Map</>}
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Hierarchical view */}
          {Object.keys(groupedNodes)
            .sort((a, b) => Number(a) - Number(b))
            .map((level) => (
              <section key={level}>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  {levelLabels[Number(level)] || `Level ${level}`}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {groupedNodes[Number(level)].map((node) => (
                    <div
                      key={node.id}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium ${typeColors[node.type] || typeColors.detail}`}
                    >
                      {node.label}
                    </div>
                  ))}
                </div>
              </section>
            ))}

          {/* Relationships */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">🔗 Relationships</h2>
            <div className="space-y-2">
              {mapData.edges.map((edge, i) => {
                const from = getNodeById(edge.from);
                const to = getNodeById(edge.to);
                if (!from || !to) return null;
                return (
                  <div key={i} className="flex items-center gap-2 text-sm border rounded-lg p-2 bg-card">
                    <Badge variant="outline" className="text-xs">{from.label}</Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground italic flex-shrink-0">{edge.label}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <Badge variant="outline" className="text-xs">{to.label}</Badge>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
