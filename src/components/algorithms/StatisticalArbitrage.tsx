import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Pairs for statistical arbitrage
const pairsTradingData = [
  {
    pair: "META-GOOGL",
    stock1: { symbol: "META", name: "Meta Platforms", price: 521.78 },
    stock2: { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.56 },
    correlation: 0.87,
    cointegration: -0.23,
    spread: 1.45,
    zScore: 2.31,
    prices1: [525.3, 518.9, 523.4, 519.8, 521.7, 527.1, 520.4],
    prices2: [144.1, 141.3, 143.2, 140.8, 142.5, 144.7, 141.9]
  },
  {
    pair: "JPM-V",
    stock1: { symbol: "JPM", name: "JPMorgan Chase", price: 221.67 },
    stock2: { symbol: "V", name: "Visa Inc.", price: 287.34 },
    correlation: 0.73,
    cointegration: -0.18,
    spread: -0.89,
    zScore: -1.87,
    prices1: [223.1, 220.4, 222.8, 219.9, 221.6, 224.2, 220.1],
    prices2: [289.7, 285.2, 288.1, 284.8, 287.3, 291.4, 286.9]
  },
  {
    pair: "AAPL-MSFT",
    stock1: { symbol: "AAPL", name: "Apple Inc.", price: 175.43 },
    stock2: { symbol: "MSFT", name: "Microsoft Corp.", price: 378.85 },
    correlation: 0.82,
    cointegration: -0.31,
    spread: 0.67,
    zScore: 1.23,
    prices1: [174.8, 176.2, 175.1, 177.3, 175.4, 173.9, 176.8],
    prices2: [380.2, 377.1, 379.4, 376.8, 378.8, 381.7, 377.9]
  }
];

// Calculate Johansen Cointegration Test (simplified)
const calculateCointegration = (prices1: number[], prices2: number[]) => {
  // Simplified cointegration calculation
  const ratio = prices1.map((p1, i) => p1 / prices2[i]);
  const mean = ratio.reduce((sum, r) => sum + r, 0) / ratio.length;
  const variance = ratio.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratio.length;
  return { ratio: mean, variance, stationarity: variance < 0.05 };
};

// Calculate spread and Z-score
const calculateSpread = (prices1: number[], prices2: number[], hedge_ratio: number = 1) => {
  const spread = prices1.map((p1, i) => p1 - hedge_ratio * prices2[i]);
  const mean = spread.reduce((sum, s) => sum + s, 0) / spread.length;
  const std = Math.sqrt(spread.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / spread.length);
  const currentSpread = spread[spread.length - 1];
  const zScore = (currentSpread - mean) / std;
  
  return { spread, mean, std, currentSpread, zScore };
};

export const StatisticalArbitrage = () => {
  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <Card className="bg-gradient-to-r from-secondary/5 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5 text-secondary" />
            <span>Statistical Arbitrage & Pairs Trading</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-secondary">Cointegration</div>
              <div className="text-sm text-muted-foreground">Long-term Relationship</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">Pairs Trading</div>
              <div className="text-sm text-muted-foreground">Market Neutral Strategy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">Z-Score Filter</div>
              <div className="text-sm text-muted-foreground">Entry/Exit Signals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">Hedge Ratio</div>
              <div className="text-sm text-muted-foreground">Position Sizing</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pairs Trading Analysis */}
      <div className="space-y-4">
        {pairsTradingData.map((pairData) => {
          const cointegrationData = calculateCointegration(pairData.prices1, pairData.prices2);
          const spreadData = calculateSpread(pairData.prices1, pairData.prices2);
          
          // Generate chart data
          const chartData = pairData.prices1.map((price1, index) => ({
            day: index + 1,
            stock1: price1,
            stock2: pairData.prices2[index],
            spread: price1 - pairData.prices2[index] * (pairData.stock1.price / pairData.stock2.price),
            spreadMA: spreadData.mean
          }));

          // Trading Signal Logic
          let signal = "HOLD";
          let signalDetail = "";
          let signalColor = "text-muted-foreground";

          if (Math.abs(pairData.zScore) > 2) {
            if (pairData.zScore > 2) {
              signal = "LONG " + pairData.stock2.symbol + " / SHORT " + pairData.stock1.symbol;
              signalColor = "text-success";
              signalDetail = "Spread too high, expect convergence";
            } else {
              signal = "LONG " + pairData.stock1.symbol + " / SHORT " + pairData.stock2.symbol;
              signalColor = "text-success"; 
              signalDetail = "Spread too low, expect divergence";
            }
          } else if (Math.abs(pairData.zScore) < 0.5) {
            signal = "CLOSE POSITIONS";
            signalColor = "text-warning";
            signalDetail = "Spread near mean, take profits";
          }

          return (
            <Card key={pairData.pair} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{pairData.pair}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {pairData.stock1.name} vs {pairData.stock2.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={Math.abs(pairData.zScore) > 2 ? "default" : Math.abs(pairData.zScore) < 0.5 ? "secondary" : "outline"}>
                      Z: {pairData.zScore.toFixed(2)}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      Corr: {(pairData.correlation * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Spread Chart */}
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Line type="monotone" dataKey="spread" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="spreadMA" stroke="hsl(var(--info))" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Pair Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>{pairData.stock1.symbol} Price:</span>
                      <span className="font-semibold">${pairData.stock1.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{pairData.stock2.symbol} Price:</span>
                      <span className="font-semibold">${pairData.stock2.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Correlation:</span>
                      <span className={pairData.correlation > 0.8 ? 'text-success' : pairData.correlation > 0.6 ? 'text-warning' : 'text-destructive'}>
                        {(pairData.correlation * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Current Spread:</span>
                      <span className="font-semibold">{pairData.spread.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Z-Score:</span>
                      <span className={Math.abs(pairData.zScore) > 2 ? 'text-success' : Math.abs(pairData.zScore) > 1 ? 'text-warning' : 'text-muted-foreground'}>
                        {pairData.zScore.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cointegration:</span>
                      <span className={Math.abs(pairData.cointegration) < 0.3 ? 'text-success' : 'text-warning'}>
                        {pairData.cointegration.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trading Signal */}
                <div className="text-xs bg-muted/30 p-3 rounded space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Trading Signal:</span>
                    <span className={signalColor}>{signal}</span>
                  </div>
                  <div className="text-muted-foreground">{signalDetail}</div>
                </div>

                {/* Position Sizing */}
                {Math.abs(pairData.zScore) > 1.5 && (
                  <div className="text-xs bg-primary/10 p-2 rounded">
                    <strong>Suggested Position:</strong>
                    <div className="mt-1">
                      • Risk per trade: 1% of portfolio
                      • Hedge ratio: {(pairData.stock1.price / pairData.stock2.price).toFixed(3)}
                      • Stop loss at Z-Score: ±3.0
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Strategy Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            <span>Statistical Arbitrage Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">78.6%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">2.41</div>
              <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">0.23</div>
              <div className="text-sm text-muted-foreground">Market Beta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">4.2D</div>
              <div className="text-sm text-muted-foreground">Avg Hold Period</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};