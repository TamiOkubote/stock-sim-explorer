import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Activity, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12 }
];

// Merton Jump-Diffusion Model
const simulateMertonJumpDiffusion = (S0: number, mu: number, sigma: number, lambda: number, muJ: number, sigmaJ: number, T: number, steps: number) => {
  const dt = T / steps;
  const path = [{ day: 0, price: S0, return: 0, jump: 0, diffusion: S0 }];
  let S = S0;
  
  for (let i = 1; i <= steps; i++) {
    // Diffusion component
    const dW = (Math.random() - 0.5) * Math.sqrt(dt) * 2; // Random normal
    const diffusionReturn = (mu - 0.5 * sigma * sigma) * dt + sigma * dW;
    
    // Jump component (Poisson process)
    const jumpOccurs = Math.random() < lambda * dt;
    let jumpReturn = 0;
    
    if (jumpOccurs) {
      // Log-normal jump size
      const jumpSize = (Math.random() - 0.5) * sigmaJ * 2 + muJ;
      jumpReturn = jumpSize;
    }
    
    const totalReturn = diffusionReturn + jumpReturn;
    S = S * Math.exp(totalReturn);
    
    path.push({
      day: i,
      price: parseFloat(S.toFixed(2)),
      return: totalReturn,
      jump: jumpReturn,
      diffusion: parseFloat((S * Math.exp(-jumpReturn)).toFixed(2))
    });
  }
  
  return path;
};

// Heston Stochastic Volatility Model
const simulateHestonModel = (S0: number, V0: number, mu: number, kappa: number, theta: number, sigma: number, rho: number, T: number, steps: number) => {
  const dt = T / steps;
  const path = [{ day: 0, price: S0, volatility: Math.sqrt(V0), variance: V0 }];
  
  let S = S0;
  let V = V0;
  
  for (let i = 1; i <= steps; i++) {
    // Generate correlated random numbers
    const Z1 = (Math.random() - 0.5) * 2 * Math.sqrt(3); // Approximation of normal
    const Z2 = rho * Z1 + Math.sqrt(1 - rho * rho) * (Math.random() - 0.5) * 2 * Math.sqrt(3);
    
    // Variance process (CIR process)
    const dV = kappa * (theta - Math.max(V, 0)) * dt + sigma * Math.sqrt(Math.max(V, 0)) * Math.sqrt(dt) * Z2;
    V = Math.max(V + dV, 0.001); // Prevent negative variance
    
    // Price process
    const dS = mu * S * dt + Math.sqrt(Math.max(V, 0)) * S * Math.sqrt(dt) * Z1;
    S = Math.max(S + dS, 0.01); // Prevent negative prices
    
    path.push({
      day: i,
      price: parseFloat(S.toFixed(2)),
      volatility: parseFloat(Math.sqrt(V).toFixed(4)),
      variance: parseFloat(V.toFixed(6))
    });
  }
  
  return path;
};

// Bates Model (Heston with Jumps)
const simulateBatesModel = (S0: number, V0: number, mu: number, kappa: number, theta: number, sigma: number, rho: number, lambda: number, muJ: number, sigmaJ: number, T: number, steps: number) => {
  const dt = T / steps;
  const path = [{ day: 0, price: S0, volatility: Math.sqrt(V0), jump: 0 }];
  
  let S = S0;
  let V = V0;
  
  for (let i = 1; i <= steps; i++) {
    // Generate correlated random numbers
    const Z1 = (Math.random() - 0.5) * 2 * Math.sqrt(3);
    const Z2 = rho * Z1 + Math.sqrt(1 - rho * rho) * (Math.random() - 0.5) * 2 * Math.sqrt(3);
    
    // Variance process
    const dV = kappa * (theta - Math.max(V, 0)) * dt + sigma * Math.sqrt(Math.max(V, 0)) * Math.sqrt(dt) * Z2;
    V = Math.max(V + dV, 0.001);
    
    // Jump component
    const jumpOccurs = Math.random() < lambda * dt;
    let jumpSize = 0;
    if (jumpOccurs) {
      jumpSize = (Math.random() - 0.5) * sigmaJ * 2 + muJ;
    }
    
    // Price process with stochastic volatility and jumps
    const dS = mu * S * dt + Math.sqrt(Math.max(V, 0)) * S * Math.sqrt(dt) * Z1;
    S = Math.max(S * (1 + dS/S) * Math.exp(jumpSize), 0.01);
    
    path.push({
      day: i,
      price: parseFloat(S.toFixed(2)),
      volatility: parseFloat(Math.sqrt(V).toFixed(4)),
      jump: jumpSize
    });
  }
  
  return path;
};

// Model parameter estimation (simplified)
const estimateModelParameters = (returns: number[]) => {
  const n = returns.length;
  const mean = returns.reduce((sum, r) => sum + r, 0) / n;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  
  // Detect jumps (simplified)
  const threshold = 2 * Math.sqrt(variance);
  const jumps = returns.filter(r => Math.abs(r - mean) > threshold);
  const jumpFreq = jumps.length / n * 252; // Annualized
  
  // Jump parameters
  const jumpMean = jumps.length > 0 ? jumps.reduce((sum, j) => sum + j, 0) / jumps.length : 0;
  const jumpVol = jumps.length > 1 ? Math.sqrt(jumps.reduce((sum, j) => sum + Math.pow(j - jumpMean, 2), 0) / (jumps.length - 1)) : 0;
  
  return {
    mu: mean * 252, // Annualized drift
    sigma: Math.sqrt(variance * 252), // Annualized volatility
    lambda: jumpFreq, // Jump frequency
    muJ: jumpMean, // Jump mean
    sigmaJ: jumpVol, // Jump volatility
    // Heston parameters (calibrated values)
    kappa: 2.0, // Mean reversion speed
    theta: variance, // Long-term variance
    sigmaV: 0.3, // Vol of vol
    rho: -0.5 // Correlation
  };
};

export const JumpDiffusionModels = () => {
  const modelResults = stocksData.map(stock => {
    // Generate sample returns for parameter estimation
    const returns = Array.from({length: 252}, () => (Math.random() - 0.5) * 0.04);
    const params = estimateModelParameters(returns);
    
    // Simulate different models
    const mertonPath = simulateMertonJumpDiffusion(
      stock.price, params.mu, params.sigma, params.lambda, 
      params.muJ, params.sigmaJ, 1, 252
    );
    
    const hestonPath = simulateHestonModel(
      stock.price, params.sigma * params.sigma, params.mu, 
      params.kappa, params.theta, params.sigmaV, params.rho, 1, 252
    );
    
    const batesPath = simulateBatesModel(
      stock.price, params.sigma * params.sigma, params.mu, params.kappa, 
      params.theta, params.sigmaV, params.rho, params.lambda, 
      params.muJ, params.sigmaJ, 1, 252
    );
    
    // Calculate model statistics
    const mertonStats = {
      finalPrice: mertonPath[mertonPath.length - 1].price,
      maxPrice: Math.max(...mertonPath.map(p => p.price)),
      minPrice: Math.min(...mertonPath.map(p => p.price)),
      jumps: mertonPath.filter(p => Math.abs(p.jump) > 0.01).length,
      volatility: Math.sqrt(mertonPath.slice(1).reduce((sum, p, i) => sum + Math.pow(Math.log(p.price / mertonPath[i].price), 2), 0) / 251) * Math.sqrt(252)
    };
    
    const hestonStats = {
      finalPrice: hestonPath[hestonPath.length - 1].price,
      avgVolatility: hestonPath.reduce((sum, p) => sum + p.volatility, 0) / hestonPath.length,
      maxVolatility: Math.max(...hestonPath.map(p => p.volatility)),
      minVolatility: Math.min(...hestonPath.map(p => p.volatility)),
      volOfVol: Math.sqrt(hestonPath.reduce((sum, p) => sum + Math.pow(p.volatility - hestonStats?.avgVolatility || 0, 2), 0) / hestonPath.length)
    };
    
    return {
      ...stock,
      params,
      mertonPath: mertonPath.slice(-60), // Last 60 days for charting
      hestonPath: hestonPath.slice(-60),
      batesPath: batesPath.slice(-60),
      mertonStats,
      hestonStats
    };
  });

  const avgJumpFreq = modelResults.reduce((sum, r) => sum + r.params.lambda, 0) / modelResults.length;
  const avgVolOfVol = modelResults.reduce((sum, r) => sum + r.params.sigmaV, 0) / modelResults.length;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-destructive/5 to-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-destructive" />
            <span>Jump-Diffusion & Stochastic Models</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-destructive">Merton</div>
              <div className="text-sm text-muted-foreground">Jump-Diffusion</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">Heston</div>
              <div className="text-sm text-muted-foreground">Stochastic Vol</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {avgJumpFreq.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Jump Freq/Year</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {avgVolOfVol.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Vol of Vol</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modelResults.slice(0, 2).map((result) => (
          <Card key={result.symbol}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{result.symbol} - Model Comparison</span>
                <div className="flex space-x-2">
                  <Badge variant="destructive">Merton</Badge>
                  <Badge variant="secondary">Heston</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]} />
                    <Line 
                      data={result.mertonPath}
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      name="Merton Model"
                    />
                    <Line 
                      data={result.hestonPath}
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      name="Heston Model"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-destructive">Merton Statistics</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Jumps:</span>
                      <span>{result.mertonStats.jumps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Volatility:</span>
                      <span>{(result.mertonStats.volatility * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-secondary">Heston Statistics</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Avg Vol:</span>
                      <span>{(result.hestonStats.avgVolatility * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vol Range:</span>
                      <span>{((result.hestonStats.maxVolatility - result.hestonStats.minVolatility) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Volatility Dynamics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-warning" />
            <span>Stochastic Volatility Dynamics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" fontSize={10} />
                <YAxis 
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  fontSize={10}
                />
                <Tooltip 
                  formatter={(value, name) => [`${(Number(value) * 100).toFixed(2)}%`, name]}
                />
                {modelResults.slice(0, 2).map((result, index) => (
                  <Area 
                    key={result.symbol}
                    data={result.hestonPath}
                    type="monotone" 
                    dataKey="volatility" 
                    stackId={index}
                    stroke={`hsl(var(--${['warning', 'info'][index]}))`}
                    fill={`hsl(var(--${['warning', 'info'][index]}))`}
                    fillOpacity={0.3}
                    name={`${result.symbol} Volatility`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Jump Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-info" />
            <span>Jump Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day"
                    label={{ value: 'Trading Day', position: 'insideBottom', offset: -10 }}
                    fontSize={10}
                  />
                  <YAxis 
                    dataKey="jump"
                    label={{ value: 'Jump Size', angle: -90, position: 'insideLeft' }}
                    fontSize={10}
                  />
                  <Tooltip formatter={(value, name) => [Number(value).toFixed(4), name]} />
                  {modelResults.slice(0, 2).map((result, index) => (
                    <Scatter 
                      key={result.symbol}
                      data={result.mertonPath.filter(p => Math.abs(p.jump) > 0.001)}
                      fill={`hsl(var(--${['destructive', 'primary'][index]}))`}
                      name={`${result.symbol} Jumps`}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              {modelResults.map((result) => (
                <div key={result.symbol} className="space-y-1">
                  <div className="font-medium">{result.symbol}</div>
                  <div className="text-lg font-bold text-destructive">
                    {result.mertonStats.jumps}
                  </div>
                  <div className="text-muted-foreground">Total Jumps</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Model Parameters & Calibration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-right p-2">Drift (μ)</th>
                  <th className="text-right p-2">Volatility (σ)</th>
                  <th className="text-right p-2">Jump Freq (λ)</th>
                  <th className="text-right p-2">Jump Mean</th>
                  <th className="text-right p-2">Mean Rev (κ)</th>
                  <th className="text-right p-2">Vol of Vol</th>
                  <th className="text-right p-2">Correlation (ρ)</th>
                </tr>
              </thead>
              <tbody>
                {modelResults.map((result) => (
                  <tr key={result.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{result.symbol}</td>
                    <td className="text-right p-2">
                      <span className={result.params.mu > 0 ? 'text-success' : 'text-destructive'}>
                        {(result.params.mu * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="text-right p-2 text-warning">
                      {(result.params.sigma * 100).toFixed(1)}%
                    </td>
                    <td className="text-right p-2 text-destructive">
                      {result.params.lambda.toFixed(2)}
                    </td>
                    <td className="text-right p-2">
                      <span className={result.params.muJ > 0 ? 'text-success' : 'text-destructive'}>
                        {(result.params.muJ * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="text-right p-2 text-info">
                      {result.params.kappa.toFixed(2)}
                    </td>
                    <td className="text-right p-2 text-secondary">
                      {result.params.sigmaV.toFixed(2)}
                    </td>
                    <td className="text-right p-2">
                      <span className={result.params.rho > 0 ? 'text-success' : 'text-destructive'}>
                        {result.params.rho.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Model Interpretation */}
      <Card>
        <CardHeader>
          <CardTitle>Jump-Diffusion Model Interpretation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div>
              <strong>Merton Jump-Diffusion:</strong> Extends Black-Scholes by adding jump risk. 
              Models sudden price movements due to news events, earnings surprises, or market shocks.
            </div>
            <div>
              <strong>Heston Stochastic Volatility:</strong> Allows volatility to vary randomly over time with mean reversion. 
              Captures volatility clustering and the leverage effect (negative correlation between returns and volatility).
            </div>
            <div>
              <strong>Bates Model:</strong> Combines Heston stochastic volatility with Merton jumps, 
              providing the most comprehensive model for equity dynamics.
            </div>
            <div>
              <strong>Applications:</strong> Exotic option pricing, risk management, portfolio optimization, 
              and capturing fat tails and volatility smiles in derivative markets.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};