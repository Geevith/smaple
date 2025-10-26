import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Activity, Target, Award, ThermometerSun, Cloud, Droplets, Wind } from 'lucide-react';

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

interface EnhancedVisualizationProps {
  prediction: Prediction;
  modelMetrics: ModelMetrics[];
}

const EnhancedVisualization: React.FC<EnhancedVisualizationProps> = ({ prediction, modelMetrics }) => {
  // Prepare data for model comparison
  const modelComparisonData = [
    {
      name: "Linear Regression",
      yield: parseFloat(prediction.predicted_yield_lr.toString()),
      accuracy: modelMetrics.find(m => m.model_name === "Linear Regression")?.r2_score * 100 || 0,
    },
    {
      name: "Random Forest",
      yield: parseFloat(prediction.predicted_yield_rf.toString()),
      accuracy: modelMetrics.find(m => m.model_name === "Random Forest")?.r2_score * 100 || 0,
    },
  ];

  // Environmental factors data for radar chart
  const environmentalData = [
    {
      factor: 'Temperature',
      value: normalizeValue(prediction.temperature, 0, 40, 100),
      optimal: normalizeValue(getOptimalTemp(prediction.predicted_crop), 0, 40, 100),
    },
    {
      factor: 'Humidity',
      value: normalizeValue(prediction.humidity, 0, 100, 100),
      optimal: 70,
    },
    {
      factor: 'Soil pH',
      value: normalizeValue(prediction.soil_ph, 0, 14, 100),
      optimal: normalizeValue(getOptimalPH(prediction.predicted_crop), 0, 14, 100),
    },
    {
      factor: 'Rainfall',
      value: normalizeValue(prediction.rainfall, 0, 400, 100),
      optimal: normalizeValue(getOptimalRainfall(prediction.predicted_crop), 0, 400, 100),
    },
  ];

  // Model performance breakdown
  const bestModel = modelComparisonData.find(m => m.name === prediction.best_model);
  const performanceData = [
    { name: 'Model Match', value: bestModel ? bestModel.accuracy : 0 },
    { name: 'Gap', value: 100 - (bestModel ? bestModel.accuracy : 0) },
  ];

  const COLORS = ['#10b981', '#e5e7eb'];

  // Input parameters with optimal values
  const inputParameters = [
    {
      label: 'Temperature',
      value: prediction.temperature,
      unit: '°C',
      optimal: getOptimalTemp(prediction.predicted_crop),
      icon: '🌡️',
      actual: prediction.temperature,
    },
    {
      label: 'Humidity',
      value: prediction.humidity,
      unit: '%',
      optimal: 70,
      icon: '💧',
      actual: prediction.humidity,
    },
    {
      label: 'Soil pH',
      value: prediction.soil_ph,
      unit: '',
      optimal: getOptimalPH(prediction.predicted_crop),
      icon: '⚗️',
      actual: prediction.soil_ph,
    },
    {
      label: 'Rainfall',
      value: prediction.rainfall,
      unit: 'mm',
      optimal: getOptimalRainfall(prediction.predicted_crop),
      icon: '🌧️',
      actual: prediction.rainfall,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Predicted Crop</p>
                <p className="text-2xl font-bold text-primary">{prediction.predicted_crop}</p>
              </div>
              <Target className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Best Model</p>
                <p className="text-2xl font-bold text-blue-600">{prediction.best_model}</p>
              </div>
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Best Yield</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.max(prediction.predicted_yield_lr, prediction.predicted_yield_rf).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">kg/ha</p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Model Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {bestModel ? Math.round(bestModel.accuracy) : 0}%
                </p>
              </div>
              <Award className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Model Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Model Performance</CardTitle>
            <CardDescription>Linear Regression vs Random Forest</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={modelComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" label={{ value: 'Yield (kg/ha)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Accuracy (%)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="yield" fill="#3b82f6" name="Predicted Yield" />
                <Bar yAxisId="right" dataKey="accuracy" fill="#10b981" name="Model Accuracy" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Environmental Conditions Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Environmental Analysis</CardTitle>
            <CardDescription>Current vs Optimal conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={environmentalData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Current"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Optimal"
                  dataKey="optimal"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Model Accuracy */}
        <Card>
          <CardHeader>
            <CardTitle>Best Model Accuracy</CardTitle>
            <CardDescription>{prediction.best_model} performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <Tooltip />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-3xl font-bold"
                >
                  {bestModel ? Math.round(bestModel.accuracy) : 0}%
                </text>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Input Parameters Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Parameter Analysis</CardTitle>
            <CardDescription>Current vs optimal values</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={inputParameters} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="actual" fill="#3b82f6" name="Current" />
                <Bar dataKey="optimal" fill="#10b981" name="Optimal" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Parameters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Environmental Parameters</CardTitle>
          <CardDescription>Comprehensive analysis of input factors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {inputParameters.map((param, index) => (
              <ParameterRow
                key={index}
                label={param.label}
                value={param.actual}
                unit={param.unit}
                optimal={param.optimal}
                icon={param.icon}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for parameter rows
const ParameterRow = ({ label, value, unit, optimal, icon }: {
  label: string;
  value: number;
  unit: string;
  optimal: number;
  icon: string;
}) => {
  const isOptimal = Math.abs(value - optimal) / optimal < 0.2;
  const statusColor = isOptimal ? 'text-green-600' : 'text-yellow-600';

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-500">Optimal: {optimal} {unit}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-lg font-bold ${statusColor}`}>
          {value} {unit}
        </p>
        <p className="text-xs text-gray-500">
          {isOptimal ? '✓ Optimal' : '⚠ Adjust'}
        </p>
      </div>
    </div>
  );
};

// Helper functions
function normalizeValue(value: number, min: number, max: number, scale: number): number {
  return ((value - min) / (max - min)) * scale;
}

function getOptimalTemp(crop: string): number {
  const temps: { [key: string]: number } = {
    rice: 24, wheat: 18, maize: 24, potato: 20, tomato: 24,
    cotton: 25, sugarcane: 24, coffee: 22, tea: 20, soybean: 25,
    groundnut: 25, chickpea: 20, lentil: 18, onion: 20, cabbage: 18,
    carrot: 18, pepper: 24, banana: 27, mango: 28, apple: 22,
    orange: 25, grapes: 25, coconut: 27, rubber: 28
  };
  return temps[crop] || 24;
}

function getOptimalPH(crop: string): number {
  const phValues: { [key: string]: number } = {
    rice: 5.8, wheat: 6.8, maize: 6.2, potato: 5.8, tomato: 6.5,
    cotton: 6.5, sugarcane: 6.5, coffee: 6.0, tea: 5.5, soybean: 6.5,
    groundnut: 6.2, chickpea: 7.0, lentil: 7.0, onion: 6.5, cabbage: 6.5,
    carrot: 6.5, pepper: 6.0, banana: 6.0, mango: 6.0, apple: 6.5,
    orange: 6.0, grapes: 6.5, coconut: 6.0, rubber: 5.5
  };
  return phValues[crop] || 6.5;
}

function getOptimalRainfall(crop: string): number {
  const rainfall: { [key: string]: number } = {
    rice: 225, wheat: 88, maize: 80, potato: 60, tomato: 80,
    cotton: 100, sugarcane: 150, coffee: 150, tea: 200, soybean: 100,
    groundnut: 75, chickpea: 50, lentil: 50, onion: 60, cabbage: 80,
    carrot: 60, pepper: 100, banana: 120, mango: 100, apple: 80,
    orange: 100, grapes: 80, coconut: 200, rubber: 200
  };
  return rainfall[crop] || 100;
}

export default EnhancedVisualization;
