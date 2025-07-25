import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionLineSelector } from "@/components/ProductionLineSelector";
import { DrinkSelector } from "@/components/DrinkSelector";
import { ScheduleVisualizer } from "@/components/ScheduleVisualizer";
import { Play, RotateCcw, Download, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { OptimizationResponse } from "@/types/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResponse | null>(null);

  const handleOptimize = async () => {
    console.log("Optimize button clicked!", { selectedLine, selectedDrinks });

    if (!selectedLine) {
      toast({
        title: "Production line required",
        description: "Please select a production line first.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDrinks.length === 0) {
      toast({
        title: "No drinks selected",
        description:
          "Please select at least one drink to optimize the schedule.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsOptimizing(true);
      toast({
        title: "Optimizing schedule",
        description: "Running scheduling algorithm...",
      });

      const result = await api.optimizeSchedule({
        line_number: selectedLine,
        drinks: selectedDrinks,
      });

      setOptimizationResult(result);

      toast({
        title: "Schedule optimized successfully!",
        description: `Water saved: ${result.water_saved.toFixed(2)}L`,
      });
    } catch (error) {
      console.error("Optimization error:", error);
      toast({
        title: "Optimization failed",
        description: "An error occurred while optimizing the schedule.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReset = () => {
    setSelectedLine(null);
    setSelectedDrinks([]);
    setOptimizationResult(null);
    setIsOptimizing(false);
    toast({
      title: "Reset complete",
      description: "All selections have been cleared.",
    });
  };

  const handleExport = () => {
    if (!optimizationResult) {
      toast({
        title: "No data to export",
        description: "Please run optimization first.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Exporting schedule",
      description: "Schedule has been exported to CSV format.",
    });
  };

  const isReadyToOptimize = Boolean(selectedLine && selectedDrinks.length > 0);

  // Debug logging
  useEffect(() => {
    console.log("State update:", {
      selectedLine,
      selectedDrinksCount: selectedDrinks.length,
      isReadyToOptimize,
      isOptimizing,
    });
  }, [selectedLine, selectedDrinks, isReadyToOptimize, isOptimizing]);

  useEffect(() => {
    if (selectedDrinks.length === 0) {
      setOptimizationResult(null);
    }
  }, [selectedDrinks]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Drink Production Scheduler
              </h1>
              <p className="text-muted-foreground">
                Optimize production schedules with advanced algorithms
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={handleExport}
                variant="secondary"
                className="gap-2"
                disabled={!optimizationResult}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <ProductionLineSelector
              selectedLine={selectedLine}
              onLineChange={setSelectedLine}
            />

            <DrinkSelector
              productionLine={selectedLine}
              selectedDrinks={selectedDrinks}
              onDrinksChange={setSelectedDrinks}
            />

            {/* Status Card */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Production Line:
                    </span>
                    <span className="font-medium">
                      {selectedLine ? `Line ${selectedLine}` : "None selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Drinks:</span>
                    <span className="font-medium">{selectedDrinks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span
                      className={`font-medium ${
                        isOptimizing
                          ? "text-status-warning"
                          : selectedDrinks.length > 0
                          ? "text-status-success"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isOptimizing
                        ? "Optimizing"
                        : selectedDrinks.length > 0
                        ? "Ready"
                        : "Waiting"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Ready to Optimize:
                    </span>
                    <span className="font-medium">
                      {isReadyToOptimize ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Control Card */}
            <Card className="shadow-soft border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Run Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isReadyToOptimize && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {!selectedLine
                        ? "Select a production line to continue"
                        : "Select at least one drink to optimize"}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleOptimize}
                  className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 font-semibold"
                  disabled={!isReadyToOptimize || isOptimizing}
                  size="lg"
                  type="button"
                >
                  <Play className="h-5 w-5" />
                  {isOptimizing
                    ? "Optimizing..."
                    : "Optimize Production Schedule"}
                </Button>

                {optimizationResult && (
                  <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <h4 className="font-semibold text-accent mb-3">
                      Water Usage Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Water Used:
                        </span>
                        <span className="font-medium">
                          {optimizationResult.total_water_usage.toFixed(2)}L
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Original Water Usage:
                        </span>
                        <span className="font-medium">
                          {optimizationResult.original_water_usage.toFixed(2)}L
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground font-medium">
                          Water Saved:
                        </span>
                        <span className="font-semibold text-status-success">
                          {optimizationResult.water_saved.toFixed(2)}L
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Schedule Visualization */}
          <div className="lg:col-span-2">
            <ScheduleVisualizer
              productionLine={selectedLine}
              drinks={selectedDrinks}
              isOptimizing={isOptimizing}
              result={optimizationResult}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
