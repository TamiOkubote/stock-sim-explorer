import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, TestTube, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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

// Generate price series for statistical testing
const generatePriceSeries = (symbol: string, basePrice: number) => {
  const data = [];
  let price = basePrice;
  
  for (let i = 0; i < 100; i++) {
    // Add mean reversion tendency
    const meanReversionForce = (basePrice - price) * 0.02;
    const randomWalk = (Math.random() - 0.5) * 0.03;
    price = price * (1 + meanReversionForce + randomWalk);
    
    data.push({
      day: i + 1,
      price: parseFloat(price.toFixed(2)),
      logPrice: Math.log(price),
      return: i > 0 ? (price - data[i-1].price) / data[i-1].price : 0
    });
  }
  
  return data;
};

// Augmented Dickey-Fuller Test (simplified)
const adfTest = (timeSeries: number[]) => {
  const n = timeSeries.length;
  const differences = timeSeries.slice(1).map((val, i) => val - timeSeries[i]);
  const laggedLevels = timeSeries.slice(0, -1);
  
  // Simplified ADF calculation
  const meanDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
  const meanLevel = laggedLevels.reduce((a, b) => a + b, 0) / laggedLevels.length;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < differences.length; i++) {
    numerator += (differences[i] - meanDiff) * (laggedLevels[i] - meanLevel);
    denominator += Math.pow(laggedLevels[i] - meanLevel, 2);
  }
  
  const beta = numerator / denominator;
  const tStatistic = beta * Math.sqrt(denominator) / Math.sqrt(
    differences.reduce((sum, diff, i) => sum + Math.pow(diff - meanDiff - beta * (laggedLevels[i] - meanLevel), 2), 0) / (n - 2)
  );
  
  // Critical values approximation
  const criticalValue5pct = -2.86;
  const criticalValue1pct = -3.43;
  
  return {
    tStatistic,
    criticalValue5pct,
    criticalValue1pct,
    isStationary5pct: tStatistic < criticalValue5pct,
    isStationary1pct: tStatistic < criticalValue1pct,
    pValue: tStatistic < -3.43 ? 0.01 : tStatistic < -2.86 ? 0.05 : 0.10
  };
};

// Johansen Cointegration Test (simplified)
const johansenTest = (series1: number[], series2: number[]) => {
  const n = Math.min(series1.length, series2.length);
  const correlation = series1.slice(0, n).reduce((sum, val, i) => {
    return sum + (val - series1.reduce((a, b) => a + b, 0) / series1.length) * 
           (series2[i] - series2.reduce((a, b) => a + b, 0) / series2.length);
  }, 0) / n;
  
  // Simplified eigenvalue calculation
  const traceStatistic = -n * Math.log(1 - Math.pow(correlation, 2));
  const maxEigenStatistic = traceStatistic * 0.8; // Approximation
  
  return {
    traceStatistic,
    maxEigenStatistic,
    criticalValueTrace: 15.41, // 5% critical value
    criticalValueMax: 14.07,   // 5% critical value
    isCointegrated: traceStatistic > 15.41,
    pValue: traceStatistic > 20 ? 0.01 : traceStatistic > 15.41 ? 0.05 : 0.10
  };
};

// Variance Ratio Test
const varianceRatioTest = (returns: number[]) => {
  const n = returns.length;
  const q = 4; // 4-period ratio
  
  // Calculate variance ratios
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const variance1 = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (n - 1);
  
  // Calculate q-period overlapping returns
  const qReturns = [];
  for (let i = 0; i <= n - q; i++) {
    qReturns.push(returns.slice(i, i + q).reduce((a, b) => a + b, 0));
  }
  
  const varianceQ = qReturns.reduce((sum, ret) => sum + Math.pow(ret - mean * q, 2), 0) / (qReturns.length - 1);
  const vr = varianceQ / (q * variance1);
  
  // Test statistic
  const testStat = Math.sqrt(n) * (vr - 1) / Math.sqrt(2 * (2 * q - 1) * (q - 1) / (3 * q));
  
  return {
    varianceRatio: vr,
    testStatistic: testStat,
    pValue: Math.abs(testStat) > 1.96 ? 0.05 : 0.10,
    isRandomWalk: Math.abs(testStat) < 1.96
  };
};

export const StatisticalTesting = () => {
  const testResults = stocksData.map(stock => {
    const priceSeries = generatePriceSeries(stock.symbol, stock.price);
    const prices = priceSeries.map(p => p.logPrice);
    const returns = priceSeries.slice(1).map(p => p.return);
    
    const adf = adfTest(prices);
    const vr = varianceRatioTest(returns);
    
    return {
      ...stock,
      priceSeries,
      adfTest: adf,
      varianceRatioTest: vr,
      meanReversionSignal: adf.isStationary5pct && !vr.isRandomWalk ? 'Strong' :
                          adf.isStationary5pct || !vr.isRandomWalk ? 'Moderate' : 'Weak'
    };
  });

  // Cointegration pairs analysis
  const cointegrationPairs = [];
  for (let i = 0; i < testResults.length; i++) {
    for (let j = i + 1; j < testResults.length; j++) {
      const series1 = testResults[i].priceSeries.map(p => p.logPrice);
      const series2 = testResults[j].priceSeries.map(p => p.logPrice);
      const johansen = johansenTest(series1, series2);
      
      cointegrationPairs.push({
        pair: `${testResults[i].symbol}-${testResults[j].symbol}`,
        stock1: testResults[i].symbol,
        stock2: testResults[j].symbol,
        ...johansen
      });
    }
  }

  const significantPairs = cointegrationPairs
    .filter(pair => pair.isCointegrated)
    .sort((a, b) => b.traceStatistic - a.traceStatistic)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-info/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5 text-info" />
            <span>Statistical Testing & Mean Reversion Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {testResults.filter(r => r.adfTest.isStationary5pct).length}
              </div>
              <div className="text-sm text-muted-foreground">Stationary Series</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {testResults.filter(r => r.meanReversionSignal === 'Strong').length}
              </div>
              <div className="text-sm text-muted-foreground">Strong Mean Reversion</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {significantPairs.length}
              </div>
              <div className="text-sm text-muted-foreground">Cointegrated Pairs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {testResults.filter(r => !r.varianceRatioTest.isRandomWalk).length}
              </div>
              <div className="text-sm text-muted-foreground">Non-Random Walk</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Stock Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-primary" />
            <span>Individual Stock Statistical Tests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-right p-2">ADF t-stat</th>
                  <th className="text-right p-2">Stationarity</th>
                  <th className="text-right p-2">VR Test</th>
                  <th className="text-right p-2">Random Walk</th>
                  <th className="text-right p-2">Mean Reversion</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result) => (
                  <tr key={result.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{result.symbol}</td>
                    <td className="text-right p-2 text-info">
                      {result.adfTest.tStatistic.toFixed(3)}
                    </td>
                    <td className="text-right p-2">
                      <Badge variant={result.adfTest.isStationary5pct ? 'default' : 'destructive'} className="text-xs">
                        {result.adfTest.isStationary5pct ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="text-right p-2 text-warning">
                      {result.varianceRatioTest.testStatistic.toFixed(3)}
                    </td>
                    <td className="text-right p-2">
                      <Badge variant={result.varianceRatioTest.isRandomWalk ? 'destructive' : 'default'} className="text-xs">
                        {result.varianceRatioTest.isRandomWalk ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      <Badge 
                        variant={result.meanReversionSignal === 'Strong' ? 'default' : 
                                result.meanReversionSignal === 'Moderate' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {result.meanReversionSignal}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cointegration Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-secondary" />
            <span>Cointegration Pairs Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={significantPairs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="pair" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="traceStatistic" fill="hsl(var(--primary))" name="Trace Statistic" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Pair</th>
                    <th className="text-right p-2">Trace Statistic</th>
                    <th className="text-right p-2">Critical Value</th>
                    <th className="text-right p-2">P-Value</th>
                    <th className="text-right p-2">Cointegrated</th>
                  </tr>
                </thead>
                <tbody>
                  {significantPairs.slice(0, 8).map((pair, index) => (
                    <tr key={index} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-medium">{pair.pair}</td>
                      <td className="text-right p-2 text-primary">
                        {pair.traceStatistic.toFixed(3)}
                      </td>
                      <td className="text-right p-2 text-muted-foreground">
                        {pair.criticalValueTrace}
                      </td>
                      <td className="text-right p-2 text-info">
                        {pair.pValue.toFixed(3)}
                      </td>
                      <td className="text-right p-2">
                        <Badge variant={pair.isCointegrated ? 'default' : 'destructive'} className="text-xs">
                          {pair.isCointegrated ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Interpretation */}
      <Card>
        <CardHeader>
          <CardTitle>Statistical Test Interpretation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div>
              <strong>Augmented Dickey-Fuller Test:</strong> Tests for unit roots (non-stationarity). 
              A stationary series suggests mean reversion potential.
            </div>
            <div>
              <strong>Variance Ratio Test:</strong> Tests the random walk hypothesis. 
              Rejection suggests predictable patterns in returns.
            </div>
            <div>
              <strong>Johansen Cointegration Test:</strong> Identifies long-term equilibrium relationships 
              between pairs of stocks for statistical arbitrage strategies.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};