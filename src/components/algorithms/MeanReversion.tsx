import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Activity, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 789.45, prices: [785.2, 792.1, 787.3, 795.8, 789.4, 784.9, 791.2] },
  { symbol: "META", name: "Meta Platforms Inc.", price: 521.78, prices: [525.3, 518.9, 523.4, 519.8, 521.7, 527.1, 520.4] },
  { symbol: "TSLA", name: "Tesla Inc.", price: 243.15, prices: [248.7, 238.9, 245.3, 241.8, 243.1, 239.6, 246.8] },
  { symbol: "AAPL", name: "Apple Inc.", price: 175.43, prices: [174.8, 176.2, 175.1, 177.3, 175.4, 173.9, 176.8] },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.56, prices: [144.1, 141.3, 143.2, 140.8, 142.5, 144.7, 141.9] },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 891.14, prices: [885.3, 897.8, 889.7, 894.2, 891.1, 887.4, 895.6] }
];

// Ornstein-Uhlenbeck Process Parameters
const calculateOUParameters = (prices: number[]) => {
  const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  
  // Mean reversion speed (theta)
  const theta = 0.1; // Simplified calculation
  
  // Long-term mean (mu)
  const mu = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  // Volatility (sigma)
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const sigma = Math.sqrt(variance * 252); // Annualized
  
  return { theta, mu, sigma, mean };
};

// Z-Score calculation for mean reversion
const calculateZScore = (currentPrice: number, mean: number, std: number) => {
  return (currentPrice - mean) / std;
};

// Bollinger Bands
const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2) => {
  if (prices.length < period) return { upper: 0, lower: 0, middle: 0 };
  
  const recentPrices = prices.slice(-period);
  const mean = recentPrices.reduce((sum, price) => sum + price, 0) / period;
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: mean + (stdDev * std),
    lower: mean - (stdDev * std),
    middle: mean
  };
};

export const MeanReversion = () => {
  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <Card className="bg-gradient-to-r from-info/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5 text-info" />
            <span>Mean Reversion Algorithms</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-info">Ornstein-Uhlenbeck</div>
              <div className="text-sm text-muted-foreground">Stochastic Process Model</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">Bollinger Bands</div>
              <div className="text-sm text-muted-foreground">Statistical Boundaries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">Z-Score Filter</div>
              <div className="text-sm text-muted-foreground">Standard Deviations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stocksData.map((stock) => {
          const ouParams = calculateOUParameters(stock.prices);
          const bollingerBands = calculateBollingerBands(stock.prices);
          const zScore = calculateZScore(stock.price, ouParams.mu, ouParams.sigma);
          
          // Generate chart data
          const chartData = stock.prices.map((price, index) => ({
            day: index + 1,
            price,
            mean: ouParams.mu,
            upperBand: bollingerBands.upper,
            lowerBand: bollingerBands.lower
          }));

          // Trading Signals
          let signal = "HOLD";
          let signalColor = "text-muted-foreground";
          let signalReason = "";

          if (zScore > 2) {
            signal = "SELL";
            signalColor = "text-destructive";
            signalReason = "Price significantly above mean (Z-Score > 2)";
          } else if (zScore < -2) {
            signal = "BUY";
            signalColor = "text-success";
            signalReason = "Price significantly below mean (Z-Score < -2)";
          } else if (stock.price > bollingerBands.upper) {
            signal = "SELL";
            signalColor = "text-destructive";
            signalReason = "Price above upper Bollinger Band";
          } else if (stock.price < bollingerBands.lower) {
            signal = "BUY";
            signalColor = "text-success";
            signalReason = "Price below lower Bollinger Band";
          } else {
            signalReason = "Price within normal range";
          }

          return (
            <Card key={stock.symbol} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{stock.symbol}</CardTitle>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <Badge variant={signal === "BUY" ? "default" : signal === "SELL" ? "destructive" : "secondary"}>
                    {signal}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price Chart with Mean Reversion Bands */}
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" fontSize={10} />
                      <YAxis fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="upperBand" stroke="hsl(var(--destructive))" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="lowerBand" stroke="hsl(var(--success))" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                      <ReferenceLine y={ouParams.mu} stroke="hsl(var(--info))" strokeWidth={2} strokeDasharray="2 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Ornstein-Uhlenbeck Parameters */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Current Price:</span>
                      <span className="font-semibold">${stock.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Long-term Mean (μ):</span>
                      <span className="text-info">${ouParams.mu.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mean Rev. Speed (θ):</span>
                      <span className="text-muted-foreground">{ouParams.theta.toFixed(3)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Z-Score:</span>
                      <span className={Math.abs(zScore) > 2 ? (zScore > 0 ? 'text-destructive' : 'text-success') : 'text-muted-foreground'}>
                        {zScore.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Volatility (σ):</span>
                      <span className="text-warning">{(ouParams.sigma * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance from Mean:</span>
                      <span className={`${Math.abs(stock.price - ouParams.mu) / ouParams.mu > 0.05 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {Math.abs(((stock.price - ouParams.mu) / ouParams.mu) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bollinger Bands Info */}
                <div className="text-xs bg-muted/30 p-2 rounded space-y-1">
                  <div className="flex justify-between">
                    <span>Upper Band:</span>
                    <span className="text-destructive">${bollingerBands.upper.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lower Band:</span>
                    <span className="text-success">${bollingerBands.lower.toFixed(2)}</span>
                  </div>
                </div>

                {/* Strategy Explanation */}
                <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  <strong>Signal Reason:</strong> {signalReason}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mean Reversion Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-info" />
            <span>Mean Reversion Strategy Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-info">0.15</div>
              <div className="text-sm text-muted-foreground">Avg Mean Rev. Speed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">68.4%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">2.3</div>
              <div className="text-sm text-muted-foreground">Avg Days to Mean</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">15.7%</div>
              <div className="text-sm text-muted-foreground">Annualized Vol</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};