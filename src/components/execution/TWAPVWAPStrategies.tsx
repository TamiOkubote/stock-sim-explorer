import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, TrendingUp, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34, volume: 2150000 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23, volume: 15200000 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45, volume: 89500000 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12, volume: 45200000 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.65, change: -0.87, volume: 28400000 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 140.15, change: 4.23, volume: 62800000 }
];

// TWAP (Time-Weighted Average Price) Strategy
const generateTWAPData = (symbol: string, basePrice: number, targetShares: number, timeHorizon: number) => {
  const data = [];
  let price = basePrice;
  let executedShares = 0;
  let twap = 0;
  let totalCost = 0;
  const sharesPerInterval = targetShares / timeHorizon;
  
  for (let i = 0; i < timeHorizon; i++) {
    // Simulate price movement with some volatility
    const volatility = 0.01 + Math.random() * 0.02; // 1-3% volatility
    const priceChange = (Math.random() - 0.5) * volatility;
    price = price * (1 + priceChange);
    
    // Execute TWAP order
    const sharesToExecute = Math.min(sharesPerInterval, targetShares - executedShares);
    const executionPrice = price * (1 + (Math.random() - 0.5) * 0.001); // Small slippage
    
    executedShares += sharesToExecute;
    totalCost += sharesToExecute * executionPrice;
    twap = totalCost / executedShares;
    
    // Calculate metrics
    const completion = (executedShares / targetShares) * 100;
    const slippage = ((executionPrice - basePrice) / basePrice) * 100;
    const participation = (sharesToExecute / (Math.random() * 1000000 + 100000)) * 100; // As % of volume
    
    data.push({
      interval: i + 1,
      price: parseFloat(price.toFixed(2)),
      executionPrice: parseFloat(executionPrice.toFixed(2)),
      executedShares: Math.floor(executedShares),
      remainingShares: Math.floor(targetShares - executedShares),
      twap: parseFloat(twap.toFixed(2)),
      completion: parseFloat(completion.toFixed(1)),
      slippage: parseFloat(slippage.toFixed(3)),
      participation: parseFloat(participation.toFixed(2)),
      cost: parseFloat((sharesToExecute * executionPrice).toFixed(2)),
      cumulativeCost: parseFloat(totalCost.toFixed(2))
    });
  }
  
  return data;
};

// VWAP (Volume-Weighted Average Price) Strategy
const generateVWAPData = (symbol: string, basePrice: number, baseVolume: number) => {
  const data = [];
  let price = basePrice;
  let cumulativeVolume = 0;
  let cumulativeVolumePrice = 0;
  let vwap = basePrice;
  
  for (let i = 0; i < 30; i++) {
    // Simulate intraday volume profile (U-shaped)
    const timeOfDay = i / 30; // 0 to 1 representing full trading day
    const volumeMultiplier = 1 + Math.sin(timeOfDay * Math.PI) * 0.5 + 
                            (timeOfDay < 0.2 || timeOfDay > 0.8 ? 1 : 0.3); // Higher at open/close
    
    const intervalVolume = (baseVolume / 30) * volumeMultiplier * (0.7 + Math.random() * 0.6);
    
    // Price movement correlated with volume
    const volumeImpact = (intervalVolume / baseVolume) * 10; // Higher volume = more movement potential
    const priceChange = (Math.random() - 0.5) * 0.02 * volumeImpact;
    price = price * (1 + priceChange);
    
    // Update VWAP calculation
    cumulativeVolume += intervalVolume;
    cumulativeVolumePrice += price * intervalVolume;
    vwap = cumulativeVolumePrice / cumulativeVolume;
    
    // VWAP execution signals
    const vwapDeviation = ((price - vwap) / vwap) * 100;
    const executionSignal = Math.abs(vwapDeviation) < 0.1 ? 'EXECUTE' : 
                           vwapDeviation < -0.2 ? 'AGGRESSIVE_BUY' :
                           vwapDeviation > 0.2 ? 'AGGRESSIVE_SELL' : 'WAIT';
    
    // Volume participation and market impact
    const marketShare = Math.min(intervalVolume * 0.1, intervalVolume * 0.3); // 10-30% participation
    const marketImpact = (marketShare / intervalVolume) * Math.abs(vwapDeviation) * 0.1;
    
    data.push({
      time: i + 1,
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(intervalVolume),
      vwap: parseFloat(vwap.toFixed(2)),
      cumulativeVolume: Math.floor(cumulativeVolume),
      deviation: parseFloat(vwapDeviation.toFixed(3)),
      executionSignal,
      marketShare: Math.floor(marketShare),
      marketImpact: parseFloat(marketImpact.toFixed(4)),
      efficiency: parseFloat((100 - Math.abs(vwapDeviation) * 10).toFixed(1)),
      // Volume profile indicators
      volumeProfile: volumeMultiplier.toFixed(2),
      priceLevel: price > vwap ? 'ABOVE_VWAP' : 'BELOW_VWAP'
    });
  }
  
  return data;
};

// Implementation Shortfall and Transaction Cost Analysis
const calculateImplementationShortfall = (twapData: any[], vwapData: any[], benchmarkPrice: number) => {
  const finalTWAP = twapData[twapData.length - 1].twap;
  const finalVWAP = vwapData[vwapData.length - 1].vwap;
  const currentPrice = vwapData[vwapData.length - 1].price;
  
  // Implementation shortfall components
  const marketImpact = ((finalTWAP - benchmarkPrice) / benchmarkPrice) * 100;
  const timing = ((currentPrice - finalTWAP) / finalTWAP) * 100;
  const totalShortfall = marketImpact + timing;
  
  // Transaction costs
  const avgSlippage = twapData.reduce((sum, d) => sum + Math.abs(d.slippage), 0) / twapData.length;
  const avgParticipation = twapData.reduce((sum, d) => sum + d.participation, 0) / twapData.length;
  
  return {
    marketImpact,
    timing,
    totalShortfall,
    avgSlippage,
    avgParticipation,
    twapEfficiency: ((benchmarkPrice - Math.abs(finalTWAP - benchmarkPrice)) / benchmarkPrice) * 100,
    vwapEfficiency: ((benchmarkPrice - Math.abs(finalVWAP - benchmarkPrice)) / benchmarkPrice) * 100
  };
};

export const TWAPVWAPStrategies = () => {
  const executionData = stocksData.map(stock => {
    const targetShares = Math.floor(stock.volume * 0.01); // 1% of daily volume
    const twapData = generateTWAPData(stock.symbol, stock.price, targetShares, 20);
    const vwapData = generateVWAPData(stock.symbol, stock.price, stock.volume);
    const shortfall = calculateImplementationShortfall(twapData, vwapData, stock.price);
    
    return {
      ...stock,
      twapData,
      vwapData,
      shortfall,
      targetShares,
      currentVWAPDeviation: vwapData[vwapData.length - 1].deviation,
      executionSignal: vwapData[vwapData.length - 1].executionSignal
    };
  });

  const overallStats = {
    avgTWAPEfficiency: executionData.reduce((sum, d) => sum + d.shortfall.twapEfficiency, 0) / executionData.length,
    avgVWAPEfficiency: executionData.reduce((sum, d) => sum + d.shortfall.vwapEfficiency, 0) / executionData.length,
    avgSlippage: executionData.reduce((sum, d) => sum + d.shortfall.avgSlippage, 0) / executionData.length,
    executingStocks: executionData.filter(d => d.executionSignal === 'EXECUTE').length
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>TWAP/VWAP Execution Strategies</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {overallStats.avgTWAPEfficiency.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">TWAP Efficiency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {overallStats.avgVWAPEfficiency.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">VWAP Efficiency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {overallStats.avgSlippage.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Slippage</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {overallStats.executingStocks}
              </div>
              <div className="text-sm text-muted-foreground">Executing Now</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Stock Execution Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {executionData.slice(0, 4).map((stock, index) => (
          <Card key={stock.symbol}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{stock.symbol} - Execution Analysis</span>
                <div className="flex space-x-2">
                  <Badge variant={stock.executionSignal === 'EXECUTE' ? 'default' : 
                                 stock.executionSignal.includes('AGGRESSIVE') ? 'destructive' : 'secondary'}>
                    {stock.executionSignal}
                  </Badge>
                  <Badge variant="outline">
                    {Math.abs(stock.currentVWAPDeviation).toFixed(1)}% from VWAP
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* TWAP vs Price Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stock.twapData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="interval" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Market Price"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="twap" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      name="TWAP"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="executionPrice" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      name="Execution Price"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* VWAP and Volume Profile */}
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stock.vwapData.slice(-15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" fontSize={10} />
                    <YAxis yAxisId="price" orientation="left" fontSize={10} />
                    <YAxis yAxisId="volume" orientation="right" fontSize={10} />
                    <Tooltip />
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Price"
                    />
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="vwap" 
                      stroke="hsl(var(--info))" 
                      strokeWidth={2}
                      name="VWAP"
                    />
                    <Bar 
                      yAxisId="volume"
                      dataKey="volume" 
                      fill="hsl(var(--muted)/0.6)" 
                      name="Volume"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Execution Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>TWAP Efficiency:</span>
                    <span className="font-medium text-success">
                      {stock.shortfall.twapEfficiency.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market Impact:</span>
                    <span className={`font-medium ${Math.abs(stock.shortfall.marketImpact) < 0.1 ? 'text-success' : 'text-warning'}`}>
                      {stock.shortfall.marketImpact.toFixed(3)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>VWAP Deviation:</span>
                    <span className={`font-medium ${Math.abs(stock.currentVWAPDeviation) < 0.1 ? 'text-success' : 'text-warning'}`}>
                      {stock.currentVWAPDeviation.toFixed(3)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Slippage:</span>
                    <span className="font-medium text-info">
                      {stock.shortfall.avgSlippage.toFixed(3)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Execution Signal */}
              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Execution Signal:</span>
                  <div className="flex items-center space-x-2">
                    {stock.executionSignal === 'EXECUTE' ? (
                      <>
                        <Target className="h-4 w-4 text-success" />
                        <span className="text-success font-medium">EXECUTE</span>
                      </>
                    ) : stock.executionSignal.includes('AGGRESSIVE') ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-warning" />
                        <span className="text-warning font-medium">{stock.executionSignal}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-info" />
                        <span className="text-info font-medium">WAIT</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stock.executionSignal === 'EXECUTE' 
                    ? "Optimal execution window - price near VWAP"
                    : stock.executionSignal === 'AGGRESSIVE_BUY'
                    ? "Price significantly below VWAP - consider aggressive buying"
                    : stock.executionSignal === 'AGGRESSIVE_SELL'
                    ? "Price significantly above VWAP - consider aggressive selling"
                    : "Wait for better execution opportunity"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Implementation Shortfall Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-info" />
            <span>Implementation Shortfall Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={executionData.map(stock => ({
                symbol: stock.symbol,
                twapEfficiency: stock.shortfall.twapEfficiency,
                vwapEfficiency: stock.shortfall.vwapEfficiency,
                marketImpact: Math.abs(stock.shortfall.marketImpact),
                slippage: stock.shortfall.avgSlippage
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="symbol" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="twapEfficiency" 
                  fill="hsl(var(--success))" 
                  name="TWAP Efficiency %"
                />
                <Bar 
                  dataKey="vwapEfficiency" 
                  fill="hsl(var(--info))" 
                  name="VWAP Efficiency %"
                />
                <Bar 
                  dataKey="marketImpact" 
                  fill="hsl(var(--warning))" 
                  name="Market Impact %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Execution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-success" />
            <span>Execution Strategy Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-right p-2">VWAP Dev</th>
                  <th className="text-right p-2">TWAP Eff</th>
                  <th className="text-right p-2">Market Impact</th>
                  <th className="text-right p-2">Slippage</th>
                  <th className="text-right p-2">Signal</th>
                  <th className="text-right p-2">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {executionData.map((stock) => (
                  <tr key={stock.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{stock.symbol}</td>
                    <td className={`text-right p-2 ${Math.abs(stock.currentVWAPDeviation) < 0.1 ? 'text-success' : 'text-warning'}`}>
                      {stock.currentVWAPDeviation.toFixed(3)}%
                    </td>
                    <td className="text-right p-2 text-success">
                      {stock.shortfall.twapEfficiency.toFixed(1)}%
                    </td>
                    <td className={`text-right p-2 ${Math.abs(stock.shortfall.marketImpact) < 0.1 ? 'text-success' : 'text-warning'}`}>
                      {Math.abs(stock.shortfall.marketImpact).toFixed(3)}%
                    </td>
                    <td className="text-right p-2 text-info">
                      {stock.shortfall.avgSlippage.toFixed(3)}%
                    </td>
                    <td className="text-right p-2">
                      <Badge 
                        variant={stock.executionSignal === 'EXECUTE' ? 'default' : 
                                stock.executionSignal.includes('AGGRESSIVE') ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {stock.executionSignal}
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      {stock.executionSignal === 'EXECUTE' ? '🟢 Execute Now' : 
                       stock.executionSignal === 'AGGRESSIVE_BUY' ? '🔵 Aggressive Buy' :
                       stock.executionSignal === 'AGGRESSIVE_SELL' ? '🔴 Aggressive Sell' :
                       '🟡 Wait'}
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