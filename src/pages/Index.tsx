import { useState } from "react";
import { PredictionForm } from "@/components/PredictionForm";
import { PredictionResults } from "@/components/PredictionResults";
import EnhancedVisualization from "@/components/EnhancedVisualization";
import PredictionHistory from "@/components/PredictionHistory";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Sparkles, BarChart3, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [generatingDataset, setGeneratingDataset] = useState(false);
  const [activeTab, setActiveTab] = useState('predict');
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [modelMetrics, setModelMetrics] = useState([]);

  const handlePredictionComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
    // Switch to results tab after prediction
    setActiveTab('results');
  };

  const handleGenerateDataset = async () => {
    setGeneratingDataset(true);
    toast({
      title: "Generating Dataset",
      description: "Creating 5000+ crop records...",
    });

    try {
      const { data, error } = await supabase.functions.invoke("generate-dataset");

      if (error) throw error;

      toast({
        title: "Dataset Generated!",
        description: `Successfully created ${data.records_created} records and trained models.`,
      });
    } catch (error) {
      console.error("Dataset generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate dataset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingDataset(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                <Sparkles className="h-8 w-8" />
                AgriPredict AI
              </h1>
              <p className="text-muted-foreground mt-1">
                Machine Learning Crop Yield Prediction System
              </p>
            </div>
            <Button
              onClick={handleGenerateDataset}
              disabled={generatingDataset}
              variant="outline"
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              {generatingDataset ? "Generating..." : "Generate Dataset"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="predict" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Predict
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predict">
            <div className="max-w-2xl mx-auto">
              <PredictionForm onPredictionComplete={handlePredictionComplete} />
            </div>
          </TabsContent>

          <TabsContent value="results">
            <PredictionResults refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="history">
            <PredictionHistory />
          </TabsContent>
        </Tabs>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="font-semibold text-lg mb-2 text-primary">Linear Regression</h3>
            <p className="text-sm text-muted-foreground">
              Fast and interpretable model for yield prediction based on environmental factors.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="font-semibold text-lg mb-2 text-primary">Random Forest</h3>
            <p className="text-sm text-muted-foreground">
              Ensemble learning method that captures complex non-linear relationships.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="font-semibold text-lg mb-2 text-primary">Real-time Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Instant predictions with model performance metrics (R², MAE, RMSE).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
