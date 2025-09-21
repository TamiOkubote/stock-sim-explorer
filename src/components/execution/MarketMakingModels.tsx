import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34, volume: 2150000, volatility: 0.25 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23, volume: 15200000, volatility: 0.32 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45, volume: 89500000, volatility: 0.45 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12, volume: 45200000, volatility: 0.28 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.65, change: -0.87, volume: 28400000, volatility: 0.30 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 140.15, change: 4.23, volume: 62800000, volatility: 0.38 }
];

// Avellaneda-Stoikov Market Making Model
const avellanedaStoikovModel = (
  price: number,
  volatility: number,
  inventory: number,
  riskAversion: number = 0.1,
  timeToMaturity: number = 1,
  tickSize: number = 0.01
) => {
  // Calculate reservation price
  const reservationPrice = price - (riskAversion * volatility * volatility * inventory * timeToMaturity);
  
  // Calculate optimal spread
  const gamma = riskAversion;
  const sigma = volatility;
  const T = timeToMaturity;
  const q = inventory;
  
  const optimalSpread = (gamma * sigma * sigma * T) + (2 / gamma) * Math.log(1 + gamma / 2);
  
  // Bid and ask prices
  const halfSpread = optimalSpread / 2;
  const bidPrice = reservationPrice - halfSpread;
  const askPrice = reservationPrice + halfSpread;
  
  // Adjust to tick size
  const adjustedBid = Math.floor(bidPrice / tickSize) * tickSize;
  const adjustedAsk = Math.ceil(askPrice / tickSize) * tickSize;
  
  return {
    reservationPrice,
    bidPrice: adjustedBid,
    askPrice: adjustedAsk,
    spread: adjustedAsk - adjustedBid,
    optimalSpread,
    halfSpread
  };
};

// Generate market making simulation data
const generateMarketMakingData = (symbol: string, basePrice: number, volatility: number, volume: number) => {
  const data = [];
  let price = basePrice;
  let inventory = 0;
  let cash = 10000;
  let totalPnL = 0;
  let bidFills = 0;
  let askFills = 0;
  let maxInventory = 100; // Position limit
  
  for (let i = 0; i < 100; i++) {
    // Simulate price movement
    const dt = 1/252/24; // 1 hour
    const drift = 0; // No drift assumption
    const diffusion = volatility * Math.sqrt(dt) * (Math.random() * 2 - 1);
    price = Math.max(0.01, price * Math.exp(drift * dt + diffusion));
    
    // Apply Avellaneda-Stoikov model
    const model = avellanedaStoikovModel(
      price, 
      volatility, 
      inventory / maxInventory, // Normalized inventory
      0.1, // Risk aversion
      1 - (i / 100) // Time to maturity
    );
    
    // Simulate order fills based on market conditions
    const marketVolatility = Math.abs(diffusion);
    const fillProbability = Math.min(0.8, marketVolatility * 10 + 0.1);
    
    // Bid fill simulation
    if (Math.random() < fillProbability * 0.5 && inventory < maxInventory) {
      const fillSize = Math.floor(Math.random() * 10 + 1);
      inventory += fillSize;
      cash -= fillSize * model.bidPrice;
      bidFills++;
      totalPnL -= fillSize * (price - model.bidPrice); // Immediate mark-to-market
    }
    
    // Ask fill simulation
    if (Math.random() < fillProbability * 0.5 && inventory > -maxInventory) {
      const fillSize = Math.floor(Math.random() * 10 + 1);
      inventory -= fillSize;
      cash += fillSize * model.askPrice;
      askFills++;
      totalPnL += fillSize * (model.askPrice - price); // Immediate mark-to-market
    }
    
    // Calculate metrics
    const portfolioValue = cash + inventory * price;
    const dailyPnL = i > 0 ? portfolioValue - data[i-1].portfolioValue : 0;
    const inventoryRisk = Math.abs(inventory) * price * volatility;
    const spreadCapture = (model.askPrice - model.bidPrice) / price * 100;
    
    // Risk metrics
    const skew = inventory * 0.001; // Position-dependent skew
    const adjustedBid = model.bidPrice * (1 - Math.abs(skew));
    const adjustedAsk = model.askPrice * (1 + Math.abs(skew));
    
    data.push({
      time: i + 1,
      price: parseFloat(price.toFixed(2)),
      bidPrice: parseFloat(adjustedBid.toFixed(2)),
      askPrice: parseFloat(adjustedAsk.toFixed(2)),
      reservationPrice: parseFloat(model.reservationPrice.toFixed(2)),
      spread: parseFloat((adjustedAsk - adjustedBid).toFixed(4)),
      inventory: inventory,
      cash: parseFloat(cash.toFixed(2)),
      portfolioValue: parseFloat(portfolioValue.toFixed(2)),
      totalPnL: parseFloat(totalPnL.toFixed(2)),
      dailyPnL: parseFloat(dailyPnL.toFixed(2)),
      bidFills: bidFills,
      askFills: askFills,
      inventoryRisk: parseFloat(inventoryRisk.toFixed(2)),
      spreadCapture: parseFloat(spreadCapture.toFixed(3)),
      skew: parseFloat(skew.toFixed(4)),
      fillRate: ((bidFills + askFills) / (i + 1)) * 100,
      utilization: Math.abs(inventory) / maxInventory * 100
    });
  }
  
  return data;
};

// Calculate market making performance metrics
const calculatePerformanceMetrics = (data: any[]) => {
  const finalData = data[data.length - 1];
  const initialValue = data[0].portfolioValue;
  
  const totalReturn = ((finalData.portfolioValue - initialValue) / initialValue) * 100;
  const avgSpread = data.reduce((sum, d) => sum + d.spread, 0) / data.length;
  const avgInventory = data.reduce((sum, d) => sum + Math.abs(d.inventory), 0) / data.length;
  const maxDrawdown = Math.max(...data.map((d, i) => {
    if (i === 0) return 0;
    const peak = Math.max(...data.slice(0, i + 1).map(x => x.portfolioValue));
    return (peak - d.portfolioValue) / peak * 100;
  }));
  
  // Sharpe ratio calculation
  const returns = data.slice(1).map((d, i) => (d.portfolioValue - data[i].portfolioValue) / data[i].portfolioValue);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const stdReturn = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  const sharpeRatio = stdReturn > 0 ? (avgReturn * Math.sqrt(252)) / (stdReturn * Math.sqrt(252)) : 0;
  
  return {
    totalReturn,
    avgSpread,
    avgInventory,
    maxDrawdown,
    sharpeRatio,
    finalPnL: finalData.totalPnL,
    totalTrades: finalData.bidFills + finalData.askFills,
    fillRate: finalData.fillRate,
    avgSpreadCapture: data.reduce((sum, d) => sum + d.spreadCapture, 0) / data.length
  };
};

export const MarketMakingModels = () => {
  const marketMakingData = stocksData.map(stock => {
    const simulationData = generateMarketMakingData(stock.symbol, stock.price, stock.volatility, stock.volume);
    const performance = calculatePerformanceMetrics(simulationData);
    
    return {
      ...stock,
      simulationData,
      performance,
      currentSpread: simulationData[simulationData.length - 1].spread,
      currentInventory: simulationData[simulationData.length - 1].inventory,
      currentPnL: simulationData[simulationData.length - 1].totalPnL
    };
  });

  const overallStats = {
    avgReturn: marketMakingData.reduce((sum, d) => sum + d.performance.totalReturn, 0) / marketMakingData.length,
    avgSharpe: marketMakingData.reduce((sum, d) => sum + d.performance.sharpeRatio, 0) / marketMakingData.length,
    profitableStrategies: marketMakingData.filter(d => d.performance.totalReturn > 0).length,
    avgSpread: marketMakingData.reduce((sum, d) => sum + d.currentSpread, 0) / marketMakingData.length
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-primary" />
            <span>Market Making Models - Avellaneda-Stoikov</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {overallStats.avgReturn.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Return</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {overallStats.avgSharpe.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Sharpe Ratio</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {overallStats.profitableStrategies}
              </div>
              <div className="text-sm text-muted-foreground">Profitable</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {overallStats.avgSpread.toFixed(4)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Spread</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Market Making Strategies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {marketMakingData.slice(0, 4).map((stock, index) => (
          <Card key={stock.symbol}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{stock.symbol} - Market Making</span>
                <div className="flex space-x-2">
                  <Badge variant={stock.performance.totalReturn > 0 ? 'default' : 'destructive'}>
                    {stock.performance.totalReturn > 0 ? 'Profitable' : 'Loss'}
                  </Badge>
                  <Badge variant="outline">
                    {stock.performance.totalTrades} Trades
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price and Bid-Ask Spread */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stock.simulationData.slice(-50)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="askPrice"
                      stroke="hsl(var(--destructive))"
                      fill="hsl(var(--destructive)/0.1)"
                      name="Ask Price"
                    />
                    <Area
                      type="monotone"
                      dataKey="bidPrice"
                      stroke="hsl(var(--success))"
                      fill="hsl(var(--success)/0.1)"
                      name="Bid Price"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Market Price"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="reservationPrice" 
                      stroke="hsl(var(--info))" 
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      name="Reservation Price"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* PnL and Inventory */}
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stock.simulationData.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" fontSize={10} />
                    <YAxis yAxisId="pnl" orientation="left" fontSize={10} />
                    <YAxis yAxisId="inventory" orientation="right" fontSize={10} />
                    <Tooltip />
                    <Line 
                      yAxisId="pnl"
                      type="monotone" 
                      dataKey="totalPnL" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      name="Total PnL"
                    />
                    <Bar 
                      yAxisId="inventory"
                      dataKey="inventory" 
                      fill={stock.currentInventory > 0 ? 'hsl(var(--success)/0.6)' : 'hsl(var(--destructive)/0.6)'}
                      name="Inventory"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Return:</span>
                    <span className={`font-medium ${stock.performance.totalReturn > 0 ? 'text-success' : 'text-destructive'}`}>
                      {stock.performance.totalReturn.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sharpe Ratio:</span>
                    <span className="font-medium text-info">
                      {stock.performance.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Spread:</span>
                    <span className="font-medium text-warning">
                      {stock.currentSpread.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fill Rate:</span>
                    <span className="font-medium text-primary">
                      {stock.performance.fillRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Market Making Status:</span>
                  <div className="flex items-center space-x-2">
                    {stock.performance.totalReturn > 5 ? (
                      <>
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="text-success font-medium">EXCELLENT</span>
                      </>
                    ) : stock.performance.totalReturn > 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-info" />
                        <span className="text-info font-medium">PROFITABLE</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-destructive font-medium">LOSS</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Inventory: {stock.currentInventory} shares | 
                  PnL: ${stock.currentPnL.toFixed(2)} | 
                  Max Drawdown: {stock.performance.maxDrawdown.toFixed(2)}%
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk-Return Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-info" />
            <span>Risk-Return Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marketMakingData.map(stock => ({
                symbol: stock.symbol,
                return: stock.performance.totalReturn,
                sharpe: stock.performance.sharpeRatio,
                maxDrawdown: stock.performance.maxDrawdown,
                volatility: stock.volatility * 100
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="symbol" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="return"
                  stroke="hsl(var(--success))"
                  fill="hsl(var(--success)/0.6)"
                  name="Return %"
                />
                <Line 
                  type="monotone" 
                  dataKey="sharpe" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Sharpe Ratio"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-success" />
            <span>Market Making Performance Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-right p-2">Return</th>
                  <th className="text-right p-2">Sharpe</th>
                  <th className="text-right p-2">Max DD</th>
                  <th className="text-right p-2">Avg Spread</th>
                  <th className="text-right p-2">Fill Rate</th>
                  <th className="text-right p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {marketMakingData.map((stock) => (
                  <tr key={stock.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{stock.symbol}</td>
                    <td className={`text-right p-2 ${stock.performance.totalReturn > 0 ? 'text-success' : 'text-destructive'}`}>
                      {stock.performance.totalReturn.toFixed(2)}%
                    </td>
                    <td className="text-right p-2 text-info">
                      {stock.performance.sharpeRatio.toFixed(2)}
                    </td>
                    <td className="text-right p-2 text-destructive">
                      {stock.performance.maxDrawdown.toFixed(2)}%
                    </td>
                    <td className="text-right p-2 text-warning">
                      {stock.currentSpread.toFixed(4)}
                    </td>
                    <td className="text-right p-2 text-primary">
                      {stock.performance.fillRate.toFixed(1)}%
                    </td>
                    <td className="text-right p-2">
                      {stock.performance.totalReturn > 5 ? '🟢 Excellent' : 
                       stock.performance.totalReturn > 0 ? '🔵 Profitable' : 
                       '🔴 Loss'}
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