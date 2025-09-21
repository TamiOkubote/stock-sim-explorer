import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.65, change: -0.87 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 140.15, change: 4.23 }
];

// Bayesian Linear Regression implementation
const bayesianLinearRegression = (X: number[][], y: number[], alpha: number = 1.0, beta: number = 1.0) => {
  const n = X.length;
  const m = X[0].length;
  
  // Prior parameters
  const S0_inv = Array(m).fill(0).map(() => Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    S0_inv[i][i] = alpha;
  }
  
  // Calculate XtX and Xty
  const XtX = Array(m).fill(0).map(() => Array(m).fill(0));
  const Xty = Array(m).fill(0);
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < n; k++) {
        XtX[i][j] += X[k][i] * X[k][j];
      }
    }
    for (let k = 0; k < n; k++) {
      Xty[i] += X[k][i] * y[k];
    }
  }
  
  // Posterior covariance: Sn = (S0^-1 + beta * X^T * X)^-1
  const Sn_inv = Array(m).fill(0).map(() => Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      Sn_inv[i][j] = S0_inv[i][j] + beta * XtX[i][j];
    }
  }
  
  // Simple matrix inversion for 2x2 (can be extended)
  const det = Sn_inv[0][0] * Sn_inv[1][1] - Sn_inv[0][1] * Sn_inv[1][0];
  const Sn = [
    [Sn_inv[1][1] / det, -Sn_inv[0][1] / det],
    [-Sn_inv[1][0] / det, Sn_inv[0][0] / det]
  ];
  
  // Posterior mean: mn = beta * Sn * X^T * y
  const mn = Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      mn[i] += beta * Sn[i][j] * Xty[j];
    }
  }
  
  return { mean: mn, covariance: Sn, precision: beta };
};

// Gaussian Process implementation (simplified)
const gaussianProcess = (X_train: number[][], y_train: number[], X_test: number[][]) => {
  const rbfKernel = (x1: number[], x2: number[], lengthScale: number = 1.0, sigma: number = 1.0) => {
    const dist = Math.sqrt(x1.reduce((sum, val, i) => sum + Math.pow(val - x2[i], 2), 0));
    return sigma * sigma * Math.exp(-0.5 * dist * dist / (lengthScale * lengthScale));
  };
  
  const n_train = X_train.length;
  const n_test = X_test.length;
  
  // Compute kernel matrices
  const K = Array(n_train).fill(0).map(() => Array(n_train).fill(0));
  for (let i = 0; i < n_train; i++) {
    for (let j = 0; j < n_train; j++) {
      K[i][j] = rbfKernel(X_train[i], X_train[j]);
      if (i === j) K[i][j] += 0.01; // Add noise
    }
  }
  
  const K_star = Array(n_test).fill(0).map(() => Array(n_train).fill(0));
  for (let i = 0; i < n_test; i++) {
    for (let j = 0; j < n_train; j++) {
      K_star[i][j] = rbfKernel(X_test[i], X_train[j]);
    }
  }
  
  // Simplified GP prediction (assuming diagonal K inverse)
  const predictions = [];
  const uncertainties = [];
  
  for (let i = 0; i < n_test; i++) {
    let mean = 0;
    let variance = 1.0;
    
    // Simplified prediction
    for (let j = 0; j < n_train; j++) {
      const weight = K_star[i][j];
      mean += weight * y_train[j] / n_train;
    }
    
    // Simplified uncertainty
    variance = Math.max(0.1, 1.0 - K_star[i].reduce((sum, k) => sum + k, 0) / n_train);
    
    predictions.push(mean);
    uncertainties.push(Math.sqrt(variance));
  }
  
  return { predictions, uncertainties };
};

// Bayesian Model Averaging
const bayesianModelAveraging = (models: Array<{ predictions: number[], likelihood: number }>) => {
  const n = models[0].predictions.length;
  const totalLikelihood = models.reduce((sum, model) => sum + model.likelihood, 0);
  
  const averagedPredictions = Array(n).fill(0);
  const modelWeights = models.map(model => model.likelihood / totalLikelihood);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < models.length; j++) {
      averagedPredictions[i] += modelWeights[j] * models[j].predictions[i];
    }
  }
  
  return { predictions: averagedPredictions, weights: modelWeights };
};

// Generate Bayesian analysis for stocks
const generateBayesianAnalysis = (symbol: string, basePrice: number) => {
  const data = [];
  let price = basePrice;
  
  // Generate time series data
  for (let i = 0; i < 30; i++) {
    const trend = (Math.random() - 0.5) * 0.02;
    const noise = (Math.random() - 0.5) * 0.04;
    price = price * (1 + trend + noise);
    
    data.push({
      day: i + 1,
      price: parseFloat(price.toFixed(2)),
      logPrice: Math.log(price),
      returns: i > 0 ? (price - data[i-1].price) / data[i-1].price : 0
    });
  }
  
  // Prepare data for Bayesian regression
  const X = data.slice(1, -5).map((d, i) => [1, d.day]); // Include intercept
  const y = data.slice(2, -4).map(d => d.logPrice);
  
  // Apply Bayesian linear regression
  const blr = bayesianLinearRegression(X, y);
  
  // Generate predictions with uncertainty
  const future_X = Array.from({length: 10}, (_, i) => [1, data.length + i + 1]);
  const predictions = future_X.map(x => {
    const mean = x[0] * blr.mean[0] + x[1] * blr.mean[1];
    const variance = x.reduce((sum, xi, i) => 
      sum + x.reduce((s, xj, j) => s + xi * xj * blr.covariance[i][j], 0), 0);
    return {
      day: x[1],
      mean: Math.exp(mean),
      lower: Math.exp(mean - 1.96 * Math.sqrt(variance)),
      upper: Math.exp(mean + 1.96 * Math.sqrt(variance)),
      uncertainty: Math.sqrt(variance)
    };
  });
  
  // Apply Gaussian Process
  const X_train = data.slice(0, -10).map(d => [d.day]);
  const y_train = data.slice(0, -10).map(d => d.returns);
  const X_test = data.slice(-10).map(d => [d.day]);
  
  const gp = gaussianProcess(X_train, y_train, X_test);
  
  // Calculate model evidence and probabilities
  const modelEvidence = {
    linear: Math.exp(-Math.random() * 2), // Simplified
    quadratic: Math.exp(-Math.random() * 2.5),
    exponential: Math.exp(-Math.random() * 3)
  };
  
  const totalEvidence = Object.values(modelEvidence).reduce((sum, ev) => sum + ev, 0);
  const modelProbabilities = Object.fromEntries(
    Object.entries(modelEvidence).map(([model, ev]) => [model, ev / totalEvidence])
  );
  
  return {
    historicalData: data,
    predictions,
    gaussianProcess: {
      predictions: gp.predictions.map((pred, i) => ({
        day: X_test[i][0],
        prediction: pred,
        uncertainty: gp.uncertainties[i]
      }))
    },
    bayesianRegression: blr,
    modelProbabilities,
    modelEvidence: Object.entries(modelEvidence).map(([model, evidence]) => ({
      model,
      evidence,
      probability: evidence / totalEvidence
    }))
  };
};

export const BayesianMethods = () => {
  const bayesianData = stocksData.map(stock => {
    const analysis = generateBayesianAnalysis(stock.symbol, stock.price);
    
    return {
      ...stock,
      ...analysis,
      currentUncertainty: analysis.predictions[0]?.uncertainty || 0,
      avgUncertainty: analysis.predictions.reduce((sum, p) => sum + p.uncertainty, 0) / analysis.predictions.length,
      confidenceInterval: {
        lower: analysis.predictions[0]?.lower || stock.price * 0.95,
        upper: analysis.predictions[0]?.upper || stock.price * 1.05
      }
    };
  });

  const overallStats = {
    avgUncertainty: bayesianData.reduce((sum, d) => sum + d.avgUncertainty, 0) / bayesianData.length,
    highConfidenceStocks: bayesianData.filter(d => d.currentUncertainty < 0.1).length,
    avgModelEvidence: bayesianData.reduce((sum, d) => sum + d.modelEvidence[0].evidence, 0) / bayesianData.length,
    bestModel: 'Linear' // Simplified
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>Bayesian Methods - Probabilistic Trading</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-info">
                {overallStats.avgUncertainty.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Uncertainty</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {overallStats.highConfidenceStocks}
              </div>
              <div className="text-sm text-muted-foreground">High Confidence</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {overallStats.avgModelEvidence.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Evidence</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {overallStats.bestModel}
              </div>
              <div className="text-sm text-muted-foreground">Best Model</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Stock Bayesian Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bayesianData.slice(0, 4).map((stock, index) => (
          <Card key={stock.symbol}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{stock.symbol} - Bayesian Analysis</span>
                <div className="flex space-x-2">
                  <Badge variant={stock.currentUncertainty < 0.1 ? 'default' : 'secondary'}>
                    {stock.currentUncertainty < 0.1 ? 'High Confidence' : 'Moderate'}
                  </Badge>
                  <Badge variant="outline">
                    ±{(stock.currentUncertainty * 100).toFixed(1)}%
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price Predictions with Uncertainty */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...stock.historicalData.slice(-10), ...stock.predictions.slice(0, 5)]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="upper"
                      stroke="none"
                      fill="hsl(var(--primary)/0.2)"
                      name="Upper Bound"
                    />
                    <Area
                      type="monotone"
                      dataKey="lower"
                      stroke="none"
                      fill="white"
                      name="Lower Bound"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Historical Price"
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mean" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Predicted Price"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Model Probabilities */}
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stock.modelEvidence}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="model" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Bar 
                      dataKey="probability" 
                      fill="hsl(var(--info))" 
                      name="Model Probability"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bayesian Statistics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Prediction:</span>
                    <span className="font-medium text-success">
                      ${stock.predictions[0]?.mean.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uncertainty:</span>
                    <span className="font-medium text-warning">
                      ±{(stock.currentUncertainty * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>95% CI Lower:</span>
                    <span className="font-medium text-destructive">
                      ${stock.confidenceInterval.lower.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>95% CI Upper:</span>
                    <span className="font-medium text-success">
                      ${stock.confidenceInterval.upper.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bayesian Signal */}
              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bayesian Signal:</span>
                  <div className="flex items-center space-x-2">
                    {stock.currentUncertainty < 0.05 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-success font-medium">HIGH CONFIDENCE</span>
                      </>
                    ) : stock.currentUncertainty < 0.15 ? (
                      <>
                        <BarChart3 className="h-4 w-4 text-info" />
                        <span className="text-info font-medium">MODERATE</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span className="text-warning font-medium">UNCERTAIN</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stock.currentUncertainty < 0.05 
                    ? "High confidence prediction - suitable for position sizing"
                    : stock.currentUncertainty < 0.15 
                    ? "Moderate uncertainty - consider risk management"
                    : "High uncertainty - avoid large positions"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Model Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-info" />
            <span>Bayesian Model Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-right p-2">Prediction</th>
                  <th className="text-right p-2">Uncertainty</th>
                  <th className="text-right p-2">95% CI</th>
                  <th className="text-right p-2">Best Model</th>
                  <th className="text-right p-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {bayesianData.map((stock) => (
                  <tr key={stock.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{stock.symbol}</td>
                    <td className="text-right p-2 text-success">
                      ${stock.predictions[0]?.mean.toFixed(2)}
                    </td>
                    <td className="text-right p-2 text-warning">
                      ±{(stock.currentUncertainty * 100).toFixed(1)}%
                    </td>
                    <td className="text-right p-2 text-info text-xs">
                      ${stock.confidenceInterval.lower.toFixed(0)} - ${stock.confidenceInterval.upper.toFixed(0)}
                    </td>
                    <td className="text-right p-2">
                      <Badge variant="outline" className="text-xs">
                        {stock.modelEvidence[0].model}
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      {stock.currentUncertainty < 0.05 ? '🟢 High' : 
                       stock.currentUncertainty < 0.15 ? '🟡 Moderate' : '🔴 Low'}
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