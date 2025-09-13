import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter } from 'recharts';

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

// Generate returns data for volatility modeling
const generateReturnsData = (symbol: string, days: number = 252) => {
  const data = [];
  let price = Math.random() * 200 + 100;
  
  for (let i = 0; i < days; i++) {
    const return_ = (Math.random() - 0.5) * 0.06; // ±3% daily return
    price = price * (1 + return_);
    
    data.push({
      day: i + 1,
      date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      return: return_,
      absReturn: Math.abs(return_)
    });
  }
  
  return data;
};

// GARCH(1,1) Model Implementation
const estimateGARCH = (returns: number[]) => {
  const n = returns.length;
  
  // Initial parameters
  let omega = 0.00001; // Long-term variance
  let alpha = 0.1;     // ARCH parameter
  let beta = 0.85;     // GARCH parameter
  
  // Calculate unconditional variance
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / n;
  const unconditionalVar = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (n - 1);
  
  // Initialize variance series
  const variances = [unconditionalVar];
  const volatilities = [Math.sqrt(unconditionalVar)];
  
  // GARCH recursion
  for (let i = 1; i < n; i++) {
    const laggedReturn = returns[i - 1] - meanReturn;
    const laggedVariance = variances[i - 1];
    
    const variance = omega + alpha * Math.pow(laggedReturn, 2) + beta * laggedVariance;
    variances.push(variance);
    volatilities.push(Math.sqrt(variance));
  }
  
  return {
    parameters: { omega, alpha, beta },
    variances,
    volatilities,
    persistence: alpha + beta,
    unconditionalVol: Math.sqrt(unconditionalVar)
  };
};

// Stochastic Volatility Model (simplified Heston-like)
const estimateStochasticVol = (returns: number[]) => {
  const n = returns.length;
  const volatilities = [];
  const volOfVol = [];
  
  let currentVol = 0.02; // Initial volatility
  const kappa = 2.0; // Mean reversion speed
  const theta = 0.04; // Long-term volatility
  const sigma = 0.3; // Vol of vol
  
  for (let i = 0; i < n; i++) {
    // Stochastic volatility process
    const dt = 1/252; // Daily
    const dW1 = (Math.random() - 0.5) * Math.sqrt(dt) * 2;
    const dW2 = (Math.random() - 0.5) * Math.sqrt(dt) * 2;
    
    const volDrift = kappa * (theta - currentVol) * dt;
    const volDiffusion = sigma * Math.sqrt(currentVol) * dW1;
    
    currentVol = Math.max(currentVol + volDrift + volDiffusion, 0.001);
    
    volatilities.push(Math.sqrt(currentVol));
    volOfVol.push(sigma * Math.sqrt(currentVol));
  }
  
  return {
    parameters: { kappa, theta, sigma },
    volatilities,
    volOfVol,
    meanReversion: kappa,
    longTermVol: Math.sqrt(theta)
  };
};

// Realized Volatility Calculation
const calculateRealizedVol = (returns: number[], window: number = 22) => {
  const realizedVols = [];
  
  for (let i = window - 1; i < returns.length; i++) {
    const windowReturns = returns.slice(i - window + 1, i + 1);
    const mean = windowReturns.reduce((sum, r) => sum + r, 0) / window;
    const sumSquaredDeviations = windowReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0);
    const realizedVar = sumSquaredDeviations;
    const realizedVol = Math.sqrt(realizedVar * 252); // Annualized
    
    realizedVols.push({
      day: i + 1,
      realizedVol: realizedVol,
      annualizedVol: realizedVol
    });
  }
  
  return realizedVols;
};

export const VolatilityModels = () => {
  const modelResults = stocksData.slice(0, 4).map(stock => {
    const returnsData = generateReturnsData(stock.symbol);
    const returns = returnsData.map(d => d.return);
    
    const garchModel = estimateGARCH(returns);
    const stochasticModel = estimateStochasticVol(returns);
    const realizedVol = calculateRealizedVol(returns);
    
    // Prepare chart data
    const chartData = returnsData.slice(-60).map((d, i) => ({
      day: d.day,
      return: d.return * 100,
      garchVol: garchModel.volatilities[garchModel.volatilities.length - 60 + i] * 100 * Math.sqrt(252),
      stochasticVol: stochasticModel.volatilities[stochasticModel.volatilities.length - 60 + i] * 100 * Math.sqrt(252),
      realizedVol: i < realizedVol.length ? realizedVol[realizedVol.length - 60 + i]?.realizedVol * 100 : 0
    }));
    
    return {
      ...stock,
      returns: returnsData,
      garch: garchModel,
      stochastic: stochasticModel,
      realized: realizedVol,
      chartData
    };
  });

  const avgPersistence = modelResults.reduce((sum, r) => sum + r.garch.persistence, 0) / modelResults.length;
  const avgMeanReversion = modelResults.reduce((sum, r) => sum + r.stochastic.meanReversion, 0) / modelResults.length;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-warning/5 to-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-warning" />
            <span>Volatility Models & Stochastic Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-warning">GARCH</div>
              <div className="text-sm text-muted-foreground">Volatility Clustering</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">Stochastic</div>
              <div className="text-sm text-muted-foreground">Vol of Vol Models</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {avgPersistence.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Persistence</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {avgMeanReversion.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Mean Reversion Speed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Stock Volatility Models */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modelResults.map((result, index) => (
          <Card key={result.symbol}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{result.symbol} - Volatility Analysis</span>
                <div className="flex space-x-2">
                  <Badge variant="outline">GARCH(1,1)</Badge>
                  <Badge variant="secondary">Stochastic</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Volatility Time Series */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]} />
                    <Line 
                      type="monotone" 
                      dataKey="garchVol" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={2}
                      name="GARCH Vol"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="stochasticVol" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      name="Stochastic Vol"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="realizedVol" 
                      stroke="hsl(var(--info))" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      name="Realized Vol"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Model Parameters */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="font-medium text-warning">GARCH(1,1) Parameters</div>
                  <div className="flex justify-between">
                    <span>ω (omega):</span>
                    <span>{result.garch.parameters.omega.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>α (alpha):</span>
                    <span>{result.garch.parameters.alpha.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>β (beta):</span>
                    <span>{result.garch.parameters.beta.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Persistence:</span>
                    <span className="text-primary">{result.garch.persistence.toFixed(3)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-destructive">Stochastic Vol Parameters</div>
                  <div className="flex justify-between">
                    <span>κ (kappa):</span>
                    <span>{result.stochastic.parameters.kappa.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>θ (theta):</span>
                    <span>{result.stochastic.parameters.theta.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>σ (sigma):</span>
                    <span>{result.stochastic.parameters.sigma.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Long-term Vol:</span>
                    <span className="text-info">{(result.stochastic.longTermVol * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Model Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-info" />
            <span>Volatility Model Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-right p-2">GARCH α</th>
                  <th className="text-right p-2">GARCH β</th>
                  <th className="text-right p-2">Persistence</th>
                  <th className="text-right p-2">Mean Reversion</th>
                  <th className="text-right p-2">Vol of Vol</th>
                  <th className="text-right p-2">Current Vol</th>
                </tr>
              </thead>
              <tbody>
                {modelResults.map((result) => (
                  <tr key={result.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{result.symbol}</td>
                    <td className="text-right p-2 text-warning">
                      {result.garch.parameters.alpha.toFixed(3)}
                    </td>
                    <td className="text-right p-2 text-warning">
                      {result.garch.parameters.beta.toFixed(3)}
                    </td>
                    <td className="text-right p-2">
                      <Badge 
                        variant={result.garch.persistence > 0.95 ? 'destructive' : result.garch.persistence > 0.90 ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {result.garch.persistence.toFixed(3)}
                      </Badge>
                    </td>
                    <td className="text-right p-2 text-destructive">
                      {result.stochastic.parameters.kappa.toFixed(2)}
                    </td>
                    <td className="text-right p-2 text-info">
                      {result.stochastic.parameters.sigma.toFixed(2)}
                    </td>
                    <td className="text-right p-2 text-success">
                      {(result.garch.volatilities[result.garch.volatilities.length - 1] * 100 * Math.sqrt(252)).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Volatility Clustering Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Volatility Clustering & Persistence</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart 
                data={modelResults.flatMap(r => 
                  r.returns.slice(-100).map((ret, i) => ({
                    absReturn: Math.abs(ret.return) * 100,
                    nextAbsReturn: i < r.returns.length - 1 ? Math.abs(r.returns[r.returns.length - 100 + i + 1].return) * 100 : 0,
                    symbol: r.symbol
                  }))
                )}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="absReturn" 
                  label={{ value: 'Current |Return| %', position: 'insideBottom', offset: -10 }}
                  fontSize={10}
                />
                <YAxis 
                  dataKey="nextAbsReturn"
                  label={{ value: 'Next |Return| %', angle: -90, position: 'insideLeft' }}
                  fontSize={10}
                />
                <Tooltip />
                <Scatter dataKey="nextAbsReturn" fill="hsl(var(--primary))" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Volatility Clustering:</strong> The scatter plot shows the relationship between current and next period absolute returns. 
              Clustering around the diagonal indicates volatility persistence - periods of high volatility tend to be followed by high volatility.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Model Interpretation */}
      <Card>
        <CardHeader>
          <CardTitle>Volatility Model Interpretation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div>
              <strong>GARCH(1,1):</strong> Models volatility clustering where high volatility periods are followed by high volatility. 
              Persistence (α + β) near 1 indicates long memory in volatility.
            </div>
            <div>
              <strong>Stochastic Volatility:</strong> Allows volatility to be driven by its own random process with mean reversion. 
              Higher κ indicates faster mean reversion to long-term volatility θ.
            </div>
            <div>
              <strong>Vol of Vol (σ):</strong> Measures the volatility of volatility itself. Higher values indicate more uncertainty 
              in volatility forecasts and potential for volatility jumps.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};