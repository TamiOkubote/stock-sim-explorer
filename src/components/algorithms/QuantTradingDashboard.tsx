import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendFollowing } from "./TrendFollowing";
import { MeanReversion } from "./MeanReversion";
import { StatisticalArbitrage } from "./StatisticalArbitrage";
import { PortfolioOptimization } from "./PortfolioOptimization";
import { Brain, TrendingUp, RotateCcw, GitBranch, Target, Activity } from "lucide-react";

export const QuantTradingDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-2xl">Quantitative Trading Algorithms</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Advanced mathematical techniques for systematic trading strategies
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">8</div>
              <div className="text-sm text-muted-foreground">Active Strategies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">94.2%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">$2.4M</div>
              <div className="text-sm text-muted-foreground">AUM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">18.7%</div>
              <div className="text-sm text-muted-foreground">YTD Return</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Categories */}
      <Tabs defaultValue="trend-following" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trend-following" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trend Following</span>
          </TabsTrigger>
          <TabsTrigger value="mean-reversion" className="flex items-center space-x-2">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Mean Reversion</span>
          </TabsTrigger>
          <TabsTrigger value="stat-arb" className="flex items-center space-x-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Statistical Arb</span>
          </TabsTrigger>
          <TabsTrigger value="portfolio-opt" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Portfolio Opt</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="trend-following" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Trend-Following Strategies</span>
                <Badge variant="outline" className="text-primary">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Momentum-based algorithms including moving average crossovers, RSI filters, and trend strength indicators.
              </p>
            </CardHeader>
            <CardContent>
              <TrendFollowing />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mean-reversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mean Reversion Strategies</span>
                <Badge variant="outline" className="text-info">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ornstein-Uhlenbeck process modeling, Bollinger Bands, and statistical tests for mean reversion detection.
              </p>
            </CardHeader>
            <CardContent>
              <MeanReversion />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stat-arb" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Statistical Arbitrage</span>
                <Badge variant="outline" className="text-secondary">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Pairs trading, cointegration analysis, and market-neutral strategies using statistical relationships.
              </p>
            </CardHeader>
            <CardContent>
              <StatisticalArbitrage />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="portfolio-opt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Portfolio Optimization</span>
                <Badge variant="outline" className="text-warning">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Mean-variance optimization, Black-Litterman model, and risk parity approaches for optimal asset allocation.
              </p>
            </CardHeader>
            <CardContent>
              <PortfolioOptimization />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};