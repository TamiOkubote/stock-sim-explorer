import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 789.45, returns: [0.02, -0.01, 0.03, 0.01, -0.02, 0.04, 0.02] },
  { symbol: "META", name: "Meta Platforms Inc.", price: 521.78, returns: [-0.01, 0.03, -0.02, 0.04, 0.01, -0.03, 0.02] },
  { symbol: "TSLA", name: "Tesla Inc.", price: 243.15, returns: [0.05, -0.03, 0.02, -0.04, 0.06, 0.01, -0.02] },
  { symbol: "AAPL", name: "Apple Inc.", price: 175.43, returns: [0.01, 0.02, -0.01, 0.03, -0.02, 0.02, 0.01] },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.56, returns: [-0.02, 0.04, 0.01, -0.03, 0.02, 0.03, -0.01] },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 891.14, returns: [0.04, -0.02, 0.05, 0.02, -0.04, 0.03, 0.01] }
];

// Moving Average Crossover Strategy
const calculateMovingAverage = (data: number[], period: number) => {
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
};

// Momentum Strategy
const calculateMomentum = (returns: number[], lookback: number = 5) => {
  if (returns.length < lookback) return 0;
  const recentReturns = returns.slice(-lookback);
  return recentReturns.reduce((sum, ret) => sum + ret, 0);
};

// RSI Calculation
const calculateRSI = (returns: number[], period: number = 14) => {
  if (returns.length < period) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (const ret of returns.slice(-period)) {
    if (ret > 0) gains += ret;
    else losses += Math.abs(ret);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

export const TrendFollowing = () => {
  // Generate sample price data for visualization
  const generatePriceData = (initialPrice: number, returns: number[]) => {
    const data = [];
    let currentPrice = initialPrice;
    
    for (let i = 0; i < returns.length; i++) {
      currentPrice = currentPrice * (1 + returns[i]);
      data.push({
        day: i + 1,
        price: currentPrice,
        ma5: i >= 4 ? calculateMovingAverage(returns.slice(0, i + 1).map((_, idx) => initialPrice * returns.slice(0, idx + 1).reduce((p, r) => p * (1 + r), 1)), 5).slice(-1)[0] : currentPrice,
        ma20: i >= 19 ? calculateMovingAverage(returns.slice(0, i + 1).map((_, idx) => initialPrice * returns.slice(0, idx + 1).reduce((p, r) => p * (1 + r), 1)), 20).slice(-1)[0] : currentPrice
      });
    }
    return data;
  };

  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Trend-Following Algorithms</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">MA Crossover</div>
              <div className="text-sm text-muted-foreground">Moving Average Strategy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">Momentum</div>
              <div className="text-sm text-muted-foreground">Price Momentum Filter</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">RSI Filter</div>
              <div className="text-sm text-muted-foreground">Relative Strength Index</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stocksData.slice(0, 4).map((stock) => {
          const priceData = generatePriceData(stock.price, stock.returns.concat(stock.returns).concat(stock.returns));
          const momentum = calculateMomentum(stock.returns);
          const rsi = calculateRSI(stock.returns);
          
          // Trading Signals
          const isBullishMomentum = momentum > 0.02;
          const isOversold = rsi < 30;
          const isOverbought = rsi > 70;
          
          let signal = "HOLD";
          let signalColor = "text-muted-foreground";
          
          if (isBullishMomentum && !isOverbought) {
            signal = "BUY";
            signalColor = "text-success";
          } else if (momentum < -0.02 || isOverbought) {
            signal = "SELL";
            signalColor = "text-destructive";
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
                {/* Price Chart */}
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceData.slice(-20)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ma5" stroke="hsl(var(--info))" strokeWidth={1} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex justify-between">
                      <span>Current Price:</span>
                      <span className="font-semibold">${stock.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Momentum (5D):</span>
                      <span className={momentum > 0 ? 'text-success' : 'text-destructive'}>
                        {(momentum * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span>RSI:</span>
                      <span className={rsi < 30 ? 'text-success' : rsi > 70 ? 'text-destructive' : 'text-muted-foreground'}>
                        {rsi.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Signal Strength:</span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < Math.abs(momentum) * 50 ? 
                                (signal === "BUY" ? 'bg-success' : signal === "SELL" ? 'bg-destructive' : 'bg-muted') : 
                                'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strategy Explanation */}
                <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  <strong>Strategy:</strong> {signal === "BUY" ? "Positive momentum with RSI below 70 suggests upward trend continuation." : 
                                           signal === "SELL" ? "Negative momentum or RSI above 70 suggests trend reversal." :
                                           "Mixed signals suggest waiting for clearer trend direction."}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Algorithm Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-info" />
            <span>Strategy Performance Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">73.2%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">1.85</div>
              <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">12.4%</div>
              <div className="text-sm text-muted-foreground">Annual Return</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">-8.2%</div>
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};