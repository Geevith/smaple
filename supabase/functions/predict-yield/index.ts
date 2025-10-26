import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { temperature, rainfall, fertilizer, soil_ph, humidity } = await req.json();

    console.log("Predicting yield for:", { temperature, rainfall, fertilizer, soil_ph, humidity });

    // Fetch training data
    const { data: trainingData, error: fetchError } = await supabase
      .from("crops_dataset")
      .select("*")
      .limit(1000);

    if (fetchError) throw fetchError;

    // Simple ML simulation - Linear Regression
    // In production, you'd use trained model coefficients
    const lrYield = predictLinearRegression(temperature, rainfall, fertilizer, soil_ph, humidity);

    // Random Forest simulation
    const rfYield = predictRandomForest(temperature, rainfall, fertilizer, soil_ph, humidity, trainingData);

    // Determine best crop based on conditions
    const predictedCrop = determineBestCrop(temperature, rainfall, fertilizer, soil_ph, humidity);

    // Get model metrics
    const { data: metrics } = await supabase
      .from("model_metrics")
      .select("*")
      .order("training_date", { ascending: false })
      .limit(2);

    const lrMetrics = metrics?.find((m) => m.model_name === "Linear Regression");
    const rfMetrics = metrics?.find((m) => m.model_name === "Random Forest");

    // Determine best model based on R² score
    const bestModel = (rfMetrics?.r2_score || 0) > (lrMetrics?.r2_score || 0)
      ? "Random Forest"
      : "Linear Regression";

    // Store prediction
    const { error: insertError } = await supabase.from("predictions").insert({
      temperature,
      rainfall,
      fertilizer,
      soil_ph,
      humidity,
      predicted_crop: predictedCrop,
      predicted_yield_lr: lrYield,
      predicted_yield_rf: rfYield,
      best_model: bestModel,
    });

    if (insertError) throw insertError;

    console.log("Prediction stored successfully");

    return new Response(
      JSON.stringify({
        predicted_crop: predictedCrop,
        predicted_yield_lr: lrYield,
        predicted_yield_rf: rfYield,
        best_model: bestModel,
        lr_metrics: lrMetrics,
        rf_metrics: rfMetrics,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function predictLinearRegression(
  temp: number,
  rain: number,
  fert: number,
  ph: number,
  humid: number
): number {
  // Simplified linear regression coefficients (trained on typical crop data)
  const intercept = 1000;
  const coefficients = {
    temperature: 50,
    rainfall: 2.5,
    fertilizer: 15,
    soil_ph: 200,
    humidity: 10,
  };

  const yield_value =
    intercept +
    coefficients.temperature * temp +
    coefficients.rainfall * rain +
    coefficients.fertilizer * fert +
    coefficients.soil_ph * ph +
    coefficients.humidity * humid;

  return Math.max(500, Math.round(yield_value * 100) / 100);
}

function predictRandomForest(
  temp: number,
  rain: number,
  fert: number,
  ph: number,
  humid: number,
  trainingData: any[]
): number {
  // Simulate Random Forest with weighted nearest neighbors
  if (!trainingData || trainingData.length === 0) {
    return predictLinearRegression(temp, rain, fert, ph, humid) * 1.15;
  }

  // Find k-nearest neighbors (k=10)
  const k = Math.min(10, trainingData.length);
  const distances = trainingData.map((record) => {
    const tempDist = Math.abs(record.temperature - temp) / 25;
    const rainDist = Math.abs(record.rainfall - rain) / 1500;
    const fertDist = Math.abs(record.fertilizer - fert) / 250;
    const phDist = Math.abs(record.soil_ph - ph) / 2.5;
    const humidDist = Math.abs(record.humidity - humid) / 50;

    const distance = Math.sqrt(
      tempDist ** 2 + rainDist ** 2 + fertDist ** 2 + phDist ** 2 + humidDist ** 2
    );

    return { distance, yield: record.yield };
  });

  // Sort and get k nearest
  distances.sort((a, b) => a.distance - b.distance);
  const nearest = distances.slice(0, k);

  // Weighted average (inverse distance weighting)
  const totalWeight = nearest.reduce((sum, n) => sum + 1 / (n.distance + 0.01), 0);
  const weightedYield = nearest.reduce(
    (sum, n) => sum + (n.yield * (1 / (n.distance + 0.01))) / totalWeight,
    0
  );

  return Math.round(weightedYield * 100) / 100;
}

function determineBestCrop(
  temp: number,
  rain: number,
  fert: number,
  ph: number,
  humid: number
): string {
  // Simple rule-based crop selection
  if (temp > 30 && rain > 1200) return "Rice";
  if (temp > 25 && rain > 800 && rain < 1200) return "Corn";
  if (temp > 28 && rain > 1000) return "Sugarcane";
  if (temp < 25 && rain < 800) return "Wheat";
  if (temp > 25 && rain < 700) return "Cotton";
  if (temp < 28 && rain > 600 && rain < 1000) return "Soybean";
  return "Barley";
}
