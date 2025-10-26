import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Award } from "lucide-react";

interface Prediction {
  id: string;
  temperature: number;
  rainfall: number;
  fertilizer: number;
  soil_ph: number;
  humidity: number;
  predicted_crop: string;
  predicted_yield_lr: number;
  predicted_yield_rf: number;
  best_model: string;
  created_at: string;
}

interface ModelMetrics {
  model_name: string;
  r2_score: number;
  mae: number;
  rmse: number;
}

interface PredictionResultsProps {
  refreshTrigger: number;
}

export const PredictionResults = ({ refreshTrigger }: PredictionResultsProps) => {
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics[]>([]);

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
      {/* Prediction Results */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-6 w-6" />
            Latest Prediction Results
          </CardTitle>
          <CardDescription>
            Predicted on {new Date(latestPrediction.created_at).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Predicted Crop</p>
              <p className="text-2xl font-bold text-primary">{latestPrediction.predicted_crop}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">LR Yield (kg/ha)</p>
              <p className="text-2xl font-bold">{latestPrediction.predicted_yield_lr.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">RF Yield (kg/ha)</p>
              <p className="text-2xl font-bold">{latestPrediction.predicted_yield_rf.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium">Best Model:</span>
            <Badge variant={latestPrediction.best_model === "Random Forest" ? "default" : "secondary"}>
              {latestPrediction.best_model}
            </Badge>
          </div>

          {/* Yield Comparison Chart */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Yield Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Yield (kg/hectare)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="yield" fill="hsl(var(--chart-1))" name="Predicted Yield" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Model Performance Metrics */}
      {modelMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Model Performance Metrics</CardTitle>
            <CardDescription>Latest training results</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>R² Score</TableHead>
                  <TableHead>MAE</TableHead>
                  <TableHead>RMSE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelMetrics.map((metric) => (
                  <TableRow key={metric.model_name}>
                    <TableCell className="font-medium">{metric.model_name}</TableCell>
                    <TableCell>{metric.r2_score.toFixed(4)}</TableCell>
                    <TableCell>{metric.mae.toFixed(4)}</TableCell>
                    <TableCell>{metric.rmse.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
