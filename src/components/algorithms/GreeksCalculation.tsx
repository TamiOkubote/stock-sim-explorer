import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34, volatility: 28 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23, volatility: 35 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45, volatility: 45 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12, volatility: 25 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.65, change: -0.87, volatility: 30 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 140.15, change: 4.23, volatility: 42 },
  { symbol: "AMZN", name: "Amazon.com", price: 186.29, change: 0.98, volatility: 32 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 416.42, change: 1.67, volatility: 27 }
];

// Standard normal distribution functions
const normalCDF = (x: number): number => {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
};

const normalPDF = (x: number): number => {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
};

// Error function approximation
const erf = (x: number): number => {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
};

// Black-Scholes Greeks calculation
const calculateGreeks = (S: number, K: number, T: number, r: number, sigma: number, optionType: 'call' | 'put') => {
  const sigmaT = sigma * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / sigmaT;
  const d2 = d1 - sigmaT;
  
  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);
  const nd1 = normalPDF(d1);
  
  // Option price
  const callPrice = S * Nd1 - K * Math.exp(-r * T) * Nd2;
  const putPrice = K * Math.exp(-r * T) * (1 - Nd2) - S * (1 - Nd1);
  const price = optionType === 'call' ? callPrice : putPrice;
  
  // Delta
  const callDelta = Nd1;
  const putDelta = Nd1 - 1;
  const delta = optionType === 'call' ? callDelta : putDelta;
  
  // Gamma (same for calls and puts)
  const gamma = nd1 / (S * sigmaT);
  
  // Theta
  const callTheta = -(S * nd1 * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Nd2;
  const putTheta = -(S * nd1 * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * (1 - Nd2);
  const theta = (optionType === 'call' ? callTheta : putTheta) / 365; // Per day
  
  // Vega (same for calls and puts)
  const vega = S * nd1 * Math.sqrt(T) / 100; // Per 1% change in volatility
  
  // Rho
  const callRho = K * T * Math.exp(-r * T) * Nd2 / 100;
  const putRho = -K * T * Math.exp(-r * T) * (1 - Nd2) / 100;
  const rho = optionType === 'call' ? callRho : putRho;
  
  return { price, delta, gamma, theta, vega, rho };
};

// Generate option chain data
const generateOptionChain = (stock: typeof stocksData[0]) => {
  const S = stock.price;
  const r = 0.05; // 5% risk-free rate
  const sigma = stock.volatility / 100;
  const expirations = [30, 60, 90, 120]; // Days to expiration
  
  const strikes = [
    S * 0.9, S * 0.95, S, S * 1.05, S * 1.1
  ];
  
  const optionChain = [];
  
  for (const T of expirations) {
    for (const K of strikes) {
      const callGreeks = calculateGreeks(S, K, T / 365, r, sigma, 'call');
      const putGreeks = calculateGreeks(S, K, T / 365, r, sigma, 'put');
      
      optionChain.push({
        strike: K,
        expiration: T,
        moneyness: K / S,
        callPrice: callGreeks.price,
        callDelta: callGreeks.delta,
        callGamma: callGreeks.gamma,
        callTheta: callGreeks.theta,
        callVega: callGreeks.vega,
        callRho: callGreeks.rho,
        putPrice: putGreeks.price,
        putDelta: putGreeks.delta,
        putGamma: putGreeks.gamma,
        putTheta: putGreeks.theta,
        putVega: putGreeks.vega,
        putRho: putGreeks.rho
      });
    }
  }
  
  return optionChain;
};

// Calculate portfolio Greeks
const calculatePortfolioGreeks = (positions: any[]) => {
  return positions.reduce((portfolio, position) => ({
    totalDelta: portfolio.totalDelta + position.delta * position.quantity,
    totalGamma: portfolio.totalGamma + position.gamma * position.quantity,
    totalTheta: portfolio.totalTheta + position.theta * position.quantity,
    totalVega: portfolio.totalVega + position.vega * position.quantity,
    totalRho: portfolio.totalRho + position.rho * position.quantity,
    totalValue: portfolio.totalValue + position.price * position.quantity
  }), {
    totalDelta: 0,
    totalGamma: 0,
    totalTheta: 0,
    totalVega: 0,
    totalRho: 0,
    totalValue: 0
  });
};

export const GreeksCalculation = () => {
  const optionData = stocksData.slice(0, 4).map(stock => {
    const optionChain = generateOptionChain(stock);
    
    // Sample portfolio positions
    const positions = [
      { ...optionChain[2], quantity: 10, type: 'call' }, // ATM call
      { ...optionChain[7], quantity: -5, type: 'call' }, // OTM call (short)
      { ...optionChain[12], quantity: 15, type: 'put' },  // ATM put
    ].map(pos => ({
      ...pos,
      delta: pos.type === 'call' ? pos.callDelta : pos.putDelta,
      gamma: pos.type === 'call' ? pos.callGamma : pos.putGamma,
      theta: pos.type === 'call' ? pos.callTheta : pos.putTheta,
      vega: pos.type === 'call' ? pos.callVega : pos.putVega,
      rho: pos.type === 'call' ? pos.callRho : pos.putRho,
      price: pos.type === 'call' ? pos.callPrice : pos.putPrice,
    }));
    
    const portfolioGreeks = calculatePortfolioGreeks(positions);
    
    return {
      ...stock,
      optionChain: optionChain.filter(opt => opt.expiration === 30), // 30-day options for display
      positions,
      portfolioGreeks
    };
  });

  // Greek sensitivity analysis
  const sensitivityAnalysis = optionData[0]?.optionChain.map(option => ({
    strike: option.strike,
    moneyness: option.moneyness,
    callDelta: option.callDelta,
    callGamma: option.callGamma * 100, // Scale for visibility
    callVega: option.callVega,
    putDelta: option.putDelta,
    putGamma: option.putGamma * 100,
    putVega: option.putVega
  })) || [];

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-primary" />
            <span>Options Greeks & Sensitivity Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">Δ</div>
              <div className="text-sm text-muted-foreground">Delta</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">Γ</div>
              <div className="text-sm text-muted-foreground">Gamma</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">Θ</div>
              <div className="text-sm text-muted-foreground">Theta</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">ν</div>
              <div className="text-sm text-muted-foreground">Vega</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">ρ</div>
              <div className="text-sm text-muted-foreground">Rho</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Greeks Sensitivity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delta and Gamma */}
        <Card>
          <CardHeader>
            <CardTitle>Delta & Gamma by Strike</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensitivityAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="moneyness" 
                    domain={['dataMin', 'dataMax']}
                    type="number"
                    tickFormatter={(value) => value.toFixed(2)}
                    fontSize={10}
                  />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(value, name) => [Number(value).toFixed(4), name]} />
                  <Line 
                    type="monotone" 
                    dataKey="callDelta" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Call Delta"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="callGamma" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="Call Gamma (×100)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vega by Strike */}
        <Card>
          <CardHeader>
            <CardTitle>Vega Sensitivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sensitivityAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="moneyness" 
                    tickFormatter={(value) => value.toFixed(2)}
                    fontSize={10}
                  />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(value, name) => [Number(value).toFixed(3), name]} />
                  <Bar dataKey="callVega" fill="hsl(var(--info))" name="Call Vega" />
                  <Bar dataKey="putVega" fill="hsl(var(--warning))" name="Put Vega" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Greeks Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <span>Portfolio Greeks Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {optionData.map((stock) => (
              <Card key={stock.symbol} className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{stock.symbol}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Delta:</span>
                    <span className={`font-medium ${stock.portfolioGreeks.totalDelta > 0 ? 'text-success' : 'text-destructive'}`}>
                      {stock.portfolioGreeks.totalDelta.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Gamma:</span>
                    <span className="font-medium text-secondary">
                      {stock.portfolioGreeks.totalGamma.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Theta:</span>
                    <span className="font-medium text-destructive">
                      ${stock.portfolioGreeks.totalTheta.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Vega:</span>
                    <span className="font-medium text-info">
                      {stock.portfolioGreeks.totalVega.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-medium text-primary">
                      ${stock.portfolioGreeks.totalValue.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Option Chain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-warning" />
            <span>Option Chain - 30 Day Expiration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Strike</th>
                  <th className="text-right p-2">Call Price</th>
                  <th className="text-right p-2">Call Δ</th>
                  <th className="text-right p-2">Call Γ</th>
                  <th className="text-right p-2">Call Θ</th>
                  <th className="text-right p-2">Call ν</th>
                  <th className="text-right p-2">Put Price</th>
                  <th className="text-right p-2">Put Δ</th>
                  <th className="text-right p-2">Put Θ</th>
                </tr>
              </thead>
              <tbody>
                {optionData[0]?.optionChain.map((option, index) => (
                  <tr key={index} className={`border-b hover:bg-muted/30 ${Math.abs(option.moneyness - 1) < 0.02 ? 'bg-primary/10' : ''}`}>
                    <td className="p-2 font-medium">
                      ${option.strike.toFixed(0)}
                      {Math.abs(option.moneyness - 1) < 0.02 && <Badge variant="outline" className="ml-1 text-xs">ATM</Badge>}
                    </td>
                    <td className="text-right p-2">${option.callPrice.toFixed(2)}</td>
                    <td className="text-right p-2">
                      <span className={option.callDelta > 0 ? 'text-success' : 'text-destructive'}>
                        {option.callDelta.toFixed(3)}
                      </span>
                    </td>
                    <td className="text-right p-2 text-secondary">{option.callGamma.toFixed(4)}</td>
                    <td className="text-right p-2 text-destructive">{option.callTheta.toFixed(3)}</td>
                    <td className="text-right p-2 text-info">{option.callVega.toFixed(3)}</td>
                    <td className="text-right p-2">${option.putPrice.toFixed(2)}</td>
                    <td className="text-right p-2">
                      <span className={option.putDelta > 0 ? 'text-success' : 'text-destructive'}>
                        {option.putDelta.toFixed(3)}
                      </span>
                    </td>
                    <td className="text-right p-2 text-destructive">{option.putTheta.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Greeks Interpretation */}
      <Card>
        <CardHeader>
          <CardTitle>Options Greeks Interpretation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div>
              <strong>Delta (Δ):</strong> Price sensitivity to underlying asset movement. 
              Call delta: 0 to 1, Put delta: -1 to 0. Portfolio delta indicates directional exposure.
            </div>
            <div>
              <strong>Gamma (Γ):</strong> Rate of change of delta. Higher gamma means delta changes rapidly with price moves. 
              Maximum gamma occurs at-the-money.
            </div>
            <div>
              <strong>Theta (Θ):</strong> Time decay - how much option value decreases per day. 
              Always negative for long options. Accelerates as expiration approaches.
            </div>
            <div>
              <strong>Vega (ν):</strong> Sensitivity to implied volatility changes. 
              Long options benefit from volatility increases. ATM options have highest vega.
            </div>
            <div>
              <strong>Rho (ρ):</strong> Sensitivity to interest rate changes. 
              Generally less important for short-term options but crucial for long-dated positions.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};