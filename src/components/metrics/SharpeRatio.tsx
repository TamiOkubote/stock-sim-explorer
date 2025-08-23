import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { Target, TrendingUp, Award } from "lucide-react";
import { useState } from "react";

interface SharpeData {
  symbol: string;
  sharpeRatio: number;
  expectedReturn: number;
  riskFreeRate: number;
  standardDeviation: number;
  rating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  monthlyReturns: { month: string; return: number; risk: number }[];
}

const mockSharpeData: SharpeData[] = [
  {
    symbol: "AAPL",
    sharpeRatio: 1.23,
    expectedReturn: 0.145,
    riskFreeRate: 0.045,
    standardDeviation: 0.081,
    rating: "Good",
    monthlyReturns: [
      { month: "Jan", return: 0.12, risk: 0.08 },
      { month: "Feb", return: 0.15, risk: 0.09 },
      { month: "Mar", return: 0.18, risk: 0.07 },
      { month: "Apr", return: 0.11, risk: 0.10 },
      { month: "May", return: 0.14, risk: 0.08 },
      { month: "Jun", return: 0.16, risk: 0.09 },
    ]
  },
  {
    symbol: "MSFT",
    sharpeRatio: 1.56,
    expectedReturn: 0.132,
    riskFreeRate: 0.045,
    standardDeviation: 0.056,
    rating: "Excellent",
    monthlyReturns: [
      { month: "Jan", return: 0.13, risk: 0.05 },
      { month: "Feb", return: 0.14, risk: 0.06 },
      { month: "Mar", return: 0.12, risk: 0.05 },
      { month: "Apr", return: 0.15, risk: 0.07 },
      { month: "May", return: 0.13, risk: 0.05 },
      { month: "Jun", return: 0.11, risk: 0.06 },
    ]
  },
  {
    symbol: "NVDA",
    sharpeRatio: 0.89,
    expectedReturn: 0.198,
    riskFreeRate: 0.045,
    standardDeviation: 0.172,
    rating: "Fair",
    monthlyReturns: [
      { month: "Jan", return: 0.25, risk: 0.18 },
      { month: "Feb", return: 0.12, risk: 0.15 },
      { month: "Mar", return: 0.31, risk: 0.20 },
      { month: "Apr", return: 0.08, risk: 0.16 },
      { month: "May", return: 0.22, risk: 0.17 },
      { month: "Jun", return: 0.19, risk: 0.19 },
    ]
  },
];

export const SharpeRatio = () => {
  const [selectedStock, setSelectedStock] = useState(mockSharpeData[0]);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Poor': return 'text-destructive';
      case 'Fair': return 'text-warning';
      case 'Good': return 'text-success';
      case 'Excellent': return 'text-info';
      default: return 'text-muted-foreground';
    }
  };

  const getSharpeInterpretation = (ratio: number) => {
    if (ratio > 2) return "Excellent risk-adjusted returns";
    if (ratio > 1) return "Good risk-adjusted returns";
    if (ratio > 0) return "Adequate risk-adjusted returns";
    return "Poor risk-adjusted returns";
  };

  const getSharpeProgress = (ratio: number) => {
    return Math.min((ratio / 3) * 100, 100);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sharpe Ratio Analysis</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Stock Selection */}
            <div className="flex flex-wrap gap-2">
              {mockSharpeData.map((stock) => (
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

            {/* Main Sharpe Ratio Display */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold">
                {selectedStock.sharpeRatio.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Sharpe Ratio
              </div>
              <Badge variant="outline" className={getRatingColor(selectedStock.rating)}>
                <Award className="w-3 h-3 mr-1" />
                {selectedStock.rating}
              </Badge>
            </div>

            {/* Sharpe Components */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="space-y-1 p-2 bg-muted/50 rounded">
                <div className="font-medium">Expected Return</div>
                <div className="text-success">
                  {(selectedStock.expectedReturn * 100).toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1 p-2 bg-muted/50 rounded">
                <div className="font-medium">Risk-Free Rate</div>
                <div className="text-muted-foreground">
                  {(selectedStock.riskFreeRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1 p-2 bg-muted/50 rounded">
                <div className="font-medium">Standard Dev.</div>
                <div className="text-warning">
                  {(selectedStock.standardDeviation * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Sharpe Ratio Scale */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Performance Rating</span>
                <span>{getSharpeProgress(selectedStock.sharpeRatio).toFixed(0)}%</span>
              </div>
              <Progress 
                value={getSharpeProgress(selectedStock.sharpeRatio)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.0 (Poor)</span>
                <span>3.0+ (Excellent)</span>
              </div>
            </div>

            {/* Interpretation */}
            <div className="p-3 bg-muted/30 rounded text-sm">
              <div className="font-medium mb-1">Interpretation:</div>
              <div className="text-muted-foreground">
                {getSharpeInterpretation(selectedStock.sharpeRatio)}
              </div>
            </div>

            {/* Monthly Risk-Return Chart */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Monthly Risk vs Return</div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedStock.monthlyReturns}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={false}
                      axisLine={false}
                    />
                    <Bar 
                      dataKey="return" 
                      fill="hsl(var(--primary))" 
                      opacity={0.8}
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="risk" 
                      fill="hsl(var(--warning))" 
                      opacity={0.4}
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-2 bg-primary opacity-80 rounded"></div>
                  <span>Return</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-2 bg-warning opacity-40 rounded"></div>
                  <span>Risk</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};