import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useState, useEffect } from "react";

interface StockData {
  symbol: string;
  stdDev: number;
  risk: 'Low' | 'Medium' | 'High';
  returns: number[];
}

const mockStockData: StockData[] = [
  { symbol: "AAPL", stdDev: 0.245, risk: "Medium", returns: [0.12, -0.05, 0.18, 0.03, -0.08] },
  { symbol: "MSFT", stdDev: 0.198, risk: "Low", returns: [0.15, 0.02, -0.03, 0.09, 0.06] },
  { symbol: "NVDA", stdDev: 0.421, risk: "High", returns: [0.35, -0.15, 0.28, -0.12, 0.19] },
  { symbol: "GOOGL", stdDev: 0.287, risk: "Medium", returns: [0.08, 0.14, -0.06, 0.11, -0.02] },
  { symbol: "AMZN", stdDev: 0.334, risk: "High", returns: [-0.09, 0.22, 0.04, -0.11, 0.16] }
];

export const StandardDeviation = () => {
  const [selectedStock, setSelectedStock] = useState(mockStockData[0]);
  const [isCalculating, setIsCalculating] = useState(false);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-success';
      case 'Medium': return 'text-warning';
      case 'High': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskProgress = (stdDev: number) => {
    return Math.min((stdDev / 0.5) * 100, 100);
  };

  const recalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      // Simulate recalculation with slight variations
      const updatedData = mockStockData.map(stock => ({
        ...stock,
        stdDev: stock.stdDev + (Math.random() - 0.5) * 0.02
      }));
      setSelectedStock(updatedData.find(s => s.symbol === selectedStock.symbol) || updatedData[0]);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Standard Deviation Analysis</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Stock Selection */}
            <div className="flex flex-wrap gap-2">
              {mockStockData.map((stock) => (
                <Badge
                  key={stock.symbol}
                  variant={selectedStock.symbol === stock.symbol ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedStock(stock)}
                >
                  {stock.symbol}
                </Badge>
              ))}
            </div>

            {/* Main Metric Display */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold">
                {(selectedStock.stdDev * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Annualized Standard Deviation
              </div>
              <Badge variant="outline" className={getRiskColor(selectedStock.risk)}>
                {selectedStock.risk} Risk
              </Badge>
            </div>

            {/* Risk Visualization */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Risk Level</span>
                <span>{getRiskProgress(selectedStock.stdDev).toFixed(0)}%</span>
              </div>
              <Progress 
                value={getRiskProgress(selectedStock.stdDev)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low Risk</span>
                <span>High Risk</span>
              </div>
            </div>

            {/* Recent Returns */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Recent Returns Distribution</div>
              <div className="flex space-x-1">
                {selectedStock.returns.map((ret, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 h-8 rounded text-xs flex items-center justify-center ${
                      ret >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                    }`}
                  >
                    {ret >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={recalculate}
              disabled={isCalculating}
              className="w-full py-2 text-sm bg-primary/10 hover:bg-primary/20 rounded transition-colors disabled:opacity-50"
            >
              {isCalculating ? 'Recalculating...' : 'Recalculate'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};