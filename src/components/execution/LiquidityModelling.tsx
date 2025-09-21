import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34, volume: 2150000, marketCap: 701.2 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23, volume: 15200000, marketCap: 1431.5 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45, volume: 89500000, marketCap: 792.1 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12, volume: 45200000, marketCap: 3520.8 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.65, change: -0.87, volume: 28400000, marketCap: 2158.7 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 140.15, change: 4.23, volume: 62800000, marketCap: 3451.2 }
];

// Almgren-Chriss Liquidity Model
const almgrenChrissModel = (
  totalShares: number,
  timeHorizon: number,
  volatility: number,
  permanentImpact: number,
  temporaryImpact: number,
  riskAversion: number = 1e-6
) => {
  const T = timeHorizon;
  const X = totalShares;
  const sigma = volatility;
  const gamma = permanentImpact;
  const eta = temporaryImpact;
  const lambda = riskAversion;
  
  // Calculate optimal trajectory
  const kappa = Math.sqrt(lambda * sigma * sigma / eta);
  const trajectory = [];
  
  for (let t = 0; t <= T; t++) {
    const timeRemaining = T - t;
    let optimalHolding;
    
    if (kappa * timeRemaining < 1e-10) {
      optimalHolding = 0;
    } else {
      optimalHolding = X * (Math.sinh(kappa * timeRemaining) / Math.sinh(kappa * T));
    }
    
    trajectory.push({
      time: t,
      holdings: Math.max(0, optimalHolding),
      tradingRate: t === 0 ? 0 : trajectory[t-1] ? trajectory[t-1].holdings - optimalHolding : 0
    });
  }
  
  return {
    trajectory,
    kappa,
    expectedCost: gamma * X * X / (2 * T) + eta * kappa * X * X / (2 * Math.tanh(kappa * T)),
    variance: (eta * lambda * sigma * sigma * X * X * T) / 3,
    efficiency: Math.exp(-kappa * T)
  };
};

// Generate liquidity analysis data
const generateLiquidityData = (symbol: string, price: number, volume: number, marketCap: number) => {
  const data = [];
  let currentPrice = price;
  
  // Market microstructure parameters
  const tickSize = price > 100 ? 0.01 : 0.001;
  const avgSpread = price * (0.0005 + Math.random() * 0.0015); // 5-20 bps
  const marketDepth = volume * 0.1; // 10% of volume at best bid/ask
  
  for (let i = 0; i < 50; i++) {
    // Simulate intraday price and volume
    const timeOfDay = i / 50;
    const volumeProfile = 1 + Math.sin(timeOfDay * Math.PI) * 0.5; // U-shaped volume
    const currentVolume = volume * volumeProfile * (0.8 + Math.random() * 0.4);
    
    // Price impact from volume
    const relativeVolume = currentVolume / volume;
    const priceImpact = Math.sqrt(relativeVolume) * 0.001 * (Math.random() * 2 - 1);
    currentPrice = currentPrice * (1 + priceImpact);
    
    // Liquidity metrics
    const bid = currentPrice - avgSpread / 2;
    const ask = currentPrice + avgSpread / 2;
    const bidSize = marketDepth * (0.5 + Math.random() * 0.5);
    const askSize = marketDepth * (0.5 + Math.random() * 0.5);
    
    // Kyle's lambda (price impact coefficient)
    const kylesLambda = avgSpread / (2 * Math.sqrt(currentVolume));
    
    // Amihud illiquidity measure
    const amihudIlliquidity = Math.abs(priceImpact) / (currentVolume / marketCap);
    
    // Market impact estimation
    const permanentImpact = 0.5 * kylesLambda;
    const temporaryImpact = 0.3 * avgSpread / currentPrice;
    
    // Liquidity-weighted price
    const lwp = (bid * askSize + ask * bidSize) / (bidSize + askSize);
    
    // Resiliency measure (time to recover from impact)
    const resiliency = 1 / (1 + Math.abs(priceImpact) * 1000);
    
    // Order book imbalance
    const imbalance = (bidSize - askSize) / (bidSize + askSize);
    
    data.push({
      time: i + 1,
      price: parseFloat(currentPrice.toFixed(2)),
      bid: parseFloat(bid.toFixed(2)),
      ask: parseFloat(ask.toFixed(2)),
      spread: parseFloat((ask - bid).toFixed(4)),
      bidSize: Math.floor(bidSize),
      askSize: Math.floor(askSize),
      volume: Math.floor(currentVolume),
      kylesLambda: parseFloat((kylesLambda * 1000000).toFixed(2)), // In basis points per million
      amihudIlliquidity: parseFloat(amihudIlliquidity.toFixed(6)),
      permanentImpact: parseFloat((permanentImpact * 100).toFixed(3)),
      temporaryImpact: parseFloat((temporaryImpact * 100).toFixed(3)),
      liquidityWeightedPrice: parseFloat(lwp.toFixed(2)),
      resiliency: parseFloat(resiliency.toFixed(3)),
      imbalance: parseFloat(imbalance.toFixed(3)),
      depth: Math.floor(bidSize + askSize),
      tightness: parseFloat((avgSpread / currentPrice * 10000).toFixed(1)), // In basis points
      // Liquidity score (0-100)
      liquidityScore: Math.min(100, Math.max(0, 
        100 - (kylesLambda * 1000000) - (amihudIlliquidity * 1000000) - Math.abs(imbalance) * 50
      ))
    });
  }
  
  return data;
};

// Calculate optimal execution using Almgren-Chriss
const calculateOptimalExecution = (symbol: string, targetShares: number, liquidityData: any[]) => {
  const avgPrice = liquidityData.reduce((sum, d) => sum + d.price, 0) / liquidityData.length;
  const volatility = Math.sqrt(
    liquidityData.slice(1).reduce((sum, d, i) => {
      const ret = (d.price - liquidityData[i].price) / liquidityData[i].price;
      return sum + ret * ret;
    }, 0) / (liquidityData.length - 1)
  ) * Math.sqrt(252); // Annualized
  
  const avgPermanentImpact = liquidityData.reduce((sum, d) => sum + d.permanentImpact, 0) / liquidityData.length / 100;
  const avgTemporaryImpact = liquidityData.reduce((sum, d) => sum + d.temporaryImpact, 0) / liquidityData.length / 100;
  
  const model = almgrenChrissModel(
    targetShares,
    20, // 20 periods
    volatility,
    avgPermanentImpact,
    avgTemporaryImpact
  );
  
  return model;
};

// Calculate liquidity risk metrics
const calculateLiquidityRisk = (liquidityData: any[]) => {
  const spreads = liquidityData.map(d => d.spread);
  const volumes = liquidityData.map(d => d.volume);
  const imbalances = liquidityData.map(d => Math.abs(d.imbalance));
  
  const avgSpread = spreads.reduce((sum, s) => sum + s, 0) / spreads.length;
  const spreadVolatility = Math.sqrt(
    spreads.reduce((sum, s) => sum + Math.pow(s - avgSpread, 2), 0) / spreads.length
  );
  
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
  const volumeStability = 1 - (Math.sqrt(
    volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length
  ) / avgVolume);
  
  const avgImbalance = imbalances.reduce((sum, i) => sum + i, 0) / imbalances.length;
  const avgLiquidityScore = liquidityData.reduce((sum, d) => sum + d.liquidityScore, 0) / liquidityData.length;
  
  return {
    avgSpread,
    spreadVolatility,
    volumeStability,
    avgImbalance,
    liquidityScore: avgLiquidityScore,
    riskLevel: avgLiquidityScore > 70 ? 'Low' : avgLiquidityScore > 40 ? 'Medium' : 'High'
  };
};

export const LiquidityModelling = () => {
  const liquidityAnalysis = stocksData.map(stock => {
    const targetShares = Math.floor(stock.volume * 0.005); // 0.5% of daily volume
    const liquidityData = generateLiquidityData(stock.symbol, stock.price, stock.volume, stock.marketCap);
    const optimalExecution = calculateOptimalExecution(stock.symbol, targetShares, liquidityData);
    const riskMetrics = calculateLiquidityRisk(liquidityData);
    
    return {
      ...stock,
      liquidityData,
      optimalExecution,
      riskMetrics,
      targetShares,
      currentSpread: liquidityData[liquidityData.length - 1].spread,
      currentDepth: liquidityData[liquidityData.length - 1].depth,
      liquidityScore: riskMetrics.liquidityScore
    };
  });

  const overallStats = {
    avgLiquidityScore: liquidityAnalysis.reduce((sum, d) => sum + d.liquidityScore, 0) / liquidityAnalysis.length,
    highLiquidityStocks: liquidityAnalysis.filter(d => d.liquidityScore > 70).length,
    avgSpread: liquidityAnalysis.reduce((sum, d) => sum + d.currentSpread, 0) / liquidityAnalysis.length,
    avgExecutionCost: liquidityAnalysis.reduce((sum, d) => sum + d.optimalExecution.expectedCost, 0) / liquidityAnalysis.length
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Droplets className="h-5 w-5 text-primary" />
            <span>Liquidity Modelling & Market Microstructure</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {overallStats.avgLiquidityScore.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Liquidity Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {overallStats.highLiquidityStocks}
              </div>
              <div className="text-sm text-muted-foreground">High Liquidity</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {overallStats.avgSpread.toFixed(4)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Spread</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {(overallStats.avgSpread / liquidityAnalysis[0].price * 10000).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Spread (bps)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Stock Liquidity Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {liquidityAnalysis.slice(0, 4).map((stock, index) => (
          <Card key={stock.symbol}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{stock.symbol} - Liquidity Analysis</span>
                <div className="flex space-x-2">
                  <Badge variant={stock.riskMetrics.riskLevel === 'Low' ? 'default' : 
                                 stock.riskMetrics.riskLevel === 'Medium' ? 'secondary' : 'destructive'}>
                    {stock.riskMetrics.riskLevel} Risk
                  </Badge>
                  <Badge variant="outline">
                    Score: {stock.liquidityScore.toFixed(0)}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Spread and Depth Analysis */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stock.liquidityData.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" fontSize={10} />
                    <YAxis yAxisId="price" orientation="left" fontSize={10} />
                    <YAxis yAxisId="spread" orientation="right" fontSize={10} />
                    <Tooltip />
                    <Area
                      yAxisId="price"
                      type="monotone"
                      dataKey="ask"
                      stroke="hsl(var(--destructive))"
                      fill="hsl(var(--destructive)/0.1)"
                      name="Ask"
                    />
                    <Area
                      yAxisId="price"
                      type="monotone"
                      dataKey="bid"
                      stroke="hsl(var(--success))"
                      fill="hsl(var(--success)/0.1)"
                      name="Bid"
                    />
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Price"
                    />
                    <Line 
                      yAxisId="spread"
                      type="monotone" 
                      dataKey="spread" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={2}
                      name="Spread"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Order Book Depth */}
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stock.liquidityData.slice(-15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="bidSize"
                      stackId="1"
                      stroke="hsl(var(--success))"
                      fill="hsl(var(--success)/0.6)"
                      name="Bid Size"
                    />
                    <Area
                      type="monotone"
                      dataKey="askSize"
                      stackId="1"
                      stroke="hsl(var(--destructive))"
                      fill="hsl(var(--destructive)/0.6)"
                      name="Ask Size"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Liquidity Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Kyle's λ:</span>
                    <span className="font-medium text-warning">
                      {stock.liquidityData[stock.liquidityData.length - 1].kylesLambda.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amihud Illiq:</span>
                    <span className="font-medium text-info">
                      {stock.liquidityData[stock.liquidityData.length - 1].amihudIlliquidity.toFixed(6)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Resiliency:</span>
                    <span className="font-medium text-success">
                      {stock.liquidityData[stock.liquidityData.length - 1].resiliency.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Imbalance:</span>
                    <span className={`font-medium ${Math.abs(stock.liquidityData[stock.liquidityData.length - 1].imbalance) > 0.2 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {stock.liquidityData[stock.liquidityData.length - 1].imbalance.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Liquidity Assessment */}
              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Liquidity Status:</span>
                  <div className="flex items-center space-x-2">
                    {stock.liquidityScore > 70 ? (
                      <>
                        <Droplets className="h-4 w-4 text-success" />
                        <span className="text-success font-medium">HIGH LIQUIDITY</span>
                      </>
                    ) : stock.liquidityScore > 40 ? (
                      <>
                        <BarChart3 className="h-4 w-4 text-warning" />
                        <span className="text-warning font-medium">MODERATE</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-destructive font-medium">LOW LIQUIDITY</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected execution cost: {(stock.optimalExecution.expectedCost * 100).toFixed(3)}% | 
                  Optimal periods: {stock.optimalExecution.trajectory.length} | 
                  Risk level: {stock.riskMetrics.riskLevel}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Liquidity Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-info" />
            <span>Liquidity vs Market Impact</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={liquidityAnalysis.map(stock => ({
                symbol: stock.symbol,
                x: stock.liquidityScore,
                y: stock.optimalExecution.expectedCost * 10000, // In basis points
                volume: Math.log(stock.volume) / 10 // Size for bubble
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Liquidity Score"
                  domain={[0, 100]}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Expected Cost (bps)"
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.symbol}</p>
                          <p className="text-sm">Liquidity Score: {data.x.toFixed(1)}</p>
                          <p className="text-sm">Expected Cost: {data.y.toFixed(2)} bps</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  data={liquidityAnalysis.map(stock => ({
                    symbol: stock.symbol,
                    x: stock.liquidityScore,
                    y: stock.optimalExecution.expectedCost * 10000
                  }))}
                  fill="hsl(var(--primary))" 
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Liquidity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Droplets className="h-5 w-5 text-success" />
            <span>Liquidity Risk Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-right p-2">Liq Score</th>
                  <th className="text-right p-2">Spread (bps)</th>
                  <th className="text-right p-2">Depth</th>
                  <th className="text-right p-2">Kyle's λ</th>
                  <th className="text-right p-2">Risk Level</th>
                  <th className="text-right p-2">Execution Cost</th>
                </tr>
              </thead>
              <tbody>
                {liquidityAnalysis.map((stock) => (
                  <tr key={stock.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{stock.symbol}</td>
                    <td className={`text-right p-2 ${stock.liquidityScore > 70 ? 'text-success' : stock.liquidityScore > 40 ? 'text-warning' : 'text-destructive'}`}>
                      {stock.liquidityScore.toFixed(1)}
                    </td>
                    <td className="text-right p-2 text-info">
                      {(stock.currentSpread / stock.price * 10000).toFixed(1)}
                    </td>
                    <td className="text-right p-2 text-primary">
                      {(stock.currentDepth / 1000).toFixed(0)}K
                    </td>
                    <td className="text-right p-2 text-warning">
                      {stock.liquidityData[stock.liquidityData.length - 1].kylesLambda.toFixed(1)}
                    </td>
                    <td className="text-right p-2">
                      <Badge 
                        variant={stock.riskMetrics.riskLevel === 'Low' ? 'default' : 
                                stock.riskMetrics.riskLevel === 'Medium' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {stock.riskMetrics.riskLevel}
                      </Badge>
                    </td>
                    <td className="text-right p-2 text-destructive">
                      {(stock.optimalExecution.expectedCost * 10000).toFixed(1)} bps
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