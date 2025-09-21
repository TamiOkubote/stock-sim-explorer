import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34, volume: 2150000 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23, volume: 15200000 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45, volume: 89500000 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12, volume: 45200000 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.65, change: -0.87, volume: 28400000 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 140.15, change: 4.23, volume: 62800000 }
];

// Generate order flow data
const generateOrderFlowData = (symbol: string, basePrice: number, baseVolume: number) => {
  const data = [];
  let price = basePrice;
  let cumulativeDelta = 0;
  
  for (let i = 0; i < 50; i++) {
    // Simulate price movement
    const priceChange = (Math.random() - 0.5) * 0.02;
    price = price * (1 + priceChange);
    
    // Generate order flow metrics
    const totalVolume = baseVolume * (0.5 + Math.random());
    const buyVolume = totalVolume * (0.3 + Math.random() * 0.4); // 30-70% buy volume
    const sellVolume = totalVolume - buyVolume;
    const delta = buyVolume - sellVolume;
    cumulativeDelta += delta;
    
    // Volume profile levels
    const bidSize = Math.floor(Math.random() * 1000 + 500);
    const askSize = Math.floor(Math.random() * 1000 + 500);
    const spread = price * 0.001 * (1 + Math.random()); // 0.1-0.2% spread
    
    // Market microstructure indicators
    const orderImbalance = (buyVolume - sellVolume) / (buyVolume + sellVolume);
    const vwap = price * (1 + (Math.random() - 0.5) * 0.001);
    const marketImpact = Math.abs(delta) / totalVolume * 100;
    
    // Trade classification
    const aggressiveBuys = buyVolume * (0.6 + Math.random() * 0.3);
    const aggressiveSells = sellVolume * (0.6 + Math.random() * 0.3);
    const passiveOrders = totalVolume - aggressiveBuys - aggressiveSells;
    
    data.push({
      time: i + 1,
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(totalVolume),
      buyVolume: Math.floor(buyVolume),
      sellVolume: Math.floor(sellVolume),
      delta: Math.floor(delta),
      cumulativeDelta: Math.floor(cumulativeDelta),
      bidSize: bidSize,
      askSize: askSize,
      spread: parseFloat(spread.toFixed(4)),
      orderImbalance: parseFloat(orderImbalance.toFixed(3)),
      vwap: parseFloat(vwap.toFixed(2)),
      marketImpact: parseFloat(marketImpact.toFixed(2)),
      aggressiveBuys: Math.floor(aggressiveBuys),
      aggressiveSells: Math.floor(aggressiveSells),
      passiveOrders: Math.floor(passiveOrders),
      // Technical levels
      support: price * 0.995,
      resistance: price * 1.005,
      // Flow toxicity
      toxicity: Math.abs(orderImbalance) > 0.3 ? 'High' : Math.abs(orderImbalance) > 0.1 ? 'Medium' : 'Low'
    });
  }
  
  return data;
};

// Calculate order flow statistics
const calculateOrderFlowStats = (data: any[]) => {
  const latestData = data[data.length - 1];
  const recentData = data.slice(-10);
  
  const avgDelta = recentData.reduce((sum, d) => sum + d.delta, 0) / recentData.length;
  const avgImbalance = recentData.reduce((sum, d) => sum + Math.abs(d.orderImbalance), 0) / recentData.length;
  const avgSpread = recentData.reduce((sum, d) => sum + d.spread, 0) / recentData.length;
  const avgToxicity = recentData.filter(d => d.toxicity === 'High').length / recentData.length;
  
  // Flow direction analysis
  const bullishFlow = recentData.filter(d => d.delta > 0).length;
  const bearishFlow = recentData.filter(d => d.delta < 0).length;
  const flowDirection = bullishFlow > bearishFlow ? 'Bullish' : 'Bearish';
  
  // Institutional vs retail flow
  const institutionalFlow = recentData.reduce((sum, d) => sum + d.aggressiveBuys + d.aggressiveSells, 0);
  const retailFlow = recentData.reduce((sum, d) => sum + d.passiveOrders, 0);
  const institutionalRatio = institutionalFlow / (institutionalFlow + retailFlow);
  
  return {
    currentDelta: latestData.delta,
    cumulativeDelta: latestData.cumulativeDelta,
    avgDelta,
    orderImbalance: latestData.orderImbalance,
    avgImbalance,
    currentSpread: latestData.spread,
    avgSpread,
    flowDirection,
    bullishFlow,
    bearishFlow,
    toxicity: latestData.toxicity,
    avgToxicity,
    institutionalRatio,
    marketImpact: latestData.marketImpact,
    vwapDeviation: ((latestData.price - latestData.vwap) / latestData.vwap) * 100
  };
};

export const OrderFlowAnalysis = () => {
  const orderFlowData = stocksData.map(stock => {
    const flowData = generateOrderFlowData(stock.symbol, stock.price, stock.volume / 50);
    const stats = calculateOrderFlowStats(flowData);
    
    return {
      ...stock,
      flowData,
      stats
    };
  });

  const overallStats = {
    avgDelta: orderFlowData.reduce((sum, d) => sum + Math.abs(d.stats.avgDelta), 0) / orderFlowData.length,
    bullishStocks: orderFlowData.filter(d => d.stats.flowDirection === 'Bullish').length,
    avgImbalance: orderFlowData.reduce((sum, d) => sum + d.stats.avgImbalance, 0) / orderFlowData.length,
    highToxicity: orderFlowData.filter(d => d.stats.toxicity === 'High').length
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Order Flow Analysis - Market Microstructure</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {overallStats.bullishStocks}
              </div>
              <div className="text-sm text-muted-foreground">Bullish Flow</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {(overallStats.avgImbalance * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Imbalance</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {overallStats.avgDelta.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Delta</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">
                {overallStats.highToxicity}
              </div>
              <div className="text-sm text-muted-foreground">High Toxicity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Stock Order Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {orderFlowData.slice(0, 4).map((stock, index) => (
          <Card key={stock.symbol}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{stock.symbol} - Order Flow</span>
                <div className="flex space-x-2">
                  <Badge variant={stock.stats.flowDirection === 'Bullish' ? 'default' : 'destructive'}>
                    {stock.stats.flowDirection}
                  </Badge>
                  <Badge variant={stock.stats.toxicity === 'High' ? 'destructive' : 
                                 stock.stats.toxicity === 'Medium' ? 'secondary' : 'outline'}>
                    {stock.stats.toxicity} Toxicity
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price vs Delta Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stock.flowData.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" fontSize={10} />
                    <YAxis yAxisId="price" orientation="left" fontSize={10} />
                    <YAxis yAxisId="delta" orientation="right" fontSize={10} />
                    <Tooltip />
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Price"
                    />
                    <Bar 
                      yAxisId="delta"
                      dataKey="delta" 
                      fill={stock.stats.avgDelta > 0 ? 'hsl(var(--success)/0.6)' : 'hsl(var(--destructive)/0.6)'}
                      name="Delta"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Volume Profile */}
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stock.flowData.slice(-15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="buyVolume"
                      stackId="1"
                      stroke="hsl(var(--success))"
                      fill="hsl(var(--success)/0.6)"
                      name="Buy Volume"
                    />
                    <Area
                      type="monotone"
                      dataKey="sellVolume"
                      stackId="1"
                      stroke="hsl(var(--destructive))"
                      fill="hsl(var(--destructive)/0.6)"
                      name="Sell Volume"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Order Flow Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Delta:</span>
                    <span className={`font-medium ${stock.stats.currentDelta > 0 ? 'text-success' : 'text-destructive'}`}>
                      {stock.stats.currentDelta > 0 ? '+' : ''}{stock.stats.currentDelta}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Imbalance:</span>
                    <span className={`font-medium ${Math.abs(stock.stats.orderImbalance) > 0.2 ? 'text-warning' : 'text-info'}`}>
                      {(stock.stats.orderImbalance * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Spread:</span>
                    <span className="font-medium text-info">
                      {stock.stats.currentSpread.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>VWAP Dev:</span>
                    <span className={`font-medium ${Math.abs(stock.stats.vwapDeviation) > 0.5 ? 'text-warning' : 'text-muted-foreground'}`}>
                      {stock.stats.vwapDeviation.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Flow Signal */}
              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Flow Signal:</span>
                  <div className="flex items-center space-x-2">
                    {stock.stats.flowDirection === 'Bullish' && stock.stats.toxicity !== 'High' ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-success font-medium">BUY FLOW</span>
                      </>
                    ) : stock.stats.flowDirection === 'Bearish' && stock.stats.toxicity !== 'High' ? (
                      <>
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        <span className="text-destructive font-medium">SELL FLOW</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpDown className="h-4 w-4 text-warning" />
                        <span className="text-warning font-medium">NEUTRAL</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stock.stats.institutionalRatio > 0.6 
                    ? "Institutional flow detected - follow smart money"
                    : stock.stats.toxicity === 'High'
                    ? "High toxicity - avoid aggressive orders"
                    : `${stock.stats.flowDirection} sentiment with ${stock.stats.toxicity.toLowerCase()} toxicity`}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cumulative Delta Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-info" />
            <span>Cumulative Delta Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis />
                <YAxis />
                <Tooltip />
                {orderFlowData.slice(0, 4).map((stock, index) => (
                  <Line
                    key={stock.symbol}
                    data={stock.flowData.slice(-20)}
                    type="monotone"
                    dataKey="cumulativeDelta"
                    stroke={['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))'][index]}
                    strokeWidth={2}
                    name={stock.symbol}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Order Flow Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowUpDown className="h-5 w-5 text-success" />
            <span>Order Flow Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-right p-2">Delta</th>
                  <th className="text-right p-2">Imbalance</th>
                  <th className="text-right p-2">Spread</th>
                  <th className="text-right p-2">Toxicity</th>
                  <th className="text-right p-2">Flow Direction</th>
                  <th className="text-right p-2">Signal</th>
                </tr>
              </thead>
              <tbody>
                {orderFlowData.map((stock) => (
                  <tr key={stock.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{stock.symbol}</td>
                    <td className={`text-right p-2 ${stock.stats.currentDelta > 0 ? 'text-success' : 'text-destructive'}`}>
                      {stock.stats.currentDelta > 0 ? '+' : ''}{stock.stats.currentDelta}
                    </td>
                    <td className={`text-right p-2 ${Math.abs(stock.stats.orderImbalance) > 0.2 ? 'text-warning' : 'text-info'}`}>
                      {(stock.stats.orderImbalance * 100).toFixed(1)}%
                    </td>
                    <td className="text-right p-2 text-info">
                      {stock.stats.currentSpread.toFixed(4)}
                    </td>
                    <td className="text-right p-2">
                      <Badge 
                        variant={stock.stats.toxicity === 'High' ? 'destructive' : 
                                stock.stats.toxicity === 'Medium' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {stock.stats.toxicity}
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      <Badge 
                        variant={stock.stats.flowDirection === 'Bullish' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {stock.stats.flowDirection}
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      {stock.stats.flowDirection === 'Bullish' && stock.stats.toxicity !== 'High' ? '🟢 Buy Flow' : 
                       stock.stats.flowDirection === 'Bearish' && stock.stats.toxicity !== 'High' ? '🔴 Sell Flow' : 
                       '🟡 Neutral'}
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