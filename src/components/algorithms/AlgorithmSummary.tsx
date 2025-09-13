import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, Clock, Zap } from "lucide-react";

const algorithmCategories = [
  {
    category: "Trend-Following",
    color: "bg-primary/10 border-primary/20",
    techniques: [
      { name: "Moving Average Crossover", status: "active", description: "5-day and 20-day MA signals" },
      { name: "Momentum Filter", status: "active", description: "Price momentum calculation" },
      { name: "RSI Analysis", status: "active", description: "Relative Strength Index filter" },
      { name: "Time Series Analysis", status: "implemented", description: "Trend strength indicators" }
    ]
  },
  {
    category: "Mean-Reversion",
    color: "bg-info/10 border-info/20",
    techniques: [
      { name: "Ornstein-Uhlenbeck Process", status: "active", description: "Stochastic mean reversion model" },
      { name: "Bollinger Bands", status: "active", description: "Statistical price boundaries" },
      { name: "Z-Score Analysis", status: "active", description: "Standard deviation measures" },
      { name: "Statistical Testing", status: "implemented", description: "Mean reversion significance tests" }
    ]
  },
  {
    category: "Statistical Arbitrage",
    color: "bg-secondary/10 border-secondary/20",
    techniques: [
      { name: "Pairs Trading", status: "active", description: "Market-neutral pair strategies" },
      { name: "Cointegration Analysis", status: "active", description: "Long-term relationship modeling" },
      { name: "Correlation Filters", status: "active", description: "Statistical relationship strength" },
      { name: "PCA/Factor Models", status: "planned", description: "Principal component analysis" }
    ]
  },
  {
    category: "Portfolio Optimization", 
    color: "bg-warning/10 border-warning/20",
    techniques: [
      { name: "Mean-Variance Optimization", status: "active", description: "Markowitz efficient frontier" },
      { name: "Black-Litterman Model", status: "active", description: "Bayesian portfolio optimization" },
      { name: "Risk Parity", status: "implemented", description: "Equal risk contribution weighting" },
      { name: "Monte Carlo Simulation", status: "active", description: "Portfolio scenario analysis" }
    ]
  },
  {
    category: "Risk Management",
    color: "bg-destructive/10 border-destructive/20", 
    techniques: [
      { name: "Value at Risk (VaR)", status: "active", description: "Risk quantification measures" },
      { name: "Beta Analysis", status: "active", description: "Market sensitivity analysis" },
      { name: "Sharpe Ratio", status: "active", description: "Risk-adjusted return metrics" },
      { name: "Volatility Models", status: "implemented", description: "GARCH and stochastic vol" }
    ]
  },
  {
    category: "Derivatives & Options",
    color: "bg-success/10 border-success/20",
    techniques: [
      { name: "Black-Scholes Model", status: "active", description: "Options pricing formula" },
      { name: "Greeks Calculation", status: "planned", description: "Option sensitivity measures" },
      { name: "Volatility Surface", status: "planned", description: "Implied volatility modeling" },
      { name: "Jump-Diffusion Models", status: "planned", description: "Heston and other stochastic models" }
    ]
  },
  {
    category: "Machine Learning",
    color: "bg-violet-100 border-violet-300",
    techniques: [
      { name: "Hidden Markov Models", status: "planned", description: "Market regime detection" },
      { name: "Reinforcement Learning", status: "planned", description: "Adaptive trading strategies" },
      { name: "Clustering Algorithms", status: "planned", description: "Asset classification and grouping" },
      { name: "Bayesian Methods", status: "implemented", description: "Probabilistic model updates" }
    ]
  },
  {
    category: "Execution & Microstructure",
    color: "bg-amber-100 border-amber-300", 
    techniques: [
      { name: "Order Flow Analysis", status: "planned", description: "Market microstructure modeling" },
      { name: "TWAP/VWAP Strategies", status: "planned", description: "Time/volume weighted execution" },
      { name: "Market Making Models", status: "planned", description: "Bid-ask spread optimization" },
      { name: "Liquidity Modeling", status: "planned", description: "Market impact estimation" }
    ]
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "implemented":
      return <Zap className="h-4 w-4 text-warning" />;
    case "planned":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge variant="default" className="text-xs">Live</Badge>;
    case "implemented":
      return <Badge variant="secondary" className="text-xs">Ready</Badge>;
    case "planned":
      return <Badge variant="outline" className="text-xs">Planned</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">Unknown</Badge>;
  }
};

export const AlgorithmSummary = () => {
  const totalTechniques = algorithmCategories.reduce((sum, cat) => sum + cat.techniques.length, 0);
  const activeTechniques = algorithmCategories.reduce((sum, cat) => 
    sum + cat.techniques.filter(t => t.status === "active").length, 0);
  const implementedTechniques = algorithmCategories.reduce((sum, cat) => 
    sum + cat.techniques.filter(t => t.status === "implemented").length, 0);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>Quantitative Trading Techniques Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{totalTechniques}</div>
              <div className="text-sm text-muted-foreground">Total Techniques</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{activeTechniques}</div>
              <div className="text-sm text-muted-foreground">Live & Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{implementedTechniques}</div>
              <div className="text-sm text-muted-foreground">Implemented</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{algorithmCategories.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {algorithmCategories.map((category, categoryIndex) => (
          <Card key={categoryIndex} className={`${category.color} hover:shadow-lg transition-shadow`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.techniques.map((technique, techniqueIndex) => (
                  <div key={techniqueIndex} className="flex items-start justify-between space-x-3">
                    <div className="flex items-start space-x-2 flex-1">
                      {getStatusIcon(technique.status)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{technique.name}</div>
                        <div className="text-xs text-muted-foreground">{technique.description}</div>
                      </div>
                    </div>
                    {getStatusBadge(technique.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Implementation Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <div className="text-lg font-bold text-success">Phase 1: Core Strategies</div>
                <div className="text-sm text-muted-foreground mt-2">
                  Trend-following, mean reversion, and basic risk management
                </div>
                <Badge variant="default" className="mt-2">Completed</Badge>
              </div>
              <div className="text-center p-4 bg-warning/10 rounded-lg">
                <div className="text-lg font-bold text-warning">Phase 2: Advanced Analytics</div>
                <div className="text-sm text-muted-foreground mt-2">
                  Statistical arbitrage, portfolio optimization, and derivatives
                </div>
                <Badge variant="secondary" className="mt-2">In Progress</Badge>
              </div>
              <div className="text-center p-4 bg-info/10 rounded-lg">
                <div className="text-lg font-bold text-info">Phase 3: ML & Microstructure</div>
                <div className="text-sm text-muted-foreground mt-2">
                  Machine learning models and market microstructure analysis
                </div>
                <Badge variant="outline" className="mt-2">Planned</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};