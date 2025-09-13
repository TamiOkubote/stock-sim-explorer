import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Target, TrendingUp } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", return: 0.142, volatility: 0.28, weight: 0.15 },
  { symbol: "META", name: "Meta Platforms", return: 0.089, volatility: 0.35, weight: 0.12 },
  { symbol: "TSLA", name: "Tesla Inc.", return: 0.156, volatility: 0.45, weight: 0.08 },
  { symbol: "AAPL", name: "Apple Inc.", return: 0.098, volatility: 0.25, weight: 0.18 },
  { symbol: "GOOGL", name: "Alphabet Inc.", return: 0.076, volatility: 0.30, weight: 0.14 },
  { symbol: "NVDA", name: "NVIDIA Corp.", return: 0.234, volatility: 0.42, weight: 0.10 },
  { symbol: "AMZN", name: "Amazon.com", return: 0.067, volatility: 0.32, weight: 0.13 },
  { symbol: "MSFT", name: "Microsoft Corp.", return: 0.112, volatility: 0.27, weight: 0.10 }
];

// Calculate portfolio metrics
const calculatePortfolioMetrics = (stocks: typeof stocksData) => {
  const portfolioReturn = stocks.reduce((sum, stock) => sum + (stock.return * stock.weight), 0);
  
  // Simplified portfolio volatility (assuming no correlation for demonstration)
  const portfolioVariance = stocks.reduce((sum, stock) => sum + Math.pow(stock.weight * stock.volatility, 2), 0);
  const portfolioVolatility = Math.sqrt(portfolioVariance);
  
  const sharpeRatio = portfolioReturn / portfolioVolatility;
  
  return { portfolioReturn, portfolioVolatility, sharpeRatio };
};

// Black-Litterman simplified calculation
const calculateBLWeights = (stocks: typeof stocksData) => {
  // Simplified BL - in reality this would involve market cap weights, investor views, etc.
  const marketWeights = [0.20, 0.15, 0.05, 0.25, 0.15, 0.08, 0.12, 0.18]; // Market cap based
  const tau = 0.05; // Scaling factor
  
  return stocks.map((stock, i) => ({
    ...stock,
    blWeight: marketWeights[i] * (1 + tau * (stock.return - 0.08)) // Adjusted for expected returns
  }));
};

// Generate efficient frontier points
const generateEfficientFrontier = () => {
  const points = [];
  for (let risk = 0.15; risk <= 0.45; risk += 0.02) {
    const expectedReturn = 0.05 + (risk - 0.15) * 0.4; // Linear relationship for demo
    points.push({
      risk: risk * 100,
      return: expectedReturn * 100,
      sharpe: expectedReturn / risk
    });
  }
  return points;
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))', 'hsl(var(--accent))'];

export const PortfolioOptimization = () => {
  const currentMetrics = calculatePortfolioMetrics(stocksData);
  const blWeights = calculateBLWeights(stocksData);
  const efficientFrontier = generateEfficientFrontier();
  
  // Prepare data for pie chart
  const pieData = stocksData.map((stock, index) => ({
    name: stock.symbol,
    value: stock.weight * 100,
    color: COLORS[index % COLORS.length]
  }));

  const blPieData = blWeights.map((stock, index) => ({
    name: stock.symbol,
    value: (stock.blWeight || 0) * 100,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Portfolio Optimization Algorithms</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">Mean-Variance</div>
              <div className="text-sm text-muted-foreground">Markowitz Model</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">Black-Litterman</div>
              <div className="text-sm text-muted-foreground">Bayesian Approach</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">Risk Parity</div>
              <div className="text-sm text-muted-foreground">Equal Risk Contribution</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Allocation Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Mean-Variance Portfolio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mean-Variance Optimization</span>
              <Badge variant="outline">Current</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    labelLine={false}
                    fontSize={10}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {(currentMetrics.portfolioReturn * 100).toFixed(1)}%
                </div>
                <div className="text-muted-foreground">Expected Return</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">
                  {(currentMetrics.portfolioVolatility * 100).toFixed(1)}%
                </div>
                <div className="text-muted-foreground">Portfolio Risk</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-info">
                {currentMetrics.sharpeRatio.toFixed(2)}
              </div>
              <div className="text-muted-foreground">Sharpe Ratio</div>
            </div>
          </CardContent>
        </Card>

        {/* Black-Litterman Portfolio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Black-Litterman Model</span>
              <Badge variant="secondary">Optimized</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={blPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    labelLine={false}
                    fontSize={10}
                  >
                    {blPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-success">
                  {(calculatePortfolioMetrics(blWeights).portfolioReturn * 100).toFixed(1)}%
                </div>
                <div className="text-muted-foreground">Expected Return</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">
                  {(calculatePortfolioMetrics(blWeights).portfolioVolatility * 100).toFixed(1)}%
                </div>
                <div className="text-muted-foreground">Portfolio Risk</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {calculatePortfolioMetrics(blWeights).sharpeRatio.toFixed(2)}
              </div>
              <div className="text-muted-foreground">Sharpe Ratio</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficient Frontier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-info" />
            <span>Efficient Frontier Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficientFrontier}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="risk" 
                  label={{ value: 'Risk (Volatility %)', position: 'insideBottom', offset: -10 }}
                  fontSize={12}
                />
                <YAxis 
                  dataKey="return"
                  label={{ value: 'Expected Return %', angle: -90, position: 'insideLeft' }}
                  fontSize={12}
                />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${typeof value === 'number' ? value.toFixed(2) : value}${name === 'return' ? '%' : '%'}`, 
                      name === 'return' ? 'Expected Return' : 'Risk'
                    ]}
                  />
                <Area 
                  type="monotone" 
                  dataKey="return" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              <strong>Efficient Frontier:</strong> Shows the optimal risk-return combinations. 
              Points on the curve represent portfolios with maximum expected return for a given level of risk.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Individual Stock Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Asset Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Asset</th>
                  <th className="text-right p-2">Expected Return</th>
                  <th className="text-right p-2">Volatility</th>
                  <th className="text-right p-2">Current Weight</th>
                  <th className="text-right p-2">BL Weight</th>
                  <th className="text-right p-2">Sharpe Ratio</th>
                </tr>
              </thead>
              <tbody>
                {stocksData.map((stock, index) => {
                  const blStock = blWeights[index];
                  return (
                    <tr key={stock.symbol} className="border-b hover:bg-muted/30">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{stock.symbol}</div>
                          <div className="text-xs text-muted-foreground">{stock.name}</div>
                        </div>
                      </td>
                      <td className="text-right p-2 text-success">
                        {(stock.return * 100).toFixed(1)}%
                      </td>
                      <td className="text-right p-2 text-warning">
                        {(stock.volatility * 100).toFixed(1)}%
                      </td>
                      <td className="text-right p-2">
                        {(stock.weight * 100).toFixed(1)}%
                      </td>
                      <td className="text-right p-2 text-info">
                        {((blStock.blWeight || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="text-right p-2">
                        {(stock.return / stock.volatility).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};