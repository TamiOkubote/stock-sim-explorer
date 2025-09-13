import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Shield, TrendingUp } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34, volatility: 0.28 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23, volatility: 0.35 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45, volatility: 0.45 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12, volatility: 0.25 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.65, change: -0.87, volatility: 0.30 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 140.15, change: 4.23, volatility: 0.42 },
  { symbol: "AMZN", name: "Amazon.com", price: 186.29, change: 0.98, volatility: 0.32 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 416.42, change: 1.67, volatility: 0.27 }
];

// Risk Parity Optimization
const calculateRiskParityWeights = (assets: typeof stocksData) => {
  // Inverse volatility weighting as starting point
  const invVolatilities = assets.map(asset => 1 / asset.volatility);
  const sumInvVol = invVolatilities.reduce((sum, invVol) => sum + invVol, 0);
  
  // Initial weights based on inverse volatility
  let weights = invVolatilities.map(invVol => invVol / sumInvVol);
  
  // Iterative risk parity optimization (simplified)
  for (let iter = 0; iter < 50; iter++) {
    const riskContributions = weights.map((weight, i) => 
      weight * Math.pow(assets[i].volatility, 2) * weight
    );
    
    const totalRisk = Math.sqrt(riskContributions.reduce((sum, rc) => sum + rc, 0));
    const targetRiskContrib = totalRisk / assets.length;
    
    // Adjust weights to equalize risk contributions
    weights = weights.map((weight, i) => {
      const currentRiskContrib = riskContributions[i];
      const adjustment = Math.sqrt(targetRiskContrib / Math.max(currentRiskContrib, 0.0001));
      return weight * adjustment;
    });
    
    // Normalize weights
    const sumWeights = weights.reduce((sum, w) => sum + w, 0);
    weights = weights.map(w => w / sumWeights);
  }
  
  return weights;
};

// Calculate risk contributions
const calculateRiskContributions = (weights: number[], volatilities: number[]) => {
  const portfolioVolatility = Math.sqrt(
    weights.reduce((sum, weight, i) => sum + Math.pow(weight * volatilities[i], 2), 0)
  );
  
  return weights.map((weight, i) => ({
    marginalRisk: weight * Math.pow(volatilities[i], 2) / portfolioVolatility,
    riskContribution: (weight * Math.pow(volatilities[i], 2) * weight) / Math.pow(portfolioVolatility, 2),
    percentRiskContribution: (weight * Math.pow(volatilities[i], 2) * weight) / Math.pow(portfolioVolatility, 2) * 100
  }));
};

// Equal Weight Portfolio for comparison
const equalWeights = stocksData.map(() => 1 / stocksData.length);

// Market Cap Weighted Portfolio (approximation)
const marketCapWeights = [0.18, 0.15, 0.08, 0.20, 0.16, 0.10, 0.13, 0.17]; // Normalized approximation

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))', 'hsl(var(--accent))'];

export const RiskParity = () => {
  const riskParityWeights = calculateRiskParityWeights(stocksData);
  const volatilities = stocksData.map(stock => stock.volatility);
  
  // Calculate risk contributions for each portfolio
  const rpRiskContribs = calculateRiskContributions(riskParityWeights, volatilities);
  const ewRiskContribs = calculateRiskContributions(equalWeights, volatilities);
  const mcRiskContribs = calculateRiskContributions(marketCapWeights, volatilities);
  
  // Portfolio metrics
  const calculatePortfolioMetrics = (weights: number[]) => {
    const portfolioVol = Math.sqrt(
      weights.reduce((sum, weight, i) => sum + Math.pow(weight * volatilities[i], 2), 0)
    );
    
    const diversificationRatio = weights.reduce((sum, weight, i) => sum + weight * volatilities[i], 0) / portfolioVol;
    
    const riskContributions = calculateRiskContributions(weights, volatilities);
    const maxRiskContrib = Math.max(...riskContributions.map(rc => rc.percentRiskContribution));
    const minRiskContrib = Math.min(...riskContributions.map(rc => rc.percentRiskContribution));
    const riskConcentration = maxRiskContrib / minRiskContrib;
    
    return {
      portfolioVolatility: portfolioVol,
      diversificationRatio,
      riskConcentration,
      maxRiskContribution: maxRiskContrib,
      minRiskContribution: minRiskContrib
    };
  };
  
  const rpMetrics = calculatePortfolioMetrics(riskParityWeights);
  const ewMetrics = calculatePortfolioMetrics(equalWeights);
  const mcMetrics = calculatePortfolioMetrics(marketCapWeights);
  
  // Prepare data for charts
  const portfolioComparison = [
    { name: 'Risk Parity', volatility: rpMetrics.portfolioVolatility * 100, diversification: rpMetrics.diversificationRatio, concentration: rpMetrics.riskConcentration },
    { name: 'Equal Weight', volatility: ewMetrics.portfolioVolatility * 100, diversification: ewMetrics.diversificationRatio, concentration: ewMetrics.riskConcentration },
    { name: 'Market Cap', volatility: mcMetrics.portfolioVolatility * 100, diversification: mcMetrics.diversificationRatio, concentration: mcMetrics.riskConcentration }
  ];
  
  const riskParityData = stocksData.map((stock, index) => ({
    symbol: stock.symbol,
    weight: riskParityWeights[index] * 100,
    riskContribution: rpRiskContribs[index].percentRiskContribution,
    volatility: stock.volatility * 100,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-secondary/5 to-success/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-secondary" />
            <span>Risk Parity Portfolio Optimization</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-secondary">
                {rpMetrics.diversificationRatio.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Diversification Ratio</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {rpMetrics.riskConcentration.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Risk Concentration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {(rpMetrics.portfolioVolatility * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Portfolio Volatility</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {(rpMetrics.maxRiskContribution - rpMetrics.minRiskContribution).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Risk Spread</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Parity Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Risk Parity Allocation</span>
              <Badge variant="default">Optimized</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={riskParityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="weight"
                    label={({ symbol, weight }) => `${symbol}: ${weight.toFixed(1)}%`}
                    labelLine={false}
                    fontSize={10}
                  >
                    {riskParityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-secondary">Equal Risk Contribution</div>
              <div className="text-sm text-muted-foreground">Each asset contributes ~{(100/stocksData.length).toFixed(1)}% to total risk</div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Contributions Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Contribution Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskParityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="symbol" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Risk Contribution']} />
                  <Bar dataKey="riskContribution" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="text-center mt-2">
              <div className="text-sm text-muted-foreground">
                Risk contributions are balanced across all assets
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-info" />
            <span>Portfolio Strategy Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portfolioComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="volatility" fill="hsl(var(--primary))" name="Portfolio Volatility %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Strategy</th>
                    <th className="text-right p-2">Portfolio Vol</th>
                    <th className="text-right p-2">Diversification Ratio</th>
                    <th className="text-right p-2">Risk Concentration</th>
                    <th className="text-right p-2">Max Risk Contrib</th>
                    <th className="text-right p-2">Min Risk Contrib</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-muted/30 bg-secondary/10">
                    <td className="p-2 font-medium">Risk Parity</td>
                    <td className="text-right p-2 text-primary">{(rpMetrics.portfolioVolatility * 100).toFixed(2)}%</td>
                    <td className="text-right p-2 text-success">{rpMetrics.diversificationRatio.toFixed(3)}</td>
                    <td className="text-right p-2 text-info">{rpMetrics.riskConcentration.toFixed(2)}</td>
                    <td className="text-right p-2">{rpMetrics.maxRiskContribution.toFixed(1)}%</td>
                    <td className="text-right p-2">{rpMetrics.minRiskContribution.toFixed(1)}%</td>
                  </tr>
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">Equal Weight</td>
                    <td className="text-right p-2 text-primary">{(ewMetrics.portfolioVolatility * 100).toFixed(2)}%</td>
                    <td className="text-right p-2 text-success">{ewMetrics.diversificationRatio.toFixed(3)}</td>
                    <td className="text-right p-2 text-info">{ewMetrics.riskConcentration.toFixed(2)}</td>
                    <td className="text-right p-2">{ewMetrics.maxRiskContribution.toFixed(1)}%</td>
                    <td className="text-right p-2">{ewMetrics.minRiskContribution.toFixed(1)}%</td>
                  </tr>
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">Market Cap</td>
                    <td className="text-right p-2 text-primary">{(mcMetrics.portfolioVolatility * 100).toFixed(2)}%</td>
                    <td className="text-right p-2 text-success">{mcMetrics.diversificationRatio.toFixed(3)}</td>
                    <td className="text-right p-2 text-info">{mcMetrics.riskConcentration.toFixed(2)}</td>
                    <td className="text-right p-2">{mcMetrics.maxRiskContribution.toFixed(1)}%</td>
                    <td className="text-right p-2">{mcMetrics.minRiskContribution.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Asset Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Parity Asset Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Asset</th>
                  <th className="text-right p-2">Weight</th>
                  <th className="text-right p-2">Volatility</th>
                  <th className="text-right p-2">Risk Contribution</th>
                  <th className="text-right p-2">Marginal Risk</th>
                </tr>
              </thead>
              <tbody>
                {riskParityData.map((asset, index) => (
                  <tr key={asset.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stocksData[index].name}</div>
                      </div>
                    </td>
                    <td className="text-right p-2 text-primary">
                      {asset.weight.toFixed(2)}%
                    </td>
                    <td className="text-right p-2 text-warning">
                      {asset.volatility.toFixed(1)}%
                    </td>
                    <td className="text-right p-2 text-secondary">
                      {asset.riskContribution.toFixed(2)}%
                    </td>
                    <td className="text-right p-2 text-info">
                      {rpRiskContribs[index].marginalRisk.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Risk Parity Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Parity Methodology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div>
              <strong>Objective:</strong> Construct a portfolio where each asset contributes equally to the total portfolio risk, 
              rather than having equal dollar weights.
            </div>
            <div>
              <strong>Benefits:</strong> Better diversification, reduced concentration risk, and improved risk-adjusted returns 
              compared to traditional cap-weighted portfolios.
            </div>
            <div>
              <strong>Implementation:</strong> Uses iterative optimization to solve for weights where risk contributions are equalized. 
              The algorithm minimizes the sum of squared deviations from equal risk contribution.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};