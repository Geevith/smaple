import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Leaf, Loader2, Sprout, Droplets, ThermometerSun, Wind, Cloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PredictionFormProps {
  onPredictionComplete: () => void;
}

// Define the validation schema using Zod
const predictionFormSchema = z.object({
  crop: z.string().min(1, { message: "Please select a crop." }),
  temperature: z.coerce.number({ required_error: "Temperature is required.", invalid_type_error: "Must be a number" }).min(-50, "Value seems too low").max(60, "Value seems too high"),
  rainfall: z.coerce.number({ required_error: "Rainfall is required.", invalid_type_error: "Must be a number" }).min(0, "Cannot be negative"),
  fertilizer: z.coerce.number({ required_error: "Fertilizer amount is required.", invalid_type_error: "Must be a number" }).min(0, "Cannot be negative"),
  soil_ph: z.coerce.number({ required_error: "Soil pH is required.", invalid_type_error: "Must be a number" }).min(0, "Min pH is 0").max(14, "Max pH is 14"),
  humidity: z.coerce.number({ required_error: "Humidity is required.", invalid_type_error: "Must be a number" }).min(0, "Min humidity is 0%").max(100, "Max humidity is 100%"),
  nitrogen: z.coerce.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional().or(z.literal("")).or(z.null()), // Allow empty string or null
  phosphorus: z.coerce.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional().or(z.literal("")).or(z.null()),
  potassium: z.coerce.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional().or(z.literal("")).or(z.null()),
});

// Infer the form data type from the schema
type PredictionFormData = z.infer<typeof predictionFormSchema>;

export const PredictionForm = ({ onPredictionComplete }: PredictionFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Initialize react-hook-form
  const form = useForm<PredictionFormData>({
    resolver: zodResolver(predictionFormSchema),
    mode: "onChange", // Validate on change for better UX
    defaultValues: {
      crop: "",
      temperature: undefined,
      rainfall: undefined,
      fertilizer: undefined,
      soil_ph: undefined,
      humidity: undefined,
      nitrogen: "", // Use empty string for optional number inputs initially
      phosphorus: "",
      potassium: "",
    },
  });

  const selectedCrop = form.watch("crop"); // Watch the crop value

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
  const cropConditions: Record<string, { temp: string; ph: string; rainfall: string }> = {
    rice: { temp: '20-27°C', ph: '5.0-6.5', rainfall: 'High' },
    wheat: { temp: '12-25°C', ph: '6.0-7.5', rainfall: 'Moderate' },
    maize: { temp: '21-27°C', ph: '5.5-7.0', rainfall: 'Moderate' },
    cotton: { temp: '21-30°C', ph: '5.5-8.0', rainfall: 'Moderate' },
    sugarcane: { temp: '21-27°C', ph: '6.0-7.5', rainfall: 'High' },
    // Add others if needed
  };

  const onSubmit = async (values: PredictionFormData) => {
    setLoading(true);

    try {
      const payload = {
          crop: values.crop,
          temperature: values.temperature,
          rainfall: values.rainfall,
          fertilizer: values.fertilizer,
          soil_ph: values.soil_ph,
          humidity: values.humidity,
          // Send 0 if optional NPK fields are empty/null/undefined
          nitrogen: Number(values.nitrogen) || 0,
          phosphorus: Number(values.phosphorus) || 0,
          potassium: Number(values.potassium) || 0,
      };
      console.log("Sending payload:", payload);

      const { data, error } = await supabase.functions.invoke("predict-yield", { body: payload });

      if (error) throw error;

      toast({
        title: "Prediction Complete!",
        description: `Predicted crop: ${data.predicted_crop || 'N/A'}`,
      });
      onPredictionComplete();
      form.reset(); // Reset form

    } catch (error: any) {
      console.error("Prediction error:", error);
      toast({
        title: "Prediction Failed",
        description: error?.message || "Unable to generate prediction. Please try again.",
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6"> {/* Increased spacing */}

            {/* Crop Selection */}
            <FormField
              control={form.control}
              name="crop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Select Crop to Predict *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a crop..." />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optimal Conditions Alert */}
            {selectedCrop && cropConditions[selectedCrop] && (
              <Alert className="bg-primary/5 border-primary/20">
                <AlertDescription className="text-sm text-primary">
                  <strong>Optimal Conditions for {crops.find(c => c.value === selectedCrop)?.label}:</strong> Temp: {cropConditions[selectedCrop].temp},
                  pH: {cropConditions[selectedCrop].ph},
                  Rainfall: {cropConditions[selectedCrop].rainfall}
                </AlertDescription>
              </Alert>
            )}

            {/* Soil Nutrients Section */}
            <div className="space-y-3">
              <FormLabel className="text-base font-semibold">Soil Nutrients (Optional)</FormLabel>
              <div className="grid grid-cols-3 gap-4 p-4 border rounded-md bg-background shadow-sm">
                <FormField
                  control={form.control}
                  name="nitrogen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="nitrogen">Nitrogen (N) kg/ha</FormLabel>
                      <FormControl>
                        <Input id="nitrogen" type="number" step="0.01" placeholder="e.g., 120" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phosphorus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="phosphorus">Phosphorus (P) kg/ha</FormLabel>
                      <FormControl>
                        <Input id="phosphorus" type="number" step="0.01" placeholder="e.g., 60" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="potassium"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="potassium">Potassium (K) kg/ha</FormLabel>
                      <FormControl>
                        <Input id="potassium" type="number" step="0.01" placeholder="e.g., 80" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Environmental Conditions Section */}
            <div className="space-y-3">
              <FormLabel className="text-base font-semibold">Environmental Conditions *</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 p-4 border rounded-md bg-background shadow-sm">
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="temperature" className="flex items-center gap-2"><ThermometerSun className="h-4 w-4 text-orange-500" />Temperature (°C)</FormLabel>
                      <FormControl>
                        <Input id="temperature" type="number" step="0.01" placeholder="e.g., 25.5" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="rainfall"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="rainfall" className="flex items-center gap-2"><Cloud className="h-4 w-4 text-blue-500" />Rainfall (mm)</FormLabel>
                      <FormControl>
                        <Input id="rainfall" type="number" step="0.01" placeholder="e.g., 800" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="fertilizer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="fertilizer">Fertilizer (kg/ha)</FormLabel>
                      <FormControl>
                        <Input id="fertilizer" type="number" step="0.01" placeholder="e.g., 120" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="soil_ph"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="soil_ph" className="flex items-center gap-2"><Wind className="h-4 w-4 text-gray-500" />Soil pH</FormLabel>
                      <FormControl>
                        <Input id="soil_ph" type="number" step="0.01" placeholder="e.g., 6.5" min="0" max="14" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="humidity"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                       <FormLabel htmlFor="humidity" className="flex items-center gap-2"><Droplets className="h-4 w-4 text-teal-500" />Humidity (%)</FormLabel>
                      <FormControl>
                        <Input id="humidity" type="number" step="0.01" placeholder="e.g., 65" min="0" max="100" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-base py-3" // Slightly larger button
              disabled={loading || !form.formState.isValid} // Disable if loading OR form is invalid
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <Sprout className="mr-2 h-5 w-5" />
                  Predict Yield
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
