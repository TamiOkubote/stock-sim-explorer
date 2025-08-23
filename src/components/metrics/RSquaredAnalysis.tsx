import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { Target, TrendingUp, BarChart2 } from "lucide-react";
import { useState } from "react";

interface RSquaredData {
  symbol: string;
  rSquared: number;
  correlation: number;
  diversification: 'High' | 'Medium' | 'Low';
  benchmarkFit: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  scatterData: { marketReturn: number; stockReturn: number }[];
}

const mockRSquaredData: RSquaredData[] = [
  {
    symbol: "AAPL",
    rSquared: 0.72,
    correlation: 0.85,
    diversification: "Low",
    benchmarkFit: "Good",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 2.8 },
      { marketReturn: -1.5, stockReturn: -1.9 },
      { marketReturn: 3.2, stockReturn: 3.8 },
      { marketReturn: 0.8, stockReturn: 1.2 },
      { marketReturn: -2.1, stockReturn: -2.5 },
      { marketReturn: 1.9, stockReturn: 2.2 },
      { marketReturn: -0.5, stockReturn: -0.8 },
      { marketReturn: 2.8, stockReturn: 3.1 },
    ]
  },
  {
    symbol: "MSFT",
    rSquared: 0.68,
    correlation: 0.82,
    diversification: "Low",
    benchmarkFit: "Good",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 2.3 },
      { marketReturn: -1.5, stockReturn: -1.2 },
      { marketReturn: 3.2, stockReturn: 3.1 },
      { marketReturn: 0.8, stockReturn: 1.1 },
      { marketReturn: -2.1, stockReturn: -1.8 },
      { marketReturn: 1.9, stockReturn: 2.0 },
      { marketReturn: -0.5, stockReturn: -0.3 },
      { marketReturn: 2.8, stockReturn: 2.9 },
    ]
  },
  {
    symbol: "NVDA",
    rSquared: 0.45,
    correlation: 0.67,
    diversification: "Medium",
    benchmarkFit: "Fair",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 4.2 },
      { marketReturn: -1.5, stockReturn: -3.1 },
      { marketReturn: 3.2, stockReturn: 5.8 },
      { marketReturn: 0.8, stockReturn: 0.3 },
      { marketReturn: -2.1, stockReturn: -3.9 },
      { marketReturn: 1.9, stockReturn: 3.1 },
      { marketReturn: -0.5, stockReturn: -1.8 },
      { marketReturn: 2.8, stockReturn: 4.9 },
    ]
  },
];

export const RSquaredAnalysis = () => {
  const [selectedStock, setSelectedStock] = useState(mockRSquaredData[0]);

  const getFitColor = (fit: string) => {
    switch (fit) {
      case 'Poor': return 'text-destructive';
      case 'Fair': return 'text-warning';
      case 'Good': return 'text-success';
      case 'Excellent': return 'text-info';
      default: return 'text-muted-foreground';
    }
  };

  const getDiversificationColor = (div: string) => {
    switch (div) {
      case 'High': return 'text-success';
      case 'Medium': return 'text-warning';
      case 'Low': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRSquaredInterpretation = (rSquared: number) => {
    if (rSquared > 0.8) return "Stock closely follows market movements";
    if (rSquared > 0.6) return "Stock moderately correlates with market";
    if (rSquared > 0.4) return "Stock has some market independence";
    return "Stock moves independently of market";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">R-Squared Analysis</CardTitle>
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Stock Selection */}
            <div className="flex flex-wrap gap-2">
              {mockRSquaredData.map((stock) => (
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

            {/* Main R-Squared Display */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold">
                {(selectedStock.rSquared * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">
                R-Squared vs S&P 500
              </div>
              <Badge variant="outline" className={getFitColor(selectedStock.benchmarkFit)}>
                <Target className="w-3 h-3 mr-1" />
                {selectedStock.benchmarkFit} Fit
              </Badge>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="font-medium">Market Correlation</div>
                <div className="text-muted-foreground">
                  {(selectedStock.correlation * 100).toFixed(0)}%
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Diversification</div>
                <div className={getDiversificationColor(selectedStock.diversification)}>
                  {selectedStock.diversification}
                </div>
              </div>
            </div>

            {/* R-Squared Scale */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Market Explanation</span>
                <span>{(selectedStock.rSquared * 100).toFixed(0)}%</span>
              </div>
              <Progress 
                value={selectedStock.rSquared * 100} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0% (Independent)</span>
                <span>100% (Perfect correlation)</span>
              </div>
            </div>

            {/* Interpretation */}
            <div className="p-3 bg-muted/30 rounded text-sm">
              <div className="font-medium mb-1">What this means:</div>
              <div className="text-muted-foreground">
                {getRSquaredInterpretation(selectedStock.rSquared)}
              </div>
            </div>

            {/* Scatter Plot */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Stock vs Market Returns</div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={selectedStock.scatterData}>
                    <XAxis 
                      type="number"
                      dataKey="marketReturn"
                      tick={false}
                      axisLine={false}
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    />
                    <YAxis 
                      type="number"
                      dataKey="stockReturn"
                      tick={false}
                      axisLine={false}
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    />
                    <ReferenceLine x={0} stroke="hsl(var(--border))" strokeDasharray="2 2" />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="2 2" />
                    <Scatter 
                      dataKey="stockReturn" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.8}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Market Return →</span>
                <span>↑ Stock Return</span>
              </div>
            </div>

            {/* Additional Insights */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-muted/30 rounded">
                <div className="font-medium">Explained Variance</div>
                <div className="text-muted-foreground">
                  {(selectedStock.rSquared * 100).toFixed(0)}% by market
                </div>
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <div className="font-medium">Unique Risk</div>
                <div className="text-muted-foreground">
                  {((1 - selectedStock.rSquared) * 100).toFixed(0)}% stock-specific
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};