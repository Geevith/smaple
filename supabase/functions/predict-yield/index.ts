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

    const { temperature, rainfall, fertilizer, soil_ph, humidity, nitrogen, phosphorus, potassium } = await req.json();

    console.log("Predicting yield with enhanced features:", { temperature, rainfall, fertilizer, soil_ph, humidity, nitrogen, phosphorus, potassium });

    // SIMULATE Preprocessing on Input (Apply same capping/transformations as in generation)
    const capped_temp = Math.max(10, Math.min(45, temperature));
    const capped_rainfall = Math.max(100, Math.min(2500, rainfall));
    // (Apply similar capping for other relevant features)

    // SIMULATE Feature Engineering on Input (Must match generation)
    const temp_rainfall_interaction = capped_temp * capped_rainfall / 1000;
    const ph_fertilizer_interaction = soil_ph * fertilizer / 100;
    const temp_squared = Math.pow(capped_temp / 10, 2);
    const npk_ratio = nitrogen / (phosphorus + potassium + 1);

    // SIMULATE Feature Scaling on Input (Placeholder)
    // In a real scenario, you'd load the scaler fitted on training data
    // and use scaler.transform(input_features)

    // Fetch *limited* training data for RF simulation (if using KNN approach)
    // OR load pre-calculated model coefficients/structure
    // Note: Fetching data per prediction is inefficient; real models are pre-trained.
    const { data: trainingData, error: fetchError } = await supabase
      .from("crops_dataset") // Assume this table now includes engineered features
      .select("*")
      .limit(500); // Limit data fetched per prediction for performance

    if (fetchError) throw fetchError;

    // --- Simulated Predictions using Engineered Features ---
    // 1. Linear Regression Simulation (Update function to use new features)
    const lrYield = predictLinearRegression(
      capped_temp, capped_rainfall, fertilizer, soil_ph, humidity,
      nitrogen, phosphorus, potassium, // Base features
      temp_rainfall_interaction, ph_fertilizer_interaction, temp_squared, npk_ratio // Engineered features
    );

    // 2. Random Forest Simulation (Update function if needed, depends on simulation method)
    const rfYield = predictRandomForest(
      capped_temp, capped_rainfall, fertilizer, soil_ph, humidity, // Pass necessary features...
      trainingData // Or use loaded model info
    );

    // ... (Determine best crop logic - could potentially use engineered features too) ...
    const predictedCrop = determineBestCrop(capped_temp, capped_rainfall, fertilizer, soil_ph, humidity);

    // ... (Fetch metrics - Assume metrics table now includes details like evaluation method) ...
    const { data: metrics } = await supabase
      .from("model_metrics")
      .select("*")
      .order("training_date", { ascending: false })
      .limit(2); // Fetch latest LR and RF

    const lrMetrics = metrics?.find((m) => m.model_name === "Linear Regression");
    const rfMetrics = metrics?.find((m) => m.model_name === "Random Forest");

    // ... (Determine best model based on R² score) ...
    const bestModel = (rfMetrics?.r2_score || 0) > (lrMetrics?.r2_score || 0)
      ? "Random Forest"
      : "Linear Regression";

    // --- SIMULATE Feature Importance (for Random Forest) ---
    // In a real RF model: importance = model.feature_importances_
    // Here, we simulate based on assumed contribution
    const simulatedImportances = {
      'temperature': 0.20,
      'rainfall': 0.25,
      'fertilizer': 0.15,
      'temp_rainfall_interaction': 0.12, // Engineered feature importance
      'humidity': 0.10,
      'soil_ph': 0.08,
      'nitrogen': 0.04,
      'phosphorus': 0.02,
      'potassium': 0.02,
      'npk_ratio': 0.02, // Engineered feature importance
      // Add others... sum should ideally be ~1.0
    };

    // ... (Store prediction - requires updating predictions table schema) ...
    // Include NPK values in the stored prediction
    const { error: insertError } = await supabase.from("predictions").insert({
      temperature, rainfall, fertilizer, soil_ph, humidity,
      nitrogen, phosphorus, potassium, // Store base NPK
      predicted_crop: predictedCrop,
      predicted_yield_lr: lrYield,
      predicted_yield_rf: rfYield,
      best_model: bestModel,
      feature_importances: JSON.stringify(simulatedImportances) // Store simulated importances
    });
    if (insertError) throw insertError;

    console.log("Prediction stored successfully");

    return new Response(
      JSON.stringify({
        predicted_crop: predictedCrop,
        predicted_yield_lr: lrYield,
        predicted_yield_rf: rfYield,
        best_model: bestModel,
        lr_metrics: lrMetrics, // Pass potentially updated metrics structure
        rf_metrics: rfMetrics,
        feature_importances: simulatedImportances, // Send simulated importances
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
  temp: number, rain: number, fert: number, ph: number, humid: number,
  n: number, p: number, k: number, // Base NPK
  tr_int: number, pf_int: number, t_sq: number, npk_r: number // Engineered
): number {
  // SIMPLIFIED coefficients - In reality, these come from model training
  const intercept = 800; // Adjusted intercept
  const coefficients = {
    temperature: 45, rainfall: 2.2, fertilizer: 14, soil_ph: 180, humidity: 9,
    nitrogen: 2, phosphorus: 1, potassium: 1.5, // NPK coeffs
    temp_rainfall_interaction: 5, ph_fertilizer_interaction: 3, // Interaction coeffs
    temp_squared: -0.5, npk_ratio: 10, // Polynomial and derived coeffs
  };

  const yield_value =
    intercept +
    coefficients.temperature * temp + coefficients.rainfall * rain +
    coefficients.fertilizer * fert + coefficients.soil_ph * ph +
    coefficients.humidity * humid +
    coefficients.nitrogen * n + coefficients.phosphorus * p + coefficients.potassium * k +
    coefficients.temp_rainfall_interaction * tr_int + coefficients.ph_fertilizer_interaction * pf_int +
    coefficients.temp_squared * t_sq + coefficients.npk_ratio * npk_r;

  return Math.max(500, parseFloat(yield_value.toFixed(2))); // Ensure minimum yield
}

function predictRandomForest(
  temp: number, rain: number, fert: number, ph: number, humid: number, /*...,*/
  trainingData: any[]
): number {
  // If using KNN simulation, update distance calculation to include engineered features
  if (!trainingData || trainingData.length === 0) {
    // Fallback if no training data
    return predictLinearRegression(temp, rain, fert, ph, humid, 0,0,0,0,0,0,0) * 1.10; // Simple boost
  }

  const k = Math.min(10, trainingData.length);
  const distances = trainingData.map((record) => {
      // Calculate distances using base AND engineered features (if available in record)
      const baseDistSq = (
        Math.pow( (record.temperature - temp) / 25, 2) +
        Math.pow( (record.rainfall - rain) / 1500, 2) +
        // ... include other base features ...
        Math.pow( (record.humidity - humid) / 50, 2)
      );
      // Add engineered feature distances if they exist in training data
      const engineeredDistSq = (
         (record.temp_rainfall_interaction ? Math.pow( (record.temp_rainfall_interaction - (temp*rain/1000)) / 10, 2) : 0) + // Example scaling
         // ... include other engineered features ...
         (record.npk_ratio ? Math.pow( (record.npk_ratio - (record.nitrogen/(record.phosphorus+record.potassium+1))) / 0.5, 2) : 0) // Example scaling
      );

      const distance = Math.sqrt(baseDistSq + engineeredDistSq); // Combine distances
      return { distance, yield: record.yield };
  });

   // ... (rest of KNN averaging logic) ...
   distances.sort((a, b) => a.distance - b.distance);
   const nearest = distances.slice(0, k);
   const totalWeight = nearest.reduce((sum, n) => sum + 1 / (n.distance + 0.01), 0);
   const weightedYield = nearest.reduce(
     (sum, n) => sum + (n.yield * (1 / (n.distance + 0.01))) / totalWeight,
     0
   );

   return parseFloat(weightedYield.toFixed(2));
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
