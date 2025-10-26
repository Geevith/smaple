-- Example SQL for Migration (Add to a new migration file)

-- Add NPK columns to dataset
ALTER TABLE public.crops_dataset
ADD COLUMN nitrogen DECIMAL(7,2),
ADD COLUMN phosphorus DECIMAL(7,2),
ADD COLUMN potassium DECIMAL(7,2);

-- Add engineered feature columns to dataset (optional, depends if predict function refetches)
ALTER TABLE public.crops_dataset
ADD COLUMN temp_rainfall_interaction DECIMAL(10,2),
ADD COLUMN ph_fertilizer_interaction DECIMAL(8,2),
ADD COLUMN temp_squared DECIMAL(8,2),
ADD COLUMN npk_ratio DECIMAL(6,3);
-- Add more engineered features as needed...

-- Add feature_importances column to predictions table
ALTER TABLE public.predictions
ADD COLUMN feature_importances TEXT; -- Store JSON string

-- Add columns to model_metrics table
ALTER TABLE public.model_metrics
ADD COLUMN evaluation_method TEXT,
ADD COLUMN tuned_parameters TEXT; -- Store JSON string or similar

-- Update RLS policies if necessary to allow access to new columns
-- Example: Drop and recreate policy (ensure this matches your security needs)
DROP POLICY "Allow public read access to crops dataset" ON public.crops_dataset;
CREATE POLICY "Allow public read access to crops dataset"
ON public.crops_dataset
FOR SELECT USING (true);
-- Repeat for insert policies and other tables...
