import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Award } from "lucide-react";
import EnhancedVisualization from "@/components/EnhancedVisualization"; // Import the enhanced component

interface Prediction {
  id: string;
  temperature: number;
  rainfall: number;
  fertilizer: number;
  soil_ph: number;
  humidity: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  predicted_crop: string;
  predicted_yield_lr: number;
  predicted_yield_rf: number;
  best_model: string;
  created_at: string;
  feature_importances: string; // JSON string
}

interface ModelMetrics {
  model_name: string;
  r2_score: number;
  mae: number;
  rmse: number;
  evaluation_method: string;
  tuned_parameters: string;
}

interface PredictionResultsProps {
  refreshTrigger: number;
}

export const PredictionResults = ({ refreshTrigger }: PredictionResultsProps) => {
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics[]>([]);
  // Add state for feature importances if returned by the backend
  const [featureImportances, setFeatureImportances] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    fetchLatestPrediction();
    fetchModelMetrics();
  }, [refreshTrigger]);

  const fetchLatestPrediction = async () => {
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      setLatestPrediction(data);
      // Parse feature importances if available
      if (data.feature_importances) {
        setFeatureImportances(JSON.parse(data.feature_importances));
      }
    }
  };

  const fetchModelMetrics = async () => {
    const { data, error } = await supabase
      .from("model_metrics")
      .select("*")
      .order("training_date", { ascending: false })
      .limit(2);

    if (data && !error) {
      setModelMetrics(data);
    }
  };

  if (!latestPrediction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>Submit a prediction to see results</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No predictions yet</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      name: "Linear Regression",
      yield: parseFloat(latestPrediction.predicted_yield_lr.toString()),
    },
    {
      name: "Random Forest",
      yield: parseFloat(latestPrediction.predicted_yield_rf.toString()),
    },
  ];

  return (
    <div className="space-y-6">
      <EnhancedVisualization
        prediction={latestPrediction}
        modelMetrics={modelMetrics}
        featureImportances={featureImportances} // Pass importances
      />

      {/* Optional: Keep the simpler Model Performance Metrics table as well */}
      {modelMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Model Performance Metrics Summary</CardTitle>
            <CardDescription>Latest training results overview</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>R² Score</TableHead>
                  <TableHead>MAE</TableHead>
                  <TableHead>RMSE</TableHead>
                  <TableHead>Evaluation Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelMetrics.map((metric) => (
                  <TableRow key={metric.model_name}>
                    <TableCell className="font-medium">{metric.model_name}</TableCell>
                    <TableCell>{metric.r2_score?.toFixed(4) ?? 'N/A'}</TableCell>
                    <TableCell>{metric.mae?.toFixed(2) ?? 'N/A'}</TableCell>
                    <TableCell>{metric.rmse?.toFixed(2) ?? 'N/A'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{metric.evaluation_method ?? 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Optionally display tuned parameters */}
            {modelMetrics.find(m => m.model_name === 'Random Forest' && m.tuned_parameters) && (
              <p className="text-xs text-muted-foreground mt-2">
                Best RF Params: {modelMetrics.find(m => m.model_name === 'Random Forest')?.tuned_parameters}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
