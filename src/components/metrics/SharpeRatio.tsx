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
    symbol: "LLY",
    sharpeRatio: 1.89,
    expectedReturn: 0.187,
    riskFreeRate: 0.045,
    standardDeviation: 0.075,
    rating: "Excellent",
    monthlyReturns: [
      { month: "Jan", return: 0.19, risk: 0.07 },
      { month: "Feb", return: 0.21, risk: 0.08 },
      { month: "Mar", return: 0.17, risk: 0.07 },
      { month: "Apr", return: 0.23, risk: 0.09 },
      { month: "May", return: 0.18, risk: 0.06 },
      { month: "Jun", return: 0.16, risk: 0.08 },
    ]
  },
  {
    symbol: "META",
    sharpeRatio: 1.12,
    expectedReturn: 0.156,
    riskFreeRate: 0.045,
    standardDeviation: 0.099,
    rating: "Good",
    monthlyReturns: [
      { month: "Jan", return: 0.18, risk: 0.11 },
      { month: "Feb", return: 0.14, risk: 0.09 },
      { month: "Mar", return: 0.21, risk: 0.12 },
      { month: "Apr", return: 0.11, risk: 0.08 },
      { month: "May", return: 0.16, risk: 0.10 },
      { month: "Jun", return: 0.13, risk: 0.09 },
    ]
  },
  {
    symbol: "TSLA",
    sharpeRatio: 0.76,
    expectedReturn: 0.203,
    riskFreeRate: 0.045,
    standardDeviation: 0.208,
    rating: "Fair",
    monthlyReturns: [
      { month: "Jan", return: 0.28, risk: 0.22 },
      { month: "Feb", return: 0.15, risk: 0.19 },
      { month: "Mar", return: 0.35, risk: 0.25 },
      { month: "Apr", return: 0.09, risk: 0.18 },
      { month: "May", return: 0.24, risk: 0.21 },
      { month: "Jun", return: 0.18, risk: 0.20 },
    ]
  },
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
    symbol: "GOOGL",
    sharpeRatio: 1.08,
    expectedReturn: 0.138,
    riskFreeRate: 0.045,
    standardDeviation: 0.086,
    rating: "Good",
    monthlyReturns: [
      { month: "Jan", return: 0.14, risk: 0.09 },
      { month: "Feb", return: 0.12, risk: 0.08 },
      { month: "Mar", return: 0.16, risk: 0.10 },
      { month: "Apr", return: 0.11, risk: 0.07 },
      { month: "May", return: 0.15, risk: 0.09 },
      { month: "Jun", return: 0.13, risk: 0.08 },
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
  {
    symbol: "AMZN",
    sharpeRatio: 0.94,
    expectedReturn: 0.165,
    riskFreeRate: 0.045,
    standardDeviation: 0.128,
    rating: "Fair",
    monthlyReturns: [
      { month: "Jan", return: 0.18, risk: 0.13 },
      { month: "Feb", return: 0.14, risk: 0.12 },
      { month: "Mar", return: 0.19, risk: 0.15 },
      { month: "Apr", return: 0.12, risk: 0.11 },
      { month: "May", return: 0.17, risk: 0.14 },
      { month: "Jun", return: 0.15, risk: 0.13 },
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
    symbol: "XOM",
    sharpeRatio: 1.34,
    expectedReturn: 0.142,
    riskFreeRate: 0.045,
    standardDeviation: 0.072,
    rating: "Good",
    monthlyReturns: [
      { month: "Jan", return: 0.15, risk: 0.07 },
      { month: "Feb", return: 0.13, risk: 0.08 },
      { month: "Mar", return: 0.17, risk: 0.06 },
      { month: "Apr", return: 0.12, risk: 0.09 },
      { month: "May", return: 0.14, risk: 0.07 },
      { month: "Jun", return: 0.16, risk: 0.08 },
    ]
  },
  {
    symbol: "UNH",
    sharpeRatio: 1.67,
    expectedReturn: 0.134,
    riskFreeRate: 0.045,
    standardDeviation: 0.053,
    rating: "Excellent",
    monthlyReturns: [
      { month: "Jan", return: 0.14, risk: 0.05 },
      { month: "Feb", return: 0.15, risk: 0.06 },
      { month: "Mar", return: 0.12, risk: 0.04 },
      { month: "Apr", return: 0.16, risk: 0.07 },
      { month: "May", return: 0.13, risk: 0.05 },
      { month: "Jun", return: 0.11, risk: 0.05 },
    ]
  },
  {
    symbol: "JPM",
    sharpeRatio: 1.28,
    expectedReturn: 0.149,
    riskFreeRate: 0.045,
    standardDeviation: 0.081,
    rating: "Good",
    monthlyReturns: [
      { month: "Jan", return: 0.16, risk: 0.08 },
      { month: "Feb", return: 0.13, risk: 0.09 },
      { month: "Mar", return: 0.18, risk: 0.07 },
      { month: "Apr", return: 0.12, risk: 0.10 },
      { month: "May", return: 0.15, risk: 0.08 },
      { month: "Jun", return: 0.14, risk: 0.09 },
    ]
  },
  {
    symbol: "V",
    sharpeRatio: 1.45,
    expectedReturn: 0.128,
    riskFreeRate: 0.045,
    standardDeviation: 0.057,
    rating: "Good",
    monthlyReturns: [
      { month: "Jan", return: 0.13, risk: 0.06 },
      { month: "Feb", return: 0.14, risk: 0.05 },
      { month: "Mar", return: 0.11, risk: 0.07 },
      { month: "Apr", return: 0.15, risk: 0.06 },
      { month: "May", return: 0.12, risk: 0.05 },
      { month: "Jun", return: 0.13, risk: 0.06 },
    ]
  },
  {
    symbol: "BRK.B",
    sharpeRatio: 1.78,
    expectedReturn: 0.123,
    riskFreeRate: 0.045,
    standardDeviation: 0.044,
    rating: "Excellent",
    monthlyReturns: [
      { month: "Jan", return: 0.12, risk: 0.04 },
      { month: "Feb", return: 0.13, risk: 0.05 },
      { month: "Mar", return: 0.11, risk: 0.04 },
      { month: "Apr", return: 0.14, risk: 0.05 },
      { month: "May", return: 0.12, risk: 0.04 },
      { month: "Jun", return: 0.10, risk: 0.04 },
    ]
  },
  {
    symbol: "PG",
    sharpeRatio: 1.92,
    expectedReturn: 0.108,
    riskFreeRate: 0.045,
    standardDeviation: 0.033,
    rating: "Excellent",
    monthlyReturns: [
      { month: "Jan", return: 0.11, risk: 0.03 },
      { month: "Feb", return: 0.10, risk: 0.04 },
      { month: "Mar", return: 0.12, risk: 0.03 },
      { month: "Apr", return: 0.09, risk: 0.04 },
      { month: "May", return: 0.11, risk: 0.03 },
      { month: "Jun", return: 0.10, risk: 0.03 },
    ]
  },
  {
    symbol: "JNJ",
    sharpeRatio: 1.84,
    expectedReturn: 0.101,
    riskFreeRate: 0.045,
    standardDeviation: 0.030,
    rating: "Excellent",
    monthlyReturns: [
      { month: "Jan", return: 0.10, risk: 0.03 },
      { month: "Feb", return: 0.11, risk: 0.03 },
      { month: "Mar", return: 0.09, risk: 0.03 },
      { month: "Apr", return: 0.12, risk: 0.04 },
      { month: "May", return: 0.10, risk: 0.03 },
      { month: "Jun", return: 0.09, risk: 0.03 },
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