import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { supabase } from '@/integrations/supabase/client';
import {
  History, Calendar, Eye, Trash2,
  Download, Search, AlertCircle // Added AlertCircle
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types'; // Import generated types

// Use the generated types for Prediction
type Prediction = Database['public']['Tables']['predictions']['Row'] & {
    // Add any potential client-side computed fields if needed
};

interface PredictionHistoryProps {
  onViewDetails?: (prediction: Prediction) => void;
}

const PredictionHistory: React.FC<PredictionHistoryProps> = ({ onViewDetails }) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [filteredPredictions, setFilteredPredictions] = useState<Prediction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCrop, setFilterCrop] = useState('all');
  const [filterModel, setFilterModel] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Add error state

  const loadPredictionHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Reset error
    try {
      const { data, error: dbError } = await supabase
        .from('predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Add a reasonable limit initially

      if (dbError) throw dbError;

      setPredictions(data || []);
    } catch (err: any) {
      console.error('Error loading predictions:', err);
      setError(err.message || 'Failed to load prediction history.');
      setPredictions([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterPredictions = useCallback(() => {
    let filtered = [...predictions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.predicted_crop?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Crop filter
    if (filterCrop !== 'all') {
      filtered = filtered.filter(p => p.predicted_crop === filterCrop);
    }

    // Model filter
    if (filterModel !== 'all') {
      filtered = filtered.filter(p => p.best_model === filterModel);
    }

    setFilteredPredictions(filtered);
  }, [searchTerm, filterCrop, filterModel, predictions]);

  useEffect(() => {
    loadPredictionHistory();
  }, [loadPredictionHistory]);

  useEffect(() => {
    filterPredictions();
  }, [filterPredictions]); // Re-filter when the function or its dependencies change


  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prediction?')) {
      try {
        const { error: deleteError } = await supabase
          .from('predictions')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        setPredictions(prev => prev.filter(p => p.id !== id));
        // No need to manually call filterPredictions, useEffect will handle it
      } catch (err: any) {
        console.error('Error deleting prediction:', err);
        setError(err.message || 'Failed to delete prediction.'); // Show error
      }
    }
  };

  const handleExport = () => {
    const csvContent = [
        ['ID', 'Date', 'Crop', 'Best Model', 'LR Yield', 'RF Yield', 'Temp', 'Rain', 'Fert', 'pH', 'Humid', 'N', 'P', 'K'],
        ...filteredPredictions.map(p => [
          p.id,
          p.created_at ? new Date(p.created_at).toLocaleString() : 'N/A',
          p.predicted_crop ?? 'N/A',
          p.best_model ?? 'N/A',
          p.predicted_yield_lr?.toFixed(2) ?? 'N/A',
          p.predicted_yield_rf?.toFixed(2) ?? 'N/A',
          p.temperature ?? 'N/A',
          p.rainfall ?? 'N/A',
          p.fertilizer ?? 'N/A',
          p.soil_ph ?? 'N/A',
          p.humidity ?? 'N/A',
          (p as any).nitrogen ?? 'N/A', // Type assertion for optional NPK fields
          (p as any).phosphorus ?? 'N/A',
          (p as any).potassium ?? 'N/A',
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `crop-predictions-${new Date().toISOString().split('T')[0]}.csv`;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       window.URL.revokeObjectURL(url);
  };

  // ... (getCropIcon function - same as before) ...
    const getCropIcon = (crop: string | null): string => {
        if (!crop) return '🌱'; // Default icon
        const icons: { [key: string]: string } = {
          rice: '🌾', wheat: '🌾', maize: '🌽', barley: '🌾', millet: '🌾',
          sorghum: '🌾', cotton: '🌿', jute: '🌱', sugarcane: '🎋', coffee: '☕',
          tea: '🍵', tobacco: '🚬', soybean: '🫘', groundnut: '🥜', chickpea: '🫘',
          lentil: '🫘', potato: '🥔', tomato: '🍅', onion: '🧅', cabbage: '🥬',
          carrot: '🥕', pepper: '🌶️', banana: '🍌', mango: '🥭', apple: '🍎',
          orange: '🍊', grapes: '🍇', coconut: '🥥', rubber: '🌳'
        };
        return icons[crop.toLowerCase()] || '🌱';
    };


  // Use Set to get unique values, handle potential nulls
  const uniqueCrops = [...new Set(predictions.map(p => p.predicted_crop).filter(Boolean))] as string[];
  const uniqueModels = [...new Set(predictions.map(p => p.best_model).filter(Boolean))] as string[];

  // Calculate stats safely
    const maxYield = predictions.length > 0 ? Math.max(
        ...predictions.map(p => Math.max(p.predicted_yield_lr ?? 0, p.predicted_yield_rf ?? 0))
    ) : 0;


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          {/* ... Title and description ... */}
            <h2 className="text-3xl font-bold text-primary flex items-center gap-2">
                <History className="h-8 w-8" />
                Prediction History
            </h2>
            <p className="text-muted-foreground mt-1">View and manage your past predictions</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2 w-full sm:w-auto" disabled={filteredPredictions.length === 0}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards - Add Skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
              { label: 'Total Predictions', value: isLoading ? null : predictions.length, color: 'text-blue-600' },
              { label: 'Crops Analyzed', value: isLoading ? null : uniqueCrops.length, color: 'text-green-600' },
              { label: 'Best Yield (kg/ha)', value: isLoading ? null : maxYield.toFixed(1), color: 'text-purple-600' },
              { label: 'Models Used', value: isLoading ? null : uniqueModels.length, color: 'text-orange-600' }
          ].map((stat, index) => (
              <Card key={index}>
                  <CardContent className="pt-6">
                      <div className="text-center">
                          {isLoading ? (
                              <>
                                  <Skeleton className="h-8 w-16 mx-auto mb-1" />
                                  <Skeleton className="h-4 w-24 mx-auto" />
                              </>
                          ) : (
                              <>
                                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                              </>
                          )}
                      </div>
                  </CardContent>
              </Card>
          ))}
      </div>


      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
             {/* ... Search Input, Crop Select, Model Select ... */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Search crops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              <Select value={filterCrop} onValueChange={setFilterCrop} disabled={isLoading || uniqueCrops.length === 0}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by crop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crops</SelectItem>
                  {uniqueCrops.map(crop => (
                    <SelectItem key={crop} value={crop}>
                      <span className="flex items-center gap-2">
                        <span>{getCropIcon(crop)}</span>
                        <span>{crop.charAt(0).toUpperCase() + crop.slice(1)}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterModel} onValueChange={setFilterModel} disabled={isLoading || uniqueModels.length === 0}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {uniqueModels.map(model => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </CardContent>
      </Card>

      {/* Prediction List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Predictions</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : error ? "Error loading data" : `Showing ${filteredPredictions.length} of ${predictions.length} predictions`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="space-y-4 h-[600px] pr-4 overflow-hidden"> {/* Added overflow hidden */}
               {[...Array(5)].map((_, i) => ( // Show 5 skeletons
                 <div key={i} className="flex items-start space-x-4 p-4 border rounded-md bg-card">
                   <Skeleton className="h-10 w-10 rounded-lg" /> {/* Adjusted shape */}
                   <div className="space-y-2 flex-1">
                     <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-5 w-1/4" />
                     </div>
                     <div className="grid grid-cols-4 gap-3">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                     </div>
                     <Skeleton className="h-3 w-1/2 mt-1" />
                   </div>
                   <div className="flex gap-2">
                     <Skeleton className="h-8 w-16 rounded-md" />
                     <Skeleton className="h-8 w-8 rounded-md" />
                   </div>
                 </div>
               ))}
             </div>
           ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 text-destructive border border-destructive/30 rounded-md bg-destructive/5 p-6">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium mb-1">Loading Failed</p>
                <p className="text-sm text-center mb-4">{error}</p>
                <Button variant="destructive" size="sm" onClick={loadPredictionHistory}>
                  Retry Loading
                </Button>
              </div>
           ) : filteredPredictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed rounded-md p-6">
              <History className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No predictions found</p>
              <p className="text-sm text-center">
                {predictions.length > 0 ? "Try adjusting filters." : "Make a prediction first."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4 -mr-4"> {/* Offset padding for scrollbar */}
              <div className="space-y-4">
                {filteredPredictions.map((prediction) => (
                  <Card key={prediction.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start gap-4">
                      {/* Crop Icon */}
                      <div className="text-4xl mt-1 hidden sm:block">{getCropIcon(prediction.predicted_crop)}</div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                           <div className="text-4xl mt-1 sm:hidden mr-2">{getCropIcon(prediction.predicted_crop)}</div> {/* Icon for mobile */}
                           <h3 className="text-lg font-semibold text-card-foreground">
                            {prediction.predicted_crop ? prediction.predicted_crop.charAt(0).toUpperCase() + prediction.predicted_crop.slice(1) : 'Unknown Crop'}
                          </h3>
                          <Badge variant={prediction.best_model === "Random Forest" ? "default" : "secondary"}>
                            {prediction.best_model ?? 'N/A'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-sm mb-3">
                           {/* Simplified yield display */}
                            <div>
                                <p className="text-xs text-muted-foreground">Best Yield</p>
                                <p className="font-semibold text-primary">
                                    {Math.max(prediction.predicted_yield_lr ?? 0, prediction.predicted_yield_rf ?? 0).toFixed(1)} kg/ha
                                </p>
                            </div>
                           {/* Add other key metrics if desired */}
                            <div>
                                <p className="text-xs text-muted-foreground">Temp / Humid</p>
                                <p className="font-semibold">{prediction.temperature ?? 'N/A'}°C / {prediction.humidity ?? 'N/A'}%</p>
                            </div>
                             <div>
                                <p className="text-xs text-muted-foreground">Rain / pH</p>
                                <p className="font-semibold">{prediction.rainfall ?? 'N/A'}mm / {prediction.soil_ph ?? 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {prediction.created_at ? new Date(prediction.created_at).toLocaleString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'Date unknown'}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-2 sm:mt-0 sm:ml-auto flex-shrink-0">
                          {onViewDetails && ( // Conditionally render View button
                           <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onViewDetails?.(prediction)}
                                className="gap-1"
                                aria-label={`View details for prediction ${prediction.id}`}
                            >
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">View</span>
                            </Button>
                          )}
                        <Button
                          size="sm"
                          variant="ghost" // Use ghost for less emphasis
                          onClick={() => handleDelete(prediction.id)}
                          className="gap-1 text-destructive hover:bg-destructive/10"
                           aria-label={`Delete prediction ${prediction.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                           <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionHistory;
