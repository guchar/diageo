import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, AlertCircle, Play } from "lucide-react";
import type { OptimizationResponse, TransitionInfo } from "@/types/api";

interface ScheduleVisualizerProps {
  productionLine: number | null;
  drinks: string[];
  isOptimizing: boolean;
  result?: OptimizationResponse | null;
}

interface ScheduleItem {
  id: string;
  drink: string;
  startTime: string;
  endTime: string;
  duration: number;
  transitionInfo?: TransitionInfo;
}

const generateScheduleFromResult = (
  result: OptimizationResponse
): ScheduleItem[] => {
  const baseTime = new Date();
  baseTime.setHours(8, 0, 0, 0); // Start at 8 AM

  return result.optimal_path.map((drink, index) => {
    const startTime = new Date(
      baseTime.getTime() + index * 90 * 60000 // 1.5 hours per step
    );
    const endTime = new Date(startTime.getTime() + 60 * 60000); // 1 hour production time

    // Get transition info for this step (if not the last drink)
    const transitionInfo =
      index < result.transitions.length ? result.transitions[index] : undefined;

    return {
      id: `schedule-${index}`,
      drink: drink,
      startTime: startTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      endTime: endTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      duration: 60, // Production time
      transitionInfo: transitionInfo,
    };
  });
};

export const ScheduleVisualizer = ({
  productionLine,
  drinks,
  isOptimizing,
  result,
}: ScheduleVisualizerProps) => {
  // Only show schedule if we have optimization results
  const hasResults =
    result && result.optimal_path && result.optimal_path.length > 0;
  let schedule: ScheduleItem[] = [];

  if (hasResults) {
    schedule = generateScheduleFromResult(result);
  }

  const totalDuration = schedule.reduce(
    (acc, item) => acc + item.duration + 30, // 30 min average cleaning time
    0
  );

  // Show empty state when no drinks are selected
  if (drinks.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Production Schedule</CardTitle>
          <CardDescription>
            Select drinks to generate an optimized schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No drinks selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show waiting state when drinks are selected but optimization hasn't run
  if (!hasResults && !isOptimizing) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Production Schedule</CardTitle>
          <CardDescription>
            Ready to optimize schedule for{" "}
            {productionLine ? `Line ${productionLine}` : "-"} with{" "}
            {drinks.length} drinks
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-4">
            <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Ready to Optimize</p>
            <p className="text-sm">
              Click "Optimize Production Schedule" to generate the optimal
              sequence
            </p>
            <div className="mt-4 text-xs">
              <p>Selected drinks: {drinks.join(", ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show optimizing state
  if (isOptimizing) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            Production Schedule
            <Badge variant="secondary" className="animate-pulse">
              Optimizing...
            </Badge>
          </CardTitle>
          <CardDescription>
            Computing optimal schedule for Line {productionLine} with{" "}
            {drinks.length} drinks
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Optimizing Schedule...</p>
            <p className="text-sm">This may take a few seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show actual optimized schedule
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          Production Schedule
          <Badge variant="default" className="bg-green-600">
            Optimized
          </Badge>
        </CardTitle>
        <CardDescription>
          Optimized schedule for Line {productionLine} • Total time:{" "}
          {Math.floor(totalDuration / 60)}h {totalDuration % 60}m • Water saved:{" "}
          {result?.water_saved.toFixed(2)}L
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedule.map((item, index) => (
            <div key={item.id} className="space-y-3">
              <div className="p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{item.drink}</h4>
                  </div>
                </div>
              </div>

              {/* CIP Cleaning Information between drinks */}
              {item.transitionInfo && (
                <div className="ml-8 p-3 bg-accent/10 rounded-md border-l-4 border-accent/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-accent" />
                      <span className="font-medium text-accent">
                        CIP Cleaning: {item.transitionInfo.cleaning_type}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.transitionInfo.water_usage.toFixed(2)}L water
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
          <h4 className="font-medium text-accent mb-2">Schedule Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total drinks:</span>
              <span className="ml-2 font-medium">{drinks.length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
