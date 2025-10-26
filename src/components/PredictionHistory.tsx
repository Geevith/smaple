import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History, Calendar, TrendingUp, Eye, Trash2,
  Download, Filter, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    loadPredictionHistory();
  }, []);

  useEffect(() => {
    filterPredictions();
  }, [searchTerm, filterCrop, filterModel, predictions]);

  const loadPredictionHistory = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPredictions(data || []);
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPredictions = () => {
    let filtered = [...predictions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.predicted_crop.toLowerCase().includes(searchTerm.toLowerCase())
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
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this prediction?')) {
      try {
        const { error } = await supabase
          .from('predictions')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setPredictions(predictions.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting prediction:', error);
      }
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Crop', 'Best Model', 'LR Yield', 'RF Yield', 'Temperature', 'Rainfall', 'Fertilizer', 'Soil pH', 'Humidity'],
      ...filteredPredictions.map(p => [
        new Date(p.created_at).toLocaleDateString(),
        p.predicted_crop,
        p.best_model,
        p.predicted_yield_lr.toFixed(2),
        p.predicted_yield_rf.toFixed(2),
        p.temperature,
        p.rainfall,
        p.fertilizer,
        p.soil_ph,
        p.humidity
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crop-predictions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCropIcon = (crop: string) => {
    const icons: { [key: string]: string } = {
      rice: '🌾', wheat: '🌾', maize: '🌽', barley: '🌾', millet: '🌾',
      sorghum: '🌾', cotton: '🌿', jute: '🌱', sugarcane: '🎋', coffee: '☕',
      tea: '🍵', tobacco: '🚬', soybean: '🫘', groundnut: '🥜', chickpea: '🫘',
      lentil: '🫘', potato: '🥔', tomato: '🍅', onion: '🧅', cabbage: '🥬',
      carrot: '🥕', pepper: '🌶️', banana: '🍌', mango: '🥭', apple: '🍎',
      orange: '🍊', grapes: '🍇', coconut: '🥥', rubber: '🌳'
    };
    return icons[crop] || '🌱';
  };

  const uniqueCrops = [...new Set(predictions.map(p => p.predicted_crop))];
  const uniqueModels = [...new Set(predictions.map(p => p.best_model))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary flex items-center gap-2">
            <History className="h-8 w-8" />
            Prediction History
          </h2>
          <p className="text-gray-600 mt-1">View and manage your past predictions</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{predictions.length}</p>
              <p className="text-sm text-gray-600 mt-1">Total Predictions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{uniqueCrops.length}</p>
              <p className="text-sm text-gray-600 mt-1">Crops Analyzed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {predictions.length > 0
                  ? Math.max(...predictions.map(p => Math.max(p.predicted_yield_lr, p.predicted_yield_rf))).toFixed(1)
                  : 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Best Yield (kg/ha)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {uniqueModels.length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Models Used</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search crops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCrop} onValueChange={setFilterCrop}>
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
            <Select value={filterModel} onValueChange={setFilterModel}>
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
            Showing {filteredPredictions.length} of {predictions.length} predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading predictions...</p>
              </div>
            </div>
          ) : filteredPredictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <History className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No predictions found</p>
              <p className="text-sm">Try adjusting your filters or make a new prediction</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {filteredPredictions.map((prediction) => (
                  <Card key={prediction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          {/* Crop Icon */}
                          <div className="text-4xl">{getCropIcon(prediction.predicted_crop)}</div>

                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold text-gray-800">
                                {prediction.predicted_crop.charAt(0).toUpperCase() + prediction.predicted_crop.slice(1)}
                              </h3>
                              <Badge variant="default">
                                {prediction.best_model}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500">LR Yield</p>
                                <p className="font-semibold text-blue-600">
                                  {prediction.predicted_yield_lr.toFixed(1)} kg/ha
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">RF Yield</p>
                                <p className="font-semibold text-green-600">
                                  {prediction.predicted_yield_rf.toFixed(1)} kg/ha
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Best Yield</p>
                                <p className="font-semibold text-purple-600">
                                  {Math.max(prediction.predicted_yield_lr, prediction.predicted_yield_rf).toFixed(1)} kg/ha
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Temperature</p>
                                <p className="font-semibold">
                                  {prediction.temperature}°C
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(prediction.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewDetails?.(prediction)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(prediction.id)}
                            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
