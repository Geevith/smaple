import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line
} from 'recharts';
import { TrendingUp, Activity, Target, Award, ThermometerSun, Cloud, Droplets, Wind, Info } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

// Use the generated types
type Prediction = Database['public']['Tables']['predictions']['Row'];
type ModelMetrics = Database['public']['Tables']['model_metrics']['Row'] & {
    tuned_parameters?: string; // Add if you store tuned params as string
};

interface EnhancedVisualizationProps {
  prediction: Prediction | null; // Allow null
  modelMetrics: ModelMetrics[];
  featureImportances?: Record<string, number> | null; // Optional feature importances
}

// Helper functions (keep as before or refine)
function normalizeValue(value: number | null | undefined, min: number, max: number, scale: number): number {
    if (value === null || typeof value === 'undefined') return 0; // Handle null/undefined
    return Math.max(0, Math.min(scale, ((value - min) / (max - min)) * scale)); // Clamp between 0 and scale
}

const temps: { [key: string]: number } = {
  rice: 24, wheat: 18, maize: 24, potato: 20, tomato: 24,
  cotton: 25, sugarcane: 24, coffee: 22, tea: 20, soybean: 25,
  groundnut: 25, chickpea: 20, lentil: 18, onion: 20, cabbage: 18,
  carrot: 18, pepper: 24, banana: 27, mango: 28, apple: 22,
  orange: 25, grapes: 25, coconut: 27, rubber: 28
};

const phValues: { [key: string]: number } = {
  rice: 5.8, wheat: 6.8, maize: 6.2, potato: 5.8, tomato: 6.5,
  cotton: 6.5, sugarcane: 6.5, coffee: 6.0, tea: 5.5, soybean: 6.5,
  groundnut: 6.2, chickpea: 7.0, lentil: 7.0, onion: 6.5, cabbage: 6.5,
  carrot: 6.5, pepper: 6.0, banana: 6.0, mango: 6.0, apple: 6.5,
  orange: 6.0, grapes: 6.5, coconut: 6.0, rubber: 5.5
};

const rainfall: { [key: string]: number } = {
  rice: 225, wheat: 88, maize: 80, potato: 60, tomato: 80,
  cotton: 100, sugarcane: 150, coffee: 150, tea: 200, soybean: 100,
  groundnut: 75, chickpea: 50, lentil: 50, onion: 60, cabbage: 80,
  carrot: 60, pepper: 100, banana: 120, mango: 100, apple: 80,
  orange: 100, grapes: 80, coconut: 200, rubber: 200
};

// Update these to handle potential nulls from prediction object
function getOptimalTemp(crop: string | null): number {
  return temps[crop?.toLowerCase() ?? ''] || 24;
}

function getOptimalPH(crop: string | null): number {
  return phValues[crop?.toLowerCase() ?? ''] || 6.5;
}

function getOptimalRainfall(crop: string | null): number {
  return rainfall[crop?.toLowerCase() ?? ''] || 100;
}

// Helper to prepare feature importance data
const prepareFeatureImportanceData = (importances: Record<string, number> | null | undefined) => {
  if (!importances) return [];
  return Object.entries(importances)
    .map(([feature, importance]) => ({ feature, importance: (importance || 0) * 100 })) // Handle potential undefined importance
    .filter(item => item.importance > 0.1) // Filter out very small importances
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10); // Take top 10 relevant
};

const EnhancedVisualization: React.FC<EnhancedVisualizationProps> = ({ prediction, modelMetrics, featureImportances }) => {

  if (!prediction) {
      return (
          <Card>
              <CardHeader>
                <CardTitle>Detailed Results & Visualizations</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>No prediction data available to display visualizations.</p>
              </CardContent>
          </Card>
      );
  }

  // Safely access prediction values with null checks
  const predictedYieldLR = prediction.predicted_yield_lr ?? 0;
  const predictedYieldRF = prediction.predicted_yield_rf ?? 0;
  const bestYield = Math.max(predictedYieldLR, predictedYieldRF);
  const bestModelName = prediction.best_model ?? 'N/A';

  const lrMetrics = modelMetrics.find(m => m.model_name === "Linear Regression");
  const rfMetrics = modelMetrics.find(m => m.model_name === "Random Forest");

  const modelComparisonData = [
    {
      name: "Linear Regression",
      yield: predictedYieldLR,
      accuracy: (lrMetrics?.r2_score ?? 0) * 100,
    },
    {
      name: "Random Forest",
      yield: predictedYieldRF,
      accuracy: (rfMetrics?.r2_score ?? 0) * 100,
    },
  ];

  const environmentalData = [
    { factor: 'Temp', value: normalizeValue(prediction.temperature, 0, 45, 100), optimal: normalizeValue(getOptimalTemp(prediction.predicted_crop), 0, 45, 100) },
    { factor: 'Humid', value: normalizeValue(prediction.humidity, 0, 100, 100), optimal: 70 }, // Assuming 70% optimal generic
    { factor: 'pH', value: normalizeValue(prediction.soil_ph, 4, 9, 100), optimal: normalizeValue(getOptimalPH(prediction.predicted_crop), 4, 9, 100) }, // Adjusted range for pH normalization
    { factor: 'Rain', value: normalizeValue(prediction.rainfall, 0, 2500, 100), optimal: normalizeValue(getOptimalRainfall(prediction.predicted_crop), 0, 2500, 100) }, // Adjusted range
    // Add NPK if available and relevant normalization range known
  ];

  const bestModelMetrics = modelMetrics.find(m => m.model_name === bestModelName);
  const bestModelAccuracy = (bestModelMetrics?.r2_score ?? 0) * 100;
  const performanceData = [
    { name: 'Accuracy', value: bestModelAccuracy },
    { name: 'Gap', value: Math.max(0, 100 - bestModelAccuracy) }, // Ensure non-negative gap
  ];
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  const featureImportanceData = prepareFeatureImportanceData(featureImportances);

  // Placeholder data for new plots using only the current prediction
  const actualVsPredictedData = [{ actual: bestYield, predicted: bestYield }]; // Simplified
  const residualData = [{ predicted: bestYield, residual: 0 }]; // Simplified

   const inputParameters = [
    { label: 'Temperature', value: prediction.temperature, unit: '°C', optimal: getOptimalTemp(prediction.predicted_crop), icon: <ThermometerSun className="h-5 w-5 text-orange-500" />, color: 'text-orange-500', actual: prediction.temperature },
    { label: 'Humidity', value: prediction.humidity, unit: '%', optimal: 70, icon: <Droplets className="h-5 w-5 text-teal-500" />, color: 'text-teal-500', actual: prediction.humidity },
    { label: 'Soil pH', value: prediction.soil_ph, unit: '', optimal: getOptimalPH(prediction.predicted_crop), icon: <Wind className="h-5 w-5 text-gray-500" />, color: 'text-gray-500', actual: prediction.soil_ph },
    { label: 'Rainfall', value: prediction.rainfall, unit: 'mm', optimal: getOptimalRainfall(prediction.predicted_crop), icon: <Cloud className="h-5 w-5 text-blue-500" />, color: 'text-blue-500', actual: prediction.rainfall },
    // Add NPK if available in prediction type and you have optimal values
     { label: 'Nitrogen', value: (prediction as any).nitrogen, unit: 'kg/ha', optimal: 120, /* Placeholder optimal */ icon: <span className="font-bold text-green-700">N</span>, color: 'text-green-700', actual: (prediction as any).nitrogen },
     { label: 'Phosphorus', value: (prediction as any).phosphorus, unit: 'kg/ha', optimal: 60, /* Placeholder optimal */ icon: <span className="font-bold text-purple-700">P</span>, color: 'text-purple-700', actual: (prediction as any).phosphorus },
     { label: 'Potassium', value: (prediction as any).potassium, unit: 'kg/ha', optimal: 80, /* Placeholder optimal */ icon: <span className="font-bold text-yellow-700">K</span>, color: 'text-yellow-700', actual: (prediction as any).potassium },
     { label: 'Fertilizer', value: prediction.fertilizer, unit: 'kg/ha', optimal: 150, /* Placeholder */ icon: <span className="text-xs text-lime-600">Fert</span>, color: 'text-lime-600', actual: prediction.fertilizer },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predicted Crop</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{prediction.predicted_crop ?? 'N/A'}</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Model</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{bestModelName}</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Yield</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{bestYield.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">kg/ha</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Model R² Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{bestModelAccuracy.toFixed(1)}%</div>
            </CardContent>
          </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Model Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Model Yield & Accuracy</CardTitle>
            <CardDescription>Comparing prediction outputs and R² scores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={modelComparisonData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis yAxisId="left" label={{ value: 'Yield (kg/ha)', angle: -90, position: 'insideLeft', fontSize: 12, dy: 40 }} fontSize={12} domain={[0, 'dataMax + 100']} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'R² (%)', angle: 90, position: 'insideRight', fontSize: 12, dy: -20 }} fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="yield" fill="hsl(var(--primary))" name="Predicted Yield" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="accuracy" fill="hsl(var(--secondary))" name="Model R² Score" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Environmental Conditions Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Environmental Factors vs. Optimal</CardTitle>
            <CardDescription>Normalized values (0-100 scale)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={environmentalData}>
                <PolarGrid opacity={0.5} />
                <PolarAngleAxis dataKey="factor" fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
                <Radar name="Current" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                <Radar name="Optimal" dataKey="optimal" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.4} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Model Accuracy Pie */}
        <Card>
            <CardHeader>
                <CardTitle>Best Model ({bestModelName}) R² Score</CardTitle>
                <CardDescription>Proportion of variance explained</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                        data={performanceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        >
                        {performanceData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} contentStyle={{ fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-3xl font-bold fill-primary"
                        >
                            {`${bestModelAccuracy.toFixed(1)}%`}
                        </text>
                         <text x="50%" y="62%" textAnchor="middle" className="text-xs fill-muted-foreground">R² Score</text>
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>


        {/* Feature Importance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Feature Importances ({bestModelName})</CardTitle>
            <CardDescription>Most influential factors for this prediction</CardDescription>
          </CardHeader>
          <CardContent>
             {featureImportanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={featureImportanceData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                      <XAxis type="number" domain={[0, 'dataMax + 5']} unit="%" fontSize={12} />
                      <YAxis dataKey="feature" type="category" width={110} fontSize={10} interval={0} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="importance" fill="hsl(var(--primary))" name="Importance" radius={[0, 4, 4, 0]} barSize={15} />
                  </BarChart>
              </ResponsiveContainer>
            ) : (
                 <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    <Info className="h-4 w-4 mr-2"/> Feature importance data not available for {bestModelName}.
                 </div>
            )}
          </CardContent>
        </Card>

        {/* Actual vs Predicted Plot (Placeholder) */}
        <Card>
            <CardHeader>
                <CardTitle>Actual vs. Predicted Yield (Conceptual)</CardTitle>
                <CardDescription>Illustrates prediction accuracy (requires test data)</CardDescription>
            </CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={250}>
                     <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 30 }}> {/* Adjust margins */}
                         <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                         <XAxis type="number" dataKey="actual" name="Actual Yield" unit=" kg/ha" fontSize={12} label={{ value: "Actual Yield (kg/ha)", position: 'bottom', dy: 15, fontSize: 12 }} />
                         <YAxis type="number" dataKey="predicted" name="Predicted Yield" unit=" kg/ha" fontSize={12} label={{ value: "Predicted Yield (kg/ha)", angle: -90, position: 'insideLeft', dx: -25, fontSize: 12 }} />
                         <ZAxis range={[60]} /> {/* Point size */}
                         <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 12 }} />
                         <Scatter name="Point" data={actualVsPredictedData} fill="hsl(var(--primary))" shape="circle" />
                          {/* Ideal Line y=x */}
                         <ReferenceLine x={actualVsPredictedData[0]?.actual} y={actualVsPredictedData[0]?.predicted} ifOverflow="extendDomain" stroke="transparent" label={{value:"Ideal (y=x)", position: "insideTopLeft", fill:"hsl(var(--muted-foreground))", fontSize: 10}}/>
                          {/* This is a trick: Draw a line from min to max */}
                          <Line
                             type="monotone"
                             dataKey="actual" // Use actual for both x and y to draw y=x
                             stroke="hsl(var(--muted-foreground))"
                             strokeDasharray="5 5"
                             dot={false}
                             activeDot={false}
                             isAnimationActive={false}
                             name="Ideal Fit"
                             legendType="none" // Hide from legend
                           />
                     </ScatterChart>
                 </ResponsiveContainer>
                 <p className="text-xs text-muted-foreground text-center mt-1">(Conceptual plot using current prediction point)</p>
            </CardContent>
        </Card>

        {/* Residual Plot (Placeholder) */}
         <Card>
            <CardHeader>
                <CardTitle>Residual Plot (Conceptual)</CardTitle>
                <CardDescription>Shows prediction errors vs. predicted value</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                     <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 30 }}>
                         <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
                         <XAxis type="number" dataKey="predicted" name="Predicted Yield" unit=" kg/ha" fontSize={12} label={{ value: "Predicted Yield (kg/ha)", position: 'bottom', dy: 15, fontSize: 12 }} />
                         <YAxis type="number" dataKey="residual" name="Residual (Error)" unit=" kg/ha" fontSize={12} domain={['auto', 'auto']} label={{ value: "Residual (kg/ha)", angle: -90, position: 'insideLeft', dx: -25, fontSize: 12 }}/>
                         <ZAxis range={[60]} />
                         <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 12 }} />
                          {/* Zero line */}
                         <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={1}/>
                         <Scatter name="Residuals" data={residualData} fill="hsl(var(--secondary))" shape="circle"/>
                     </ScatterChart>
                 </ResponsiveContainer>
                 <p className="text-xs text-muted-foreground text-center mt-1">(Conceptual plot using current prediction point)</p>
            </CardContent>
        </Card>

      </div> {/* End Charts Grid */}

      {/* Detailed Parameters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Input Parameter Analysis</CardTitle>
          <CardDescription>Comparison with estimated optimal values for {prediction.predicted_crop ?? 'the crop'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inputParameters.map((param, index) => (
              param.value !== null && typeof param.value !== 'undefined' && // Only render if value exists
                <ParameterRow
                    key={index}
                    label={param.label}
                    value={param.value}
                    unit={param.unit}
                    optimal={param.optimal}
                    icon={param.icon}
                    color={param.color}
                />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for parameter rows
const ParameterRow = ({ label, value, unit, optimal, icon: Icon, color }: {
  label: string;
  value: number | null;
  unit: string;
  optimal: number | null;
  icon: React.ReactNode;
  color: string;
}) => {
  if (value === null || typeof value === 'undefined') return null; // Don't render if no value

  let statusText = '';
  let statusColor = 'text-muted-foreground';
  let deviationPercent = null;

  if (optimal !== null && optimal !== 0) {
      deviationPercent = Math.abs(value - optimal) / optimal;
      if (deviationPercent < 0.1) { // Within 10%
          statusText = '✓ Optimal';
          statusColor = 'text-green-600';
      } else if (deviationPercent < 0.25) { // Within 25%
          statusText = '○ Near Optimal';
          statusColor = 'text-yellow-600';
      } else { // More than 25% deviation
          statusText = '⚠ Deviation';
          statusColor = 'text-orange-600';
      }
  } else {
      statusText = '-'; // No optimal value provided
  }

  const IconComponent = Icon;

  return (
    <div className="flex items-center justify-between p-3 bg-background border rounded-lg shadow-sm gap-2">
      <div className="flex items-center gap-3">
        {IconComponent}
        <div>
          <p className="text-sm font-medium text-card-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">Optimal: {optimal ?? 'N/A'} {unit}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-base font-semibold ${color}`}>
          {value?.toFixed(label === 'Soil pH' ? 1 : 0)} {unit} {/* Show 1 decimal for pH */}
        </p>
        <p className={`text-xs ${statusColor}`}>
          {statusText}
        </p>
      </div>
    </div>
  );
};

export default EnhancedVisualization;
