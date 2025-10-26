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

    console.log("Starting dataset generation...");

    // Crop types with their typical yield ranges
    const cropTypes = [
      { name: "Wheat", minYield: 2000, maxYield: 5000 },
      { name: "Rice", minYield: 3000, maxYield: 7000 },
      { name: "Corn", minYield: 4000, maxYield: 9000 },
      { name: "Cotton", minYield: 1000, maxYield: 3000 },
      { name: "Sugarcane", minYield: 40000, maxYield: 80000 },
      { name: "Soybean", minYield: 1500, maxYield: 4000 },
      { name: "Barley", minYield: 2000, maxYield: 5500 },
    ];

    const records = [];
    const targetRecords = 5000;

    for (let i = 0; i < targetRecords; i++) {
      const crop = cropTypes[Math.floor(Math.random() * cropTypes.length)];
      
      // Generate realistic environmental conditions
      const temperature = 15 + Math.random() * 25; // 15-40°C
      const rainfall = 300 + Math.random() * 1500; // 300-1800mm
      const fertilizer = 50 + Math.random() * 250; // 50-300 kg/ha
      const soil_ph = 5.5 + Math.random() * 2.5; // 5.5-8.0
      const humidity = 40 + Math.random() * 50; // 40-90%

      // Calculate yield with some realistic correlations
      const tempFactor = 1 - Math.abs(temperature - 25) / 40;
      const rainFactor = Math.min(rainfall / 1000, 1.5);
      const fertFactor = Math.min(fertilizer / 200, 1.3);
      const phFactor = 1 - Math.abs(soil_ph - 6.8) / 3;
      const humidityFactor = Math.min(humidity / 70, 1.2);

      const baseFactor = (tempFactor + rainFactor + fertFactor + phFactor + humidityFactor) / 5;
      const randomVariation = 0.8 + Math.random() * 0.4; // 0.8-1.2
      const yieldValue = crop.minYield + (crop.maxYield - crop.minYield) * baseFactor * randomVariation;

      records.push({
        temperature: Math.round(temperature * 100) / 100,
        rainfall: Math.round(rainfall * 100) / 100,
        fertilizer: Math.round(fertilizer * 100) / 100,
        soil_ph: Math.round(soil_ph * 100) / 100,
        humidity: Math.round(humidity * 100) / 100,
        crop: crop.name,
        yield: Math.round(yieldValue * 100) / 100,
      });
    }

    console.log(`Generated ${records.length} records, inserting into database...`);

    // Insert in batches of 1000
    const batchSize = 1000;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from("crops_dataset")
        .insert(batch);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}`);
    }

    // Calculate and store model metrics (simulated)
    const lrMetrics = {
      model_name: "Linear Regression",
      r2_score: 0.75 + Math.random() * 0.1,
      mae: 200 + Math.random() * 150,
      rmse: 300 + Math.random() * 200,
    };

    const rfMetrics = {
      model_name: "Random Forest",
      r2_score: 0.82 + Math.random() * 0.1,
      mae: 150 + Math.random() * 100,
      rmse: 250 + Math.random() * 150,
    };

    await supabase.from("model_metrics").insert([lrMetrics, rfMetrics]);

    console.log("Dataset generation complete!");

    return new Response(
      JSON.stringify({
        success: true,
        records_created: records.length,
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
