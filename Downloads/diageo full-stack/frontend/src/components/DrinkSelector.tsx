import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Plus, ChevronDown, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

interface DrinkSelectorProps {
  productionLine: number | null;
  selectedDrinks: string[];
  onDrinksChange: (drinks: string[]) => void;
}

export const DrinkSelector = ({
  productionLine,
  selectedDrinks,
  onDrinksChange,
}: DrinkSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["drinks", productionLine],
    queryFn: () =>
      productionLine
        ? api.getDrinks(productionLine)
        : Promise.resolve({ drinks: [] }),
    enabled: !!productionLine,
  });

  const availableDrinks = data?.drinks ?? [];

  const handleDrinkToggle = (drink: string) => {
    if (selectedDrinks.includes(drink)) {
      onDrinksChange(selectedDrinks.filter((d) => d !== drink));
    } else {
      onDrinksChange([...selectedDrinks, drink]);
    }
  };

  const handleRemoveDrink = (drink: string) => {
    onDrinksChange(selectedDrinks.filter((d) => d !== drink));
  };

  const handleSelectAll = () => {
    onDrinksChange(availableDrinks);
    setIsOpen(false);
  };

  const handleClearAll = () => {
    onDrinksChange([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Mock file processing
      toast({
        title: "File uploaded successfully",
        description: `Processing ${file.name}...`,
      });

      // Simulate parsing drinks from file
      setTimeout(() => {
        const mockDrinks = [
          "Custom Drink A",
          "Custom Drink B",
          "Custom Drink C",
        ];
        onDrinksChange([...selectedDrinks, ...mockDrinks]);
        toast({
          title: "Drinks imported",
          description: `Added ${mockDrinks.length} drinks from file`,
        });
      }, 1000);
    }
  };

  const getDisplayText = () => {
    if (!productionLine) return "Select production line first";
    if (isLoading) return "Loading...";
    if (error) return "Error loading drinks";
    if (selectedDrinks.length === 0) return "Select drinks...";
    if (selectedDrinks.length === 1) return selectedDrinks[0];
    return `${selectedDrinks.length} drinks selected`;
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-xl">Select Drinks</CardTitle>
        <CardDescription>
          Choose drinks from the dropdown or upload a file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Multi-Select Dropdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Select from available drinks:</h4>

          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                className="w-full justify-between"
                disabled={!productionLine || isLoading || !!error}
              >
                <span className="truncate">{getDisplayText()}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <div className="max-h-60 overflow-y-auto">
                {/* Header with actions */}
                <div className="flex items-center justify-between p-2 border-b">
                  <div className="text-sm font-medium">
                    {availableDrinks.length} drinks available
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={
                        selectedDrinks.length === availableDrinks.length
                      }
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      disabled={selectedDrinks.length === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Drinks list */}
                <div className="p-1">
                  {availableDrinks.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No drinks available
                    </div>
                  ) : (
                    availableDrinks.map((drink) => (
                      <div
                        key={drink}
                        className={cn(
                          "flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                          selectedDrinks.includes(drink) && "bg-accent"
                        )}
                        onClick={() => handleDrinkToggle(drink)}
                      >
                        <div className="flex h-4 w-4 items-center justify-center">
                          {selectedDrinks.includes(drink) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                        <span className="flex-1 truncate">{drink}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Or upload drinks file:</h4>
          <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
            <label className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload drinks list
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Selected Drinks */}
        {selectedDrinks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                Selected drinks ({selectedDrinks.length}):
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selectedDrinks.map((drink) => (
                <Badge key={drink} variant="secondary" className="py-1 px-3">
                  <span className="max-w-32 truncate">{drink}</span>
                  <button
                    onClick={() => handleRemoveDrink(drink)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
