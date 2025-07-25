import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

interface ProductionLineSelectorProps {
  selectedLine: number | null;
  onLineChange: (line: number | null) => void;
}

export const ProductionLineSelector = ({
  selectedLine,
  onLineChange,
}: ProductionLineSelectorProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["production-lines"],
    queryFn: api.getProductionLines,
  });

  const handleChange = (value: string) => {
    if (value === "") {
      onLineChange(null);
      return;
    }
    const num = Number(value);
    onLineChange(Number.isNaN(num) ? null : num);
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-xl">Select Production Line</CardTitle>
        <CardDescription>
          Choose the production line for scheduling optimization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={selectedLine?.toString() ?? ""}
          onValueChange={handleChange}
          disabled={isLoading || !!error}
        >
          <SelectTrigger className="w-full h-12">
            <SelectValue
              placeholder={
                isLoading
                  ? "Loading..."
                  : error
                  ? "Error"
                  : "Choose a production line..."
              }
            />
          </SelectTrigger>
          <SelectContent className="bg-card border shadow-medium max-h-60 overflow-y-auto">
            {data?.production_lines.map((lineNumber) => (
              <SelectItem
                key={lineNumber}
                value={lineNumber.toString()}
                className="py-3"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    Production Line {lineNumber}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};
