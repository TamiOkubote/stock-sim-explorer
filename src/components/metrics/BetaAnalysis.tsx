import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

interface BetaData {
  symbol: string;
  beta: number;
  correlation: number;
  volatility: 'Less' | 'Similar' | 'More';
  marketData: { period: number; stock: number; market: number }[];
}

const mockBetaData: BetaData[] = [
  { 
    symbol: "LLY", 
    beta: 0.92, 
    correlation: 0.74, 
    volatility: "Less",
    marketData: [
      { period: 1, stock: 1.6, market: 1.8 },
      { period: 2, stock: -0.8, market: -0.9 },
      { period: 3, stock: 1.9, market: 2.1 },
      { period: 4, stock: 1.1, market: 1.2 },
      { period: 5, stock: -1.3, market: -1.4 },
    ]
  },
  { 
    symbol: "META", 
    beta: 1.23, 
    correlation: 0.68, 
    volatility: "More",
    marketData: [
      { period: 1, stock: 2.2, market: 1.8 },
      { period: 2, stock: -1.1, market: -0.9 },
      { period: 3, stock: 2.6, market: 2.1 },
      { period: 4, stock: 1.5, market: 1.2 },
      { period: 5, stock: -1.7, market: -1.4 },
    ]
  },
  { 
    symbol: "TSLA", 
    beta: 2.14, 
    correlation: 0.65, 
    volatility: "More",
    marketData: [
      { period: 1, stock: 3.8, market: 1.8 },
      { period: 2, stock: -1.9, market: -0.9 },
      { period: 3, stock: 4.5, market: 2.1 },
      { period: 4, stock: 2.6, market: 1.2 },
      { period: 5, stock: -3.0, market: -1.4 },
    ]
  },
  { 
    symbol: "XOM", 
    beta: 1.08, 
    correlation: 0.79, 
    volatility: "Similar",
    marketData: [
      { period: 1, stock: 1.9, market: 1.8 },
      { period: 2, stock: -1.0, market: -0.9 },
      { period: 3, stock: 2.3, market: 2.1 },
      { period: 4, stock: 1.3, market: 1.2 },
      { period: 5, stock: -1.5, market: -1.4 },
    ]
  },
  { 
    symbol: "UNH", 
    beta: 0.76, 
    correlation: 0.81, 
    volatility: "Less",
    marketData: [
      { period: 1, stock: 1.4, market: 1.8 },
      { period: 2, stock: -0.7, market: -0.9 },
      { period: 3, stock: 1.6, market: 2.1 },
      { period: 4, stock: 0.9, market: 1.2 },
      { period: 5, stock: -1.1, market: -1.4 },
    ]
  },
  { 
    symbol: "JPM", 
    beta: 1.34, 
    correlation: 0.83, 
    volatility: "More",
    marketData: [
      { period: 1, stock: 2.4, market: 1.8 },
      { period: 2, stock: -1.2, market: -0.9 },
      { period: 3, stock: 2.8, market: 2.1 },
      { period: 4, stock: 1.6, market: 1.2 },
      { period: 5, stock: -1.9, market: -1.4 },
    ]
  },
  { 
    symbol: "V", 
    beta: 0.94, 
    correlation: 0.77, 
    volatility: "Less",
    marketData: [
      { period: 1, stock: 1.7, market: 1.8 },
      { period: 2, stock: -0.8, market: -0.9 },
      { period: 3, stock: 2.0, market: 2.1 },
      { period: 4, stock: 1.1, market: 1.2 },
      { period: 5, stock: -1.3, market: -1.4 },
    ]
  },
  { 
    symbol: "BRK.B", 
    beta: 0.82, 
    correlation: 0.85, 
    volatility: "Less",
    marketData: [
      { period: 1, stock: 1.5, market: 1.8 },
      { period: 2, stock: -0.7, market: -0.9 },
      { period: 3, stock: 1.7, market: 2.1 },
      { period: 4, stock: 1.0, market: 1.2 },
      { period: 5, stock: -1.1, market: -1.4 },
    ]
  },
  { 
    symbol: "PG", 
    beta: 0.61, 
    correlation: 0.72, 
    volatility: "Less",
    marketData: [
      { period: 1, stock: 1.1, market: 1.8 },
      { period: 2, stock: -0.5, market: -0.9 },
      { period: 3, stock: 1.3, market: 2.1 },
      { period: 4, stock: 0.7, market: 1.2 },
      { period: 5, stock: -0.9, market: -1.4 },
    ]
  },
  { 
    symbol: "JNJ", 
    beta: 0.67, 
    correlation: 0.69, 
    volatility: "Less",
    marketData: [
      { period: 1, stock: 1.2, market: 1.8 },
      { period: 2, stock: -0.6, market: -0.9 },
      { period: 3, stock: 1.4, market: 2.1 },
      { period: 4, stock: 0.8, market: 1.2 },
      { period: 5, stock: -0.9, market: -1.4 },
    ]
  },
];

export const BetaAnalysis = () => {
  const [selectedStock, setSelectedStock] = useState(mockBetaData[0]);
  const [isCalculating, setIsCalculating] = useState(false);

  const getBetaInterpretation = (beta: number) => {
    if (beta < 0.8) return { label: "Defensive", color: "text-info" };
    if (beta < 1.2) return { label: "Market", color: "text-warning" };
    return { label: "Aggressive", color: "text-destructive" };
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'Less': return 'text-success';
      case 'Similar': return 'text-warning';
      case 'More': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const interpretation = getBetaInterpretation(selectedStock.beta);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Beta Analysis</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Stock Selection */}
            <div className="flex flex-wrap gap-2">
              {mockBetaData.map((stock) => (
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

            {/* Main Beta Display */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold">
                {selectedStock.beta.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Beta Coefficient vs S&P 500
              </div>
              <Badge variant="outline" className={interpretation.color}>
                {interpretation.label}
              </Badge>
            </div>

            {/* Beta Interpretation */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="font-medium">Market Sensitivity</div>
                <div className="text-muted-foreground">
                  {selectedStock.beta > 1 ? 'More volatile' : selectedStock.beta < 1 ? 'Less volatile' : 'Similar volatility'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Correlation</div>
                <div className="text-muted-foreground">
                  {(selectedStock.correlation * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Beta Visualization */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Beta Range</span>
                <span>{selectedStock.beta > 1 ? 'High' : 'Low'} Risk</span>
              </div>
              <Progress 
                value={Math.min(selectedStock.beta / 2 * 100, 100)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.0 (No correlation)</span>
                <span>2.0+ (High correlation)</span>
              </div>
            </div>

            {/* Stock vs Market Chart */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Stock vs Market Movement</div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedStock.marketData}>
                    <XAxis 
                      dataKey="period" 
                      tick={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={false}
                      axisLine={false}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="2 2" />
                    <Line 
                      type="monotone" 
                      dataKey="market" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={1}
                      dot={false}
                      name="Market"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="stock" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                      name="Stock"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-0.5 bg-primary"></div>
                  <span>Stock</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-0.5 bg-muted-foreground"></div>
                  <span>Market</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};