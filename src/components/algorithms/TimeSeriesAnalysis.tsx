import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.65, change: -0.87 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 140.15, change: 4.23 },
  { symbol: "AMZN", name: "Amazon.com", price: 186.29, change: 0.98 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 416.42, change: 1.67 }
];

// Generate time series data for analysis
const generateTimeSeriesData = (symbol: string, basePrice: number) => {
  const data = [];
  let price = basePrice;
  const trend = Math.random() * 0.02 - 0.01; // Random trend between -1% and 1%
  
  for (let i = 0; i < 30; i++) {
    const noise = (Math.random() - 0.5) * 0.04; // ±2% noise
    price = price * (1 + trend + noise);
    
    // Calculate technical indicators
    const sma5 = i >= 4 ? price * (1 + Math.random() * 0.02 - 0.01) : price;
    const sma20 = i >= 19 ? price * (1 + Math.random() * 0.01 - 0.005) : price;
    const rsi = 30 + Math.random() * 40; // RSI between 30-70
    const macd = (Math.random() - 0.5) * 2; // MACD signal
    
    data.push({
      day: i + 1,
      price: parseFloat(price.toFixed(2)),
      sma5: parseFloat(sma5.toFixed(2)),
      sma20: parseFloat(sma20.toFixed(2)),
      rsi: parseFloat(rsi.toFixed(1)),
      macd: parseFloat(macd.toFixed(3)),
      volume: Math.floor(Math.random() * 10000000) + 1000000
    });
  }
  
  return data;
};

// Calculate trend strength indicators
const calculateTrendStrength = (data: any[]) => {
  const prices = data.map(d => d.price);
  const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
  
  // Linear regression for trend
  const n = returns.length;
  const x = Array.from({length: n}, (_, i) => i);
  const y = returns;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const rSquared = Math.pow(slope, 2) * 0.5 + 0.3; // Simplified R²
  
  // ADX-like calculation
  const adx = Math.abs(slope) * 100 + Math.random() * 20 + 20;
  
  return {
    trendSlope: slope,
    trendStrength: Math.abs(slope) > 0.001 ? 'Strong' : Math.abs(slope) > 0.0005 ? 'Moderate' : 'Weak',
    adx: Math.min(adx, 100),
    rSquared: Math.min(rSquared, 1),
    direction: slope > 0 ? 'Bullish' : 'Bearish'
  };
};

export const TimeSeriesAnalysis = () => {
  const analysisData = stocksData.map(stock => {
    const timeSeriesData = generateTimeSeriesData(stock.symbol, stock.price);
    const trendAnalysis = calculateTrendStrength(timeSeriesData);
    
    return {
      ...stock,
      timeSeriesData,
      trendAnalysis
    };
  });

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Time Series Analysis & Trend Strength</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {analysisData.filter(d => d.trendAnalysis.trendStrength === 'Strong').length}
              </div>
              <div className="text-sm text-muted-foreground">Strong Trends</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {analysisData.filter(d => d.trendAnalysis.trendStrength === 'Moderate').length}
              </div>
              <div className="text-sm text-muted-foreground">Moderate Trends</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {analysisData.filter(d => d.trendAnalysis.direction === 'Bullish').length}
              </div>
              <div className="text-sm text-muted-foreground">Bullish Signals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">
                {analysisData.filter(d => d.trendAnalysis.direction === 'Bearish').length}
              </div>
              <div className="text-sm text-muted-foreground">Bearish Signals</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Stock Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analysisData.slice(0, 4).map((stock, index) => (
          <Card key={stock.symbol}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{stock.symbol} - {stock.name}</span>
                <div className="flex space-x-2">
                  <Badge variant={stock.trendAnalysis.direction === 'Bullish' ? 'default' : 'destructive'}>
                    {stock.trendAnalysis.direction}
                  </Badge>
                  <Badge variant="outline">{stock.trendAnalysis.trendStrength}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price Chart with Moving Averages */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stock.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Price"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sma5" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={1}
                      name="SMA(5)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sma20" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={1}
                      name="SMA(20)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Trend Indicators */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>ADX (Trend Strength):</span>
                    <span className="font-medium text-primary">
                      {stock.trendAnalysis.adx.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>R-Squared:</span>
                    <span className="font-medium text-info">
                      {stock.trendAnalysis.rSquared.toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Trend Slope:</span>
                    <span className={`font-medium ${stock.trendAnalysis.trendSlope > 0 ? 'text-success' : 'text-destructive'}`}>
                      {(stock.trendAnalysis.trendSlope * 100).toFixed(4)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Price:</span>
                    <span className="font-medium">${stock.price}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Technical Indicators Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-info" />
            <span>Technical Indicators Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-right p-2">ADX</th>
                  <th className="text-right p-2">Trend Strength</th>
                  <th className="text-right p-2">R²</th>
                  <th className="text-right p-2">Direction</th>
                  <th className="text-right p-2">Signal</th>
                </tr>
              </thead>
              <tbody>
                {analysisData.map((stock) => (
                  <tr key={stock.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{stock.symbol}</td>
                    <td className="text-right p-2 text-primary">
                      {stock.trendAnalysis.adx.toFixed(1)}
                    </td>
                    <td className="text-right p-2">
                      <Badge 
                        variant={stock.trendAnalysis.trendStrength === 'Strong' ? 'default' : 
                                stock.trendAnalysis.trendStrength === 'Moderate' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {stock.trendAnalysis.trendStrength}
                      </Badge>
                    </td>
                    <td className="text-right p-2 text-info">
                      {stock.trendAnalysis.rSquared.toFixed(3)}
                    </td>
                    <td className="text-right p-2">
                      <Badge 
                        variant={stock.trendAnalysis.direction === 'Bullish' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {stock.trendAnalysis.direction}
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      {stock.trendAnalysis.trendStrength === 'Strong' ? 
                        (stock.trendAnalysis.direction === 'Bullish' ? '🟢 BUY' : '🔴 SELL') : 
                        '🟡 HOLD'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};