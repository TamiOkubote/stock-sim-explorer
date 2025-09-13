import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mountain, TrendingUp, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Surface } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12 }
];

// Generate implied volatility surface
const generateVolatilitySurface = (stock: typeof stocksData[0]) => {
  const S = stock.price;
  const strikes = [0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15].map(m => m * S);
  const expirations = [7, 14, 30, 60, 90, 120, 180, 365]; // Days to expiration
  
  const surface = [];
  
  for (const T of expirations) {
    for (const K of strikes) {
      const moneyness = K / S;
      const timeToMaturity = T / 365;
      
      // Volatility smile/skew model
      const atmVol = 0.25 + Math.random() * 0.15; // 25-40% base volatility
      
      // Volatility skew (put skew)
      const skew = -0.1 * (moneyness - 1); // Negative skew for puts
      
      // Volatility smile (higher vol for deep ITM/OTM)
      const smile = 0.05 * Math.pow(moneyness - 1, 2);
      
      // Term structure (volatility term structure)
      const termStructure = 0.02 * Math.exp(-2 * timeToMaturity); // Short-term volatility premium
      
      // Volatility clustering effect
      const clustering = 0.01 * (Math.random() - 0.5);
      
      const impliedVol = Math.max(0.05, atmVol + skew + smile + termStructure + clustering);
      
      surface.push({
        strike: K,
        expiration: T,
        moneyness: parseFloat(moneyness.toFixed(3)),
        timeToMaturity: parseFloat(timeToMaturity.toFixed(4)),
        impliedVol: parseFloat(impliedVol.toFixed(4)),
        impliedVolPercent: parseFloat((impliedVol * 100).toFixed(2))
      });
    }
  }
  
  return surface;
};

// Calculate volatility smile for different expirations
const calculateVolatilitySmile = (surface: any[], expiration: number) => {
  return surface
    .filter(point => point.expiration === expiration)
    .sort((a, b) => a.moneyness - b.moneyness);
};

// Calculate term structure
const calculateTermStructure = (surface: any[], moneyness: number = 1.0) => {
  const atmPoints = surface
    .filter(point => Math.abs(point.moneyness - moneyness) < 0.01)
    .sort((a, b) => a.timeToMaturity - b.timeToMaturity);
  
  return atmPoints.length > 0 ? atmPoints : 
    surface.filter(point => point.moneyness === 1.0).sort((a, b) => a.timeToMaturity - b.timeToMaturity);
};

// Volatility surface interpolation (simplified)
const interpolateVolatility = (surface: any[], targetMoneyness: number, targetMaturity: number) => {
  // Find closest points
  const sortedByDistance = surface
    .map(point => ({
      ...point,
      distance: Math.sqrt(
        Math.pow(point.moneyness - targetMoneyness, 2) + 
        Math.pow(point.timeToMaturity - targetMaturity, 2)
      )
    }))
    .sort((a, b) => a.distance - b.distance);
  
  // Use inverse distance weighting
  const weights = sortedByDistance.slice(0, 4).map(point => 1 / (point.distance + 0.001));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  const interpolatedVol = sortedByDistance.slice(0, 4)
    .reduce((sum, point, i) => sum + point.impliedVol * weights[i], 0) / totalWeight;
  
  return interpolatedVol;
};

export const VolatilitySurface = () => {
  const surfaceData = stocksData.map(stock => {
    const surface = generateVolatilitySurface(stock);
    
    // Calculate different views
    const smile30d = calculateVolatilitySmile(surface, 30);
    const smile90d = calculateVolatilitySmile(surface, 90);
    const termStructure = calculateTermStructure(surface);
    
    // Volatility statistics
    const avgVol = surface.reduce((sum, p) => sum + p.impliedVol, 0) / surface.length;
    const minVol = Math.min(...surface.map(p => p.impliedVol));
    const maxVol = Math.max(...surface.map(p => p.impliedVol));
    const volOfVol = Math.sqrt(
      surface.reduce((sum, p) => sum + Math.pow(p.impliedVol - avgVol, 2), 0) / surface.length
    );
    
    return {
      ...stock,
      surface,
      smile30d,
      smile90d,
      termStructure,
      stats: {
        avgVol: avgVol * 100,
        minVol: minVol * 100,
        maxVol: maxVol * 100,
        volOfVol: volOfVol * 100,
        skew: (smile30d[0]?.impliedVol - smile30d[smile30d.length - 1]?.impliedVol) * 100 || 0
      }
    };
  });

  // Market-wide volatility metrics
  const marketMetrics = {
    avgImpliedVol: surfaceData.reduce((sum, s) => sum + s.stats.avgVol, 0) / surfaceData.length,
    maxSkew: Math.max(...surfaceData.map(s => Math.abs(s.stats.skew))),
    avgVolOfVol: surfaceData.reduce((sum, s) => sum + s.stats.volOfVol, 0) / surfaceData.length
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-secondary/5 to-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mountain className="h-5 w-5 text-secondary" />
            <span>Implied Volatility Surface & Modeling</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-secondary">
                {marketMetrics.avgImpliedVol.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Implied Vol</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {marketMetrics.maxSkew.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Max Vol Skew</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {marketMetrics.avgVolOfVol.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">Vol of Vol</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {surfaceData.length * 56}
              </div>
              <div className="text-sm text-muted-foreground">Data Points</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volatility Smile Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {surfaceData.slice(0, 2).map((stock) => (
          <Card key={stock.symbol}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{stock.symbol} - Volatility Smile</span>
                <div className="flex space-x-2">
                  <Badge variant="outline">30D</Badge>
                  <Badge variant="secondary">90D</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      dataKey="moneyness"
                      tickFormatter={(value) => value.toFixed(2)}
                      fontSize={10}
                    />
                    <YAxis 
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(value) => `${value.toFixed(1)}%`}
                      fontSize={10}
                    />
                    <Tooltip 
                      formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
                      labelFormatter={(value) => `Moneyness: ${Number(value).toFixed(3)}`}
                    />
                    <Line 
                      data={stock.smile30d}
                      type="monotone" 
                      dataKey="impliedVolPercent" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="30-Day IV"
                    />
                    <Line 
                      data={stock.smile90d}
                      type="monotone" 
                      dataKey="impliedVolPercent" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      name="90-Day IV"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-lg font-bold text-primary">{stock.stats.avgVol.toFixed(1)}%</div>
                  <div className="text-muted-foreground">Average IV</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-destructive">
                    {stock.stats.skew > 0 ? '+' : ''}{stock.stats.skew.toFixed(1)}%
                  </div>
                  <div className="text-muted-foreground">Vol Skew</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Term Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-info" />
            <span>Volatility Term Structure</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number"
                  domain={[0, 1]}
                  dataKey="timeToMaturity"
                  tickFormatter={(value) => `${(value * 365).toFixed(0)}d`}
                  fontSize={10}
                />
                <YAxis 
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  fontSize={10}
                />
                <Tooltip 
                  formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
                  labelFormatter={(value) => `${(Number(value) * 365).toFixed(0)} days`}
                />
                {surfaceData.map((stock, index) => (
                  <Line 
                    key={stock.symbol}
                    data={stock.termStructure}
                    type="monotone" 
                    dataKey="impliedVolPercent" 
                    stroke={`hsl(var(--${['primary', 'secondary', 'info', 'success'][index]}))`}
                    strokeWidth={2}
                    name={stock.symbol}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              <strong>Term Structure:</strong> Shows how implied volatility changes with time to expiration for ATM options. 
              Upward sloping indicates higher volatility expectations for longer-dated options.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Volatility Surface 3D Representation (as scatter plot) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-warning" />
            <span>Volatility Surface (3D View)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number"
                  dataKey="moneyness"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => value.toFixed(2)}
                  label={{ value: 'Moneyness', position: 'insideBottom', offset: -10 }}
                  fontSize={10}
                />
                <YAxis 
                  type="number"
                  dataKey="timeToMaturity"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => `${(value * 365).toFixed(0)}d`}
                  label={{ value: 'Time to Maturity', angle: -90, position: 'insideLeft' }}
                  fontSize={10}
                />
                <Tooltip 
                  formatter={(value, name, props) => [
                    name === 'impliedVolPercent' ? `${Number(value).toFixed(2)}%` : value,
                    name === 'impliedVolPercent' ? 'Implied Vol' : name
                  ]}
                  labelFormatter={(_, payload) => 
                    payload?.[0] ? 
                    `Moneyness: ${payload[0].payload.moneyness}, Expiry: ${(payload[0].payload.timeToMaturity * 365).toFixed(0)}d` : ''
                  }
                />
                {surfaceData.slice(0, 2).map((stock, index) => (
                  <Scatter 
                    key={stock.symbol}
                    data={stock.surface}
                    fill={`hsl(var(--${['primary', 'secondary'][index]}))`}
                    fillOpacity={0.6}
                    name={stock.symbol}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Individual Stock Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Volatility Surface Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-right p-2">Avg IV</th>
                  <th className="text-right p-2">Min IV</th>
                  <th className="text-right p-2">Max IV</th>
                  <th className="text-right p-2">Vol of Vol</th>
                  <th className="text-right p-2">Skew</th>
                  <th className="text-right p-2">Surface Quality</th>
                </tr>
              </thead>
              <tbody>
                {surfaceData.map((stock) => (
                  <tr key={stock.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{stock.symbol}</td>
                    <td className="text-right p-2 text-primary">
                      {stock.stats.avgVol.toFixed(2)}%
                    </td>
                    <td className="text-right p-2 text-success">
                      {stock.stats.minVol.toFixed(2)}%
                    </td>
                    <td className="text-right p-2 text-warning">
                      {stock.stats.maxVol.toFixed(2)}%
                    </td>
                    <td className="text-right p-2 text-info">
                      {stock.stats.volOfVol.toFixed(3)}%
                    </td>
                    <td className="text-right p-2">
                      <span className={stock.stats.skew > 0 ? 'text-success' : 'text-destructive'}>
                        {stock.stats.skew > 0 ? '+' : ''}{stock.stats.skew.toFixed(2)}%
                      </span>
                    </td>
                    <td className="text-right p-2">
                      <Badge 
                        variant={stock.stats.volOfVol < 2 ? 'default' : stock.stats.volOfVol < 4 ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {stock.stats.volOfVol < 2 ? 'Smooth' : stock.stats.volOfVol < 4 ? 'Moderate' : 'Noisy'}
                      </Badge>
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
          <CardTitle>Volatility Surface Interpretation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div>
              <strong>Volatility Smile:</strong> U-shaped pattern where OTM puts and calls have higher implied volatility 
              than ATM options. Reflects market pricing of tail risks and supply/demand imbalances.
            </div>
            <div>
              <strong>Term Structure:</strong> How volatility changes with time to expiration. 
              Backwardation (downward slope) indicates near-term uncertainty, while contango suggests rising long-term risk.
            </div>
            <div>
              <strong>Volatility Skew:</strong> Asymmetry in the smile, typically negative for equities due to 
              crash fears. Put options command higher premiums than calls at equivalent distances from ATM.
            </div>
            <div>
              <strong>Trading Applications:</strong> Surface arbitrage, volatility trading, risk management, 
              and exotic option pricing all rely on accurate volatility surface modeling.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};