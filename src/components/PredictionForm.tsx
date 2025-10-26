import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf, Loader2, Sprout, Droplets, ThermometerSun, Wind, Cloud, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PredictionFormProps {
  onPredictionComplete: () => void;
}

export const PredictionForm = ({ onPredictionComplete }: PredictionFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [formData, setFormData] = useState({
    temperature: "",
    rainfall: "",
    fertilizer: "",
    soil_ph: "",
    humidity: "",
    nitrogen: "",
    phosphorus: "",
    potassium: ""
  });

  // Available crops for selection (expanded list from Crop-yield project)
  const crops = [
    { value: 'rice', label: 'Rice', icon: '🌾', category: 'Cereal' },
    { value: 'wheat', label: 'Wheat', icon: '🌾', category: 'Cereal' },
    { value: 'maize', label: 'Maize (Corn)', icon: '🌽', category: 'Cereal' },
    { value: 'barley', label: 'Barley', icon: '🌾', category: 'Cereal' },
    { value: 'millet', label: 'Millet', icon: '🌾', category: 'Cereal' },
    { value: 'sorghum', label: 'Sorghum', icon: '🌾', category: 'Cereal' },
    { value: 'cotton', label: 'Cotton', icon: '🌿', category: 'Fiber' },
    { value: 'jute', label: 'Jute', icon: '🌱', category: 'Fiber' },
    { value: 'sugarcane', label: 'Sugarcane', icon: '🎋', category: 'Cash Crop' },
    { value: 'coffee', label: 'Coffee', icon: '☕', category: 'Beverage' },
    { value: 'tea', label: 'Tea', icon: '🍵', category: 'Beverage' },
    { value: 'tobacco', label: 'Tobacco', icon: '🚬', category: 'Cash Crop' },
    { value: 'soybean', label: 'Soybean', icon: '🫘', category: 'Legume' },
    { value: 'groundnut', label: 'Groundnut (Peanut)', icon: '🥜', category: 'Legume' },
    { value: 'chickpea', label: 'Chickpea', icon: '🫘', category: 'Legume' },
    { value: 'lentil', label: 'Lentil', icon: '🫘', category: 'Legume' },
    { value: 'potato', label: 'Potato', icon: '🥔', category: 'Vegetable' },
    { value: 'tomato', label: 'Tomato', icon: '🍅', category: 'Vegetable' },
    { value: 'onion', label: 'Onion', icon: '🧅', category: 'Vegetable' },
    { value: 'cabbage', label: 'Cabbage', icon: '🥬', category: 'Vegetable' },
    { value: 'carrot', label: 'Carrot', icon: '🥕', category: 'Vegetable' },
    { value: 'pepper', label: 'Pepper', icon: '🌶️', category: 'Vegetable' },
    { value: 'banana', label: 'Banana', icon: '🍌', category: 'Fruit' },
    { value: 'mango', label: 'Mango', icon: '🥭', category: 'Fruit' },
    { value: 'apple', label: 'Apple', icon: '🍎', category: 'Fruit' },
    { value: 'orange', label: 'Orange', icon: '🍊', category: 'Fruit' },
    { value: 'grapes', label: 'Grapes', icon: '🍇', category: 'Fruit' },
    { value: 'coconut', label: 'Coconut', icon: '🥥', category: 'Plantation' },
    { value: 'rubber', label: 'Rubber', icon: '🌳', category: 'Plantation' },
  ];

  // Crop-specific optimal conditions (for reference)
  const cropConditions = {
    rice: { temp: '20-27°C', ph: '5.0-6.5', rainfall: 'High' },
    wheat: { temp: '12-25°C', ph: '6.0-7.5', rainfall: 'Moderate' },
    maize: { temp: '21-27°C', ph: '5.5-7.0', rainfall: 'Moderate' },
    cotton: { temp: '21-30°C', ph: '5.5-8.0', rainfall: 'Moderate' },
    sugarcane: { temp: '21-27°C', ph: '6.0-7.5', rainfall: 'High' },
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("predict-yield", {
        body: {
          crop: selectedCrop,
          temperature: parseFloat(formData.temperature),
          rainfall: parseFloat(formData.rainfall),
          fertilizer: parseFloat(formData.fertilizer),
          soil_ph: parseFloat(formData.soil_ph),
          humidity: parseFloat(formData.humidity),
          nitrogen: parseFloat(formData.nitrogen) || 0,
          phosphorus: parseFloat(formData.phosphorus) || 0,
          potassium: parseFloat(formData.potassium) || 0,
        },
      });

      if (error) throw error;

      toast({
        title: "Prediction Complete!",
        description: `Predicted crop: ${data.predicted_crop}`,
      });

      onPredictionComplete();

      // Reset form
      setFormData({
        temperature: "",
        rainfall: "",
        fertilizer: "",
        soil_ph: "",
        humidity: "",
        nitrogen: "",
        phosphorus: "",
        potassium: ""
      });
      setSelectedCrop("");
    } catch (error) {
      console.error("Prediction error:", error);
      toast({
        title: "Prediction Failed",
        description: "Unable to generate prediction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Leaf className="h-6 w-6" />
          Crop Yield Prediction
        </CardTitle>
        <CardDescription>
          Select a crop and enter environmental conditions to predict optimal yield
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Crop Selection */}
          <div className="space-y-2">
            <Label htmlFor="crop" className="text-base font-semibold">
              Select Crop to Predict *
            </Label>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a crop..." />
              </SelectTrigger>
              <SelectContent>
                {crops.map((crop) => (
                  <SelectItem key={crop.value} value={crop.value}>
                    <span className="flex items-center gap-2">
                      <span>{crop.icon}</span>
                      <span>{crop.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Show optimal conditions if crop selected */}
          {selectedCrop && cropConditions[selectedCrop] && (
            <Alert className="bg-primary/5 border-primary/20">
              <AlertDescription className="text-sm text-primary">
                <strong>Optimal Conditions:</strong> Temp: {cropConditions[selectedCrop].temp},
                pH: {cropConditions[selectedCrop].ph},
                Rainfall: {cropConditions[selectedCrop].rainfall}
              </AlertDescription>
            </Alert>
          )}

          {/* Soil Nutrients */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nitrogen">Nitrogen (N) kg/ha</Label>
              <Input
                id="nitrogen"
                name="nitrogen"
                type="number"
                step="0.01"
                placeholder="e.g., 120"
                value={formData.nitrogen}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phosphorus">Phosphorus (P) kg/ha</Label>
              <Input
                id="phosphorus"
                name="phosphorus"
                type="number"
                step="0.01"
                placeholder="e.g., 60"
                value={formData.phosphorus}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="potassium">Potassium (K) kg/ha</Label>
              <Input
                id="potassium"
                name="potassium"
                type="number"
                step="0.01"
                placeholder="e.g., 80"
                value={formData.potassium}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature" className="flex items-center gap-2">
                <ThermometerSun className="h-4 w-4" />
                Temperature (°C)
              </Label>
              <Input
                id="temperature"
                name="temperature"
                type="number"
                step="0.01"
                placeholder="e.g., 25.5"
                required
                value={formData.temperature}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rainfall" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Rainfall (mm)
              </Label>
              <Input
                id="rainfall"
                name="rainfall"
                type="number"
                step="0.01"
                placeholder="e.g., 800"
                required
                value={formData.rainfall}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fertilizer">Fertilizer (kg/hectare)</Label>
              <Input
                id="fertilizer"
                name="fertilizer"
                type="number"
                step="0.01"
                placeholder="e.g., 120"
                required
                value={formData.fertilizer}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="soil_ph" className="flex items-center gap-2">
                <Wind className="h-4 w-4" />
                Soil pH
              </Label>
              <Input
                id="soil_ph"
                name="soil_ph"
                type="number"
                step="0.01"
                placeholder="e.g., 6.5"
                required
                min="0"
                max="14"
                value={formData.soil_ph}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="humidity" className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Humidity (%)
              </Label>
              <Input
                id="humidity"
                name="humidity"
                type="number"
                step="0.01"
                placeholder="e.g., 65"
                required
                min="0"
                max="100"
                value={formData.humidity}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Predicting...
              </>
            ) : (
              <>
                <Sprout className="mr-2 h-4 w-4" />
                Predict Yield
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
