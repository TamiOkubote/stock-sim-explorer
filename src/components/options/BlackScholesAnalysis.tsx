import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp } from "lucide-react";

// Black-Scholes calculation function
const calculateBlackScholes = (
  stockPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  riskFreeRate: number,
  volatility: number
) => {
  const d1 = (Math.log(stockPrice / strikePrice) + (riskFreeRate + Math.pow(volatility, 2) / 2) * timeToExpiry) / 
             (volatility * Math.sqrt(timeToExpiry));
  
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
  
  // Cumulative standard normal distribution approximation
  const cumulativeNormalDistribution = (x: number) => {
    return 0.5 * (1 + Math.sign(x) * Math.sqrt(1 - Math.exp(-2 * Math.pow(x, 2) / Math.PI)));
  };
  
  const callPrice = stockPrice * cumulativeNormalDistribution(d1) - 
                   strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * cumulativeNormalDistribution(d2);
  
  const putPrice = strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * cumulativeNormalDistribution(-d2) - 
                  stockPrice * cumulativeNormalDistribution(-d1);
  
  return { callPrice: Math.max(0, callPrice), putPrice: Math.max(0, putPrice) };
};

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 789.45, volatility: 0.28 },
  { symbol: "META", name: "Meta Platforms Inc.", price: 521.78, volatility: 0.35 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 243.15, volatility: 0.45 },
  { symbol: "AAPL", name: "Apple Inc.", price: 175.43, volatility: 0.25 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.56, volatility: 0.30 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 891.14, volatility: 0.42 },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 155.21, volatility: 0.32 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 378.85, volatility: 0.27 },
  { symbol: "XOM", name: "Exxon Mobil Corp.", price: 118.23, volatility: 0.22 },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", price: 587.91, volatility: 0.20 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", price: 221.67, volatility: 0.24 },
  { symbol: "V", name: "Visa Inc.", price: 287.34, volatility: 0.18 },
  { symbol: "BRK.B", name: "Berkshire Hathaway Inc.", price: 456.78, volatility: 0.16 },
  { symbol: "PG", name: "Procter & Gamble Co.", price: 167.23, volatility: 0.15 },
  { symbol: "JNJ", name: "Johnson & Johnson", price: 159.87, volatility: 0.14 }
];

export const BlackScholesAnalysis = () => {
  const riskFreeRate = 0.045; // 4.5% risk-free rate
  const timeToExpiry = 0.25; // 3 months

  return (
    <div className="space-y-4">
      {/* Formula Display */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-primary" />
            <span>Black-Scholes Formula</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-center font-mono text-sm space-y-2">
              <div className="text-lg font-semibold">C = S₀ × N(d₁) - X × e^(-r×T) × N(d₂)</div>
              <div className="text-muted-foreground">
                <div>d₁ = [ln(S₀/X) + (r + σ²/2) × T] / (σ × √T)</div>
                <div>d₂ = d₁ - σ × √T</div>
              </div>
              <div className="text-xs text-muted-foreground pt-2">
                C = Call Price, S₀ = Stock Price, X = Strike Price, r = Risk-free Rate, T = Time, σ = Volatility, N(d) = Normal Distribution
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stocksData.map((stock) => {
          const strikePrice = stock.price * 1.05; // Strike 5% above current price
          const { callPrice, putPrice } = calculateBlackScholes(
            stock.price,
            strikePrice,
            timeToExpiry,
            riskFreeRate,
            stock.volatility
          );

          return (
            <Card key={stock.symbol} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{stock.symbol}</CardTitle>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    3M Options
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Price:</span>
                  <span className="font-semibold">${stock.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Strike Price:</span>
                  <span className="text-muted-foreground">${strikePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Volatility:</span>
                  <span className="text-muted-foreground">{(stock.volatility * 100).toFixed(1)}%</span>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-success">Call Option:</span>
                    <span className="font-semibold text-success">${callPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-destructive">Put Option:</span>
                    <span className="font-semibold text-destructive">${putPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-info" />
            <span>Options Pricing Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                ${(stocksData.reduce((sum, stock) => {
                  const strikePrice = stock.price * 1.05;
                  const { callPrice } = calculateBlackScholes(stock.price, strikePrice, timeToExpiry, riskFreeRate, stock.volatility);
                  return sum + callPrice;
                }, 0) / stocksData.length).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Call Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                ${(stocksData.reduce((sum, stock) => {
                  const strikePrice = stock.price * 1.05;
                  const { putPrice } = calculateBlackScholes(stock.price, strikePrice, timeToExpiry, riskFreeRate, stock.volatility);
                  return sum + putPrice;
                }, 0) / stocksData.length).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Put Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">
                {(riskFreeRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Risk-Free Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {(timeToExpiry * 12).toFixed(0)}M
              </div>
              <div className="text-sm text-muted-foreground">Time to Expiry</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};