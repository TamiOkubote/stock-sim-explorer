import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Target, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34, sector: "Healthcare" },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23, sector: "Technology" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45, sector: "Automotive" },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12, sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.65, change: -0.87, sector: "Technology" },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 140.15, change: 4.23, sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com", price: 186.29, change: 0.98, sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 416.42, change: 1.67, sector: "Technology" }
];

// Generate correlated returns for PCA analysis
const generateCorrelatedReturns = (n: number = 252) => {
  const returns = [];
  
  // Market factor (common to all stocks)
  const marketReturns = Array.from({length: n}, () => (Math.random() - 0.5) * 0.04);
  
  // Sector factors
  const techFactor = Array.from({length: n}, () => (Math.random() - 0.5) * 0.03);
  const healthcareFactor = Array.from({length: n}, () => (Math.random() - 0.5) * 0.025);
  const autoFactor = Array.from({length: n}, () => (Math.random() - 0.5) * 0.035);
  
  for (let i = 0; i < n; i++) {
    const dayReturns: { [key: string]: any } = { day: i + 1 };
    
    stocksData.forEach(stock => {
      let sectorFactor = 0;
      switch (stock.sector) {
        case "Technology":
          sectorFactor = techFactor[i];
          break;
        case "Healthcare":
          sectorFactor = healthcareFactor[i];
          break;
        case "Automotive":
          sectorFactor = autoFactor[i];
          break;
      }
      
      // Stock return = beta_market * market + beta_sector * sector + idiosyncratic
      const beta_market = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const beta_sector = 0.3 + Math.random() * 0.4;  // 0.3 to 0.7
      const idiosyncratic = (Math.random() - 0.5) * 0.02;
      
      dayReturns[stock.symbol] = beta_market * marketReturns[i] + beta_sector * sectorFactor + idiosyncratic;
    });
    
    returns.push(dayReturns);
  }
  
  return returns;
};

// Simplified PCA implementation
const performPCA = (data: any[]) => {
  const symbols = stocksData.map(s => s.symbol);
  const n = data.length;
  const k = symbols.length;
  
  // Create returns matrix
  const returnsMatrix = data.map(row => symbols.map(symbol => row[symbol]));
  
  // Calculate means
  const means = symbols.map(symbol => 
    data.reduce((sum, row) => sum + row[symbol], 0) / n
  );
  
  // Center the data
  const centeredMatrix = returnsMatrix.map(row => 
    row.map((val, i) => val - means[i])
  );
  
  // Calculate covariance matrix (simplified)
  const covMatrix = Array(k).fill(0).map(() => Array(k).fill(0));
  
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      let covariance = 0;
      for (let t = 0; t < n; t++) {
        covariance += centeredMatrix[t][i] * centeredMatrix[t][j];
      }
      covMatrix[i][j] = covariance / (n - 1);
    }
  }
  
  // Simplified eigenvalue/eigenvector calculation (using power iteration for first PC)
  let eigenvector = Array(k).fill(1/Math.sqrt(k)); // Initial guess
  
  for (let iter = 0; iter < 100; iter++) {
    const newVector = Array(k).fill(0);
    
    // Matrix-vector multiplication: Av
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        newVector[i] += covMatrix[i][j] * eigenvector[j];
      }
    }
    
    // Normalize
    const norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
    eigenvector = newVector.map(val => val / norm);
  }
  
  // Calculate eigenvalue
  let eigenvalue = 0;
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      eigenvalue += eigenvector[i] * covMatrix[i][j] * eigenvector[j];
    }
  }
  
  // Calculate factor loadings and scores
  const factorLoadings = symbols.map((symbol, i) => ({
    symbol,
    pc1Loading: eigenvector[i],
    pc1LoadingSquared: eigenvector[i] * eigenvector[i]
  }));
  
  // Calculate principal component scores
  const pcScores = centeredMatrix.map((row, t) => ({
    day: t + 1,
    pc1Score: row.reduce((sum, val, i) => sum + val * eigenvector[i], 0)
  }));
  
  // Calculate explained variance
  const totalVariance = covMatrix.reduce((sum, row, i) => sum + row[i], 0);
  const explainedVariance = eigenvalue / totalVariance;
  
  return {
    factorLoadings,
    pcScores: pcScores.slice(-60), // Last 60 days for charting
    explainedVariance,
    eigenvalue,
    eigenvector,
    covarianceMatrix: covMatrix
  };
};

// Factor model estimation
const estimateFactorModel = (returns: any[]) => {
  const pca = performPCA(returns);
  
  // Calculate factor betas for each stock
  const factorBetas = stocksData.map((stock, i) => {
    const stockReturns = returns.map(r => r[stock.symbol]);
    const factorReturns = pca.pcScores.map(pc => pc.pc1Score);
    
    // Simple regression: stock_return = alpha + beta * factor + error
    const n = Math.min(stockReturns.length, factorReturns.length);
    let sumXY = 0, sumX = 0, sumY = 0, sumXX = 0;
    
    for (let j = 0; j < n; j++) {
      const x = factorReturns[j] || 0;
      const y = stockReturns[stockReturns.length - n + j] || 0;
      sumXY += x * y;
      sumX += x;
      sumY += y;
      sumXX += x * x;
    }
    
    const beta = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    const alpha = (sumY - beta * sumX) / n;
    
    // Calculate R-squared
    const meanY = sumY / n;
    let ssTotal = 0, ssResidual = 0;
    
    for (let j = 0; j < n; j++) {
      const x = factorReturns[j] || 0;
      const y = stockReturns[stockReturns.length - n + j] || 0;
      const predicted = alpha + beta * x;
      
      ssTotal += Math.pow(y - meanY, 2);
      ssResidual += Math.pow(y - predicted, 2);
    }
    
    const rSquared = 1 - (ssResidual / ssTotal);
    
    return {
      symbol: stock.symbol,
      alpha: alpha * 100, // Convert to percentage
      beta,
      rSquared: Math.max(0, rSquared),
      idiosyncraticRisk: Math.sqrt(ssResidual / (n - 2)) * 100
    };
  });
  
  return { pca, factorBetas };
};

export const PCAFactorModels = () => {
  const returnsData = generateCorrelatedReturns(252);
  const { pca, factorBetas } = estimateFactorModel(returnsData);
  
  // Prepare radar chart data for factor loadings
  const radarData = pca.factorLoadings.map(loading => ({
    symbol: loading.symbol,
    loading: Math.abs(loading.pc1Loading),
    fullMark: 1
  }));
  
  // Risk decomposition
  const riskDecomposition = factorBetas.map(beta => ({
    symbol: beta.symbol,
    systematicRisk: Math.pow(beta.beta, 2) * pca.eigenvalue * 100,
    idiosyncraticRisk: Math.pow(beta.idiosyncraticRisk, 2),
    totalRisk: Math.pow(beta.beta, 2) * pca.eigenvalue * 100 + Math.pow(beta.idiosyncraticRisk, 2)
  }));

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-info/5 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5 text-info" />
            <span>Principal Component Analysis & Factor Models</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-info">
                {(pca.explainedVariance * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Variance Explained (PC1)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {factorBetas.filter(b => b.rSquared > 0.5).length}
              </div>
              <div className="text-sm text-muted-foreground">High R² Stocks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {factorBetas.reduce((sum, b) => sum + b.rSquared, 0) / factorBetas.length > 0.5 ? "Good" : "Moderate"}
              </div>
              <div className="text-sm text-muted-foreground">Model Fit</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {Math.max(...factorBetas.map(b => Math.abs(b.beta))).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Max Factor Beta</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Factor Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Principal Component Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>First Principal Component</span>
              <Badge variant="outline">PC1</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pca.pcScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(4)}`, 'PC1 Score']} />
                  <Line 
                    type="monotone" 
                    dataKey="pc1Score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="PC1"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
              <div className="text-sm text-muted-foreground">
                Explains {(pca.explainedVariance * 100).toFixed(1)}% of total variance
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Factor Loadings Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Factor Loadings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="symbol" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} tickCount={4} fontSize={8} />
                  <Radar 
                    dataKey="loading" 
                    stroke="hsl(var(--info))" 
                    fill="hsl(var(--info))" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
              <div className="text-sm text-muted-foreground">
                Higher loadings indicate stronger factor exposure
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Factor Model Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Single-Factor Model Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-right p-2">Alpha (%)</th>
                  <th className="text-right p-2">Beta</th>
                  <th className="text-right p-2">R²</th>
                  <th className="text-right p-2">Idiosyncratic Risk (%)</th>
                  <th className="text-right p-2">Factor Loading</th>
                </tr>
              </thead>
              <tbody>
                {factorBetas.map((beta, index) => {
                  const loading = pca.factorLoadings[index];
                  return (
                    <tr key={beta.symbol} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-medium">{beta.symbol}</td>
                      <td className="text-right p-2">
                        <span className={beta.alpha > 0 ? 'text-success' : 'text-destructive'}>
                          {beta.alpha.toFixed(3)}
                        </span>
                      </td>
                      <td className="text-right p-2 text-primary">
                        {beta.beta.toFixed(3)}
                      </td>
                      <td className="text-right p-2">
                        <Badge 
                          variant={beta.rSquared > 0.7 ? 'default' : beta.rSquared > 0.4 ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {beta.rSquared.toFixed(3)}
                        </Badge>
                      </td>
                      <td className="text-right p-2 text-warning">
                        {beta.idiosyncraticRisk.toFixed(2)}
                      </td>
                      <td className="text-right p-2 text-info">
                        {loading.pc1Loading.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Risk Decomposition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <span>Risk Decomposition Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDecomposition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="symbol" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(value, name) => [`${Number(value).toFixed(3)}`, name]} />
                  <Bar dataKey="systematicRisk" stackId="a" fill="hsl(var(--primary))" name="Systematic Risk" />
                  <Bar dataKey="idiosyncraticRisk" stackId="a" fill="hsl(var(--secondary))" name="Idiosyncratic Risk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div>
                <div className="text-lg font-bold text-primary">
                  {(riskDecomposition.reduce((sum, r) => sum + r.systematicRisk, 0) / riskDecomposition.length).toFixed(2)}
                </div>
                <div className="text-muted-foreground">Avg Systematic Risk</div>
              </div>
              <div>
                <div className="text-lg font-bold text-secondary">
                  {(riskDecomposition.reduce((sum, r) => sum + r.idiosyncraticRisk, 0) / riskDecomposition.length).toFixed(2)}
                </div>
                <div className="text-muted-foreground">Avg Idiosyncratic Risk</div>
              </div>
              <div>
                <div className="text-lg font-bold text-info">
                  {(riskDecomposition.reduce((sum, r) => sum + r.systematicRisk, 0) / 
                    riskDecomposition.reduce((sum, r) => sum + r.totalRisk, 0) * 100).toFixed(1)}%
                </div>
                <div className="text-muted-foreground">Systematic %</div>
              </div>
              <div>
                <div className="text-lg font-bold text-warning">
                  {stocksData.filter(s => s.sector === "Technology").length}
                </div>
                <div className="text-muted-foreground">Tech Stocks</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>PCA & Factor Model Methodology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div>
              <strong>Principal Component Analysis:</strong> Decomposes the covariance matrix of stock returns to identify 
              the most important common factors driving portfolio risk and return.
            </div>
            <div>
              <strong>Factor Loadings:</strong> Measure how much each stock is influenced by the principal component. 
              Higher absolute loadings indicate stronger factor exposure.
            </div>
            <div>
              <strong>Risk Decomposition:</strong> Separates total risk into systematic risk (factor-driven) and 
              idiosyncratic risk (stock-specific). Useful for portfolio diversification and risk management.
            </div>
            <div>
              <strong>Applications:</strong> Factor models are used for portfolio optimization, risk attribution, 
              performance attribution, and constructing market-neutral strategies.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};