import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MCMCSimulation } from "./simulations/MCMCSimulation";
import { RSIFilter } from "./filters/RSIFilter";
import { RiskMatrix } from "./risk/RiskMatrix";
import { VaRDiagram } from "./risk/VaRDiagram";
import { MetropolisHastings } from "./simulations/MetropolisHastings";
import { StockSelector } from "./stocks/StockSelector";
import { TrendingUp, Activity, Shield, BarChart3 } from "lucide-react";

const topStocks = [
  { symbol: "AAPL", name: "Apple Inc.", price: 175.43, change: 2.34, changePercent: 1.35 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 378.85, change: -1.22, changePercent: -0.32 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 891.14, change: 15.67, changePercent: 1.79 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.56, change: 0.89, changePercent: 0.63 },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 155.21, change: -2.11, changePercent: -1.34 }
];

export const FinancialDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                  Monte Carlo Analytics
                </h1>
              </div>
              <Badge variant="secondary" className="text-xs">
                Live Simulation
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              {topStocks.slice(0, 3).map((stock) => (
                <div key={stock.symbol} className="text-right">
                  <div className="text-sm font-medium">{stock.symbol}</div>
                  <div className={`text-xs ${stock.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${stock.price.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Stock Selection */}
        <StockSelector stocks={topStocks} />

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* MCMC Simulation */}
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Monte Carlo Markov Chain Simulation</span>
              </CardTitle>
              <Badge variant="outline" className="text-primary">
                Real-time
              </Badge>
            </CardHeader>
            <CardContent>
              <MCMCSimulation />
            </CardContent>
          </Card>

          {/* RSI Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-info" />
                <span>RSI Analysis & Filter</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RSIFilter />
            </CardContent>
          </Card>

          {/* Risk Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-warning" />
                <span>Risk Matrix Heatmap</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RiskMatrix />
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics */}
        <Tabs defaultValue="var" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="var">Value at Risk</TabsTrigger>
            <TabsTrigger value="mh">Metropolis-Hastings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="var" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Value at Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <VaRDiagram />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="mh" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Metropolis-Hastings Simulation</CardTitle>
              </CardHeader>
              <CardContent>
                <MetropolisHastings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};