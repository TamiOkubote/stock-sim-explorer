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
    symbol: "LLY",
    rSquared: 0.59,
    correlation: 0.77,
    diversification: "Medium",
    benchmarkFit: "Good",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 1.9 },
      { marketReturn: -1.5, stockReturn: -1.2 },
      { marketReturn: 3.2, stockReturn: 2.9 },
      { marketReturn: 0.8, stockReturn: 1.1 },
      { marketReturn: -2.1, stockReturn: -1.9 },
      { marketReturn: 1.9, stockReturn: 2.1 },
      { marketReturn: -0.5, stockReturn: -0.3 },
      { marketReturn: 2.8, stockReturn: 2.6 },
    ]
  },
  {
    symbol: "META",
    rSquared: 0.52,
    correlation: 0.72,
    diversification: "Medium",
    benchmarkFit: "Fair",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 2.8 },
      { marketReturn: -1.5, stockReturn: -2.1 },
      { marketReturn: 3.2, stockReturn: 4.1 },
      { marketReturn: 0.8, stockReturn: 0.6 },
      { marketReturn: -2.1, stockReturn: -2.8 },
      { marketReturn: 1.9, stockReturn: 2.3 },
      { marketReturn: -0.5, stockReturn: -1.2 },
      { marketReturn: 2.8, stockReturn: 3.6 },
    ]
  },
  {
    symbol: "TSLA",
    rSquared: 0.41,
    correlation: 0.64,
    diversification: "High",
    benchmarkFit: "Fair",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 4.5 },
      { marketReturn: -1.5, stockReturn: -3.2 },
      { marketReturn: 3.2, stockReturn: 6.8 },
      { marketReturn: 0.8, stockReturn: 0.2 },
      { marketReturn: -2.1, stockReturn: -4.5 },
      { marketReturn: 1.9, stockReturn: 3.8 },
      { marketReturn: -0.5, stockReturn: -2.1 },
      { marketReturn: 2.8, stockReturn: 5.9 },
    ]
  },
  {
    symbol: "XOM",
    rSquared: 0.74,
    correlation: 0.86,
    diversification: "Low",
    benchmarkFit: "Good",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 2.3 },
      { marketReturn: -1.5, stockReturn: -1.6 },
      { marketReturn: 3.2, stockReturn: 3.4 },
      { marketReturn: 0.8, stockReturn: 0.9 },
      { marketReturn: -2.1, stockReturn: -2.3 },
      { marketReturn: 1.9, stockReturn: 2.0 },
      { marketReturn: -0.5, stockReturn: -0.6 },
      { marketReturn: 2.8, stockReturn: 3.0 },
    ]
  },
  {
    symbol: "UNH",
    rSquared: 0.71,
    correlation: 0.84,
    diversification: "Low",
    benchmarkFit: "Good",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 1.8 },
      { marketReturn: -1.5, stockReturn: -1.3 },
      { marketReturn: 3.2, stockReturn: 2.7 },
      { marketReturn: 0.8, stockReturn: 0.7 },
      { marketReturn: -2.1, stockReturn: -1.8 },
      { marketReturn: 1.9, stockReturn: 1.6 },
      { marketReturn: -0.5, stockReturn: -0.4 },
      { marketReturn: 2.8, stockReturn: 2.4 },
    ]
  },
  {
    symbol: "JPM",
    rSquared: 0.79,
    correlation: 0.89,
    diversification: "Low",
    benchmarkFit: "Excellent",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 2.4 },
      { marketReturn: -1.5, stockReturn: -1.7 },
      { marketReturn: 3.2, stockReturn: 3.6 },
      { marketReturn: 0.8, stockReturn: 1.0 },
      { marketReturn: -2.1, stockReturn: -2.4 },
      { marketReturn: 1.9, stockReturn: 2.1 },
      { marketReturn: -0.5, stockReturn: -0.7 },
      { marketReturn: 2.8, stockReturn: 3.2 },
    ]
  },
  {
    symbol: "V",
    rSquared: 0.67,
    correlation: 0.82,
    diversification: "Low",
    benchmarkFit: "Good",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 2.0 },
      { marketReturn: -1.5, stockReturn: -1.2 },
      { marketReturn: 3.2, stockReturn: 2.9 },
      { marketReturn: 0.8, stockReturn: 0.9 },
      { marketReturn: -2.1, stockReturn: -1.9 },
      { marketReturn: 1.9, stockReturn: 1.8 },
      { marketReturn: -0.5, stockReturn: -0.4 },
      { marketReturn: 2.8, stockReturn: 2.6 },
    ]
  },
  {
    symbol: "BRK.B",
    rSquared: 0.83,
    correlation: 0.91,
    diversification: "Low",
    benchmarkFit: "Excellent",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 1.9 },
      { marketReturn: -1.5, stockReturn: -1.4 },
      { marketReturn: 3.2, stockReturn: 2.9 },
      { marketReturn: 0.8, stockReturn: 0.8 },
      { marketReturn: -2.1, stockReturn: -1.9 },
      { marketReturn: 1.9, stockReturn: 1.7 },
      { marketReturn: -0.5, stockReturn: -0.5 },
      { marketReturn: 2.8, stockReturn: 2.5 },
    ]
  },
  {
    symbol: "PG",
    rSquared: 0.58,
    correlation: 0.76,
    diversification: "Medium",
    benchmarkFit: "Good",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 1.4 },
      { marketReturn: -1.5, stockReturn: -1.0 },
      { marketReturn: 3.2, stockReturn: 2.2 },
      { marketReturn: 0.8, stockReturn: 0.6 },
      { marketReturn: -2.1, stockReturn: -1.4 },
      { marketReturn: 1.9, stockReturn: 1.3 },
      { marketReturn: -0.5, stockReturn: -0.3 },
      { marketReturn: 2.8, stockReturn: 1.9 },
    ]
  },
  {
    symbol: "JNJ",
    rSquared: 0.55,
    correlation: 0.74,
    diversification: "Medium",
    benchmarkFit: "Good",
    scatterData: [
      { marketReturn: 2.1, stockReturn: 1.5 },
      { marketReturn: -1.5, stockReturn: -1.1 },
      { marketReturn: 3.2, stockReturn: 2.3 },
      { marketReturn: 0.8, stockReturn: 0.6 },
      { marketReturn: -2.1, stockReturn: -1.5 },
      { marketReturn: 1.9, stockReturn: 1.4 },
      { marketReturn: -0.5, stockReturn: -0.4 },
      { marketReturn: 2.8, stockReturn: 2.0 },
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