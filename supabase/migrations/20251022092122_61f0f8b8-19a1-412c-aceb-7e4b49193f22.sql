-- Create crops dataset table for training data
CREATE TABLE public.crops_dataset (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  temperature DECIMAL(5,2) NOT NULL,
  rainfall DECIMAL(7,2) NOT NULL,
  fertilizer DECIMAL(7,2) NOT NULL,
  soil_ph DECIMAL(4,2) NOT NULL,
  humidity DECIMAL(5,2) NOT NULL,
  crop TEXT NOT NULL,
  yield DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create predictions table to store user predictions
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  temperature DECIMAL(5,2) NOT NULL,
  rainfall DECIMAL(7,2) NOT NULL,
  fertilizer DECIMAL(7,2) NOT NULL,
  soil_ph DECIMAL(4,2) NOT NULL,
  humidity DECIMAL(5,2) NOT NULL,
  predicted_crop TEXT NOT NULL,
  predicted_yield_lr DECIMAL(10,2) NOT NULL,
  predicted_yield_rf DECIMAL(10,2) NOT NULL,
  best_model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create model metrics table to store performance metrics
CREATE TABLE public.model_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  r2_score DECIMAL(6,4) NOT NULL,
  mae DECIMAL(10,4) NOT NULL,
  rmse DECIMAL(10,4) NOT NULL,
  training_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (making tables public for this use case)
ALTER TABLE public.crops_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication needed for this app)
CREATE POLICY "Allow public read access to crops dataset" 
ON public.crops_dataset 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to crops dataset" 
ON public.crops_dataset 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read access to predictions" 
ON public.predictions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to predictions" 
ON public.predictions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read access to model metrics" 
ON public.model_metrics 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to model metrics" 
ON public.model_metrics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to model metrics" 
ON public.model_metrics 
FOR UPDATE 
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_crops_dataset_crop ON public.crops_dataset(crop);
CREATE INDEX idx_predictions_created_at ON public.predictions(created_at DESC);
CREATE INDEX idx_model_metrics_model_name ON public.model_metrics(model_name);