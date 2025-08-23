import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MCMCSimulationProps {
  selectedStocks: string[];
  stockData: Stock[];
  analysisTrigger: number;
}

interface SimulationResult {
  symbol: string;
  horizons: {
    years: number;
    expectedPrice: number;
    expectedReturn: number;
    volatility: number;
    var95: number;
    var99: number;
    probLoss: number;
    sharpeRatio: number;
    paths: number[];
  }[];
}

interface PathData {
  day: number;
  [key: string]: number; // Dynamic keys for stock symbols
}

export const MCMCSimulation = ({ selectedStocks, stockData, analysisTrigger }: MCMCSimulationProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [pathData, setPathData] = useState<PathData[]>([]);
  const [currentIteration, setCurrentIteration] = useState(0);
  
  const horizonsYears = [1, 5, 10, 20];
  const numPaths = 5000;
  const riskFreeRate = 0.03; // 3% annual risk-free rate

  // Reset and auto-start when analysis is triggered
  useEffect(() => {
    if (analysisTrigger > 0 && selectedStocks.length > 0) {
      resetSimulation();
      setTimeout(() => setIsRunning(true), 100);
    }
  }, [analysisTrigger, selectedStocks]);

  // Monte Carlo simulation for geometric Brownian motion
  const runMonteCarloSimulation = (stock: Stock, horizonYears: number): any => {
    const S0 = stock.price;
    const T = horizonYears;
    const dt = T / 252; // Daily time step (252 trading days per year)
    const steps = Math.floor(252 * horizonYears);
    
    // Estimate drift and volatility from stock data
    const annualReturn = stock.changePercent > 0 ? 
      Math.max(0.05, Math.min(0.15, stock.changePercent / 100 * 12)) : 
      Math.max(0.02, 0.08 - Math.abs(stock.changePercent) / 100 * 2);
    
    const volatility = Math.max(0.15, Math.min(0.45, 0.25 + Math.abs(stock.changePercent) / 100 * 2));
    
    const paths: number[] = [];
    const dailyPaths: number[][] = [];
    
    for (let i = 0; i < numPaths; i++) {
      let price = S0;
      const dailyPrices = [S0];
      
      for (let j = 0; j < steps; j++) {
        const drift = (annualReturn - 0.5 * volatility * volatility) * dt;
        const shock = volatility * Math.sqrt(dt) * (Math.random() * 2 - 1);
        price *= Math.exp(drift + shock);
        dailyPrices.push(price);
      }
      
      paths.push(price);
      if (i < 50) dailyPaths.push(dailyPrices); // Store first 50 paths for visualization
    }
    
    // Calculate statistics
    paths.sort((a, b) => a - b);
    const expectedPrice = paths.reduce((sum, p) => sum + p, 0) / paths.length;
    const expectedReturn = (expectedPrice - S0) / S0;
    const returns = paths.map(p => (p - S0) / S0);
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - expectedReturn, 2), 0) / returns.length;
    const volatilityAnnual = Math.sqrt(variance);
    
    const var95Index = Math.floor(0.05 * paths.length);
    const var99Index = Math.floor(0.01 * paths.length);
    const var95 = (paths[var95Index] - S0) / S0;
    const var99 = (paths[var99Index] - S0) / S0;
    
    const probLoss = paths.filter(p => p < S0).length / paths.length;
    const sharpeRatio = expectedReturn > 0 ? (expectedReturn - riskFreeRate * horizonYears) / volatilityAnnual : 0;
    
    return {
      years: horizonYears,
      expectedPrice,
      expectedReturn,
      volatility: volatilityAnnual,
      var95,
      var99,
      probLoss,
      sharpeRatio,
      paths: dailyPaths[0] || [],
      allPaths: paths
    };
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && selectedStocks.length > 0) {
      const totalSimulations = selectedStocks.length * horizonsYears.length;
      let completed = 0;
      
      const runSimulations = async () => {
        const newResults: SimulationResult[] = [];
        const pathDataMap: { [day: number]: { [symbol: string]: number } } = {};
        
        for (const stockSymbol of selectedStocks) {
          const stock = stockData.find(s => s.symbol === stockSymbol);
          if (!stock) continue;
          
          const horizonResults = [];
          
          for (const horizon of horizonsYears) {
            // Simulate delay for realistic progress
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const result = runMonteCarloSimulation(stock, horizon);
            horizonResults.push(result);
            
            // Store path data for 1-year horizon visualization
            if (horizon === 1 && result.paths.length > 0) {
              result.paths.forEach((price: number, day: number) => {
                if (!pathDataMap[day]) pathDataMap[day] = { day };
                pathDataMap[day][stockSymbol] = price;
              });
            }
            
            completed++;
            setCurrentIteration(completed);
            setProgress((completed / totalSimulations) * 100);
          }
          
          newResults.push({
            symbol: stockSymbol,
            horizons: horizonResults
          });
        }
        
        setResults(newResults);
        setPathData(Object.values(pathDataMap) as PathData[]);
        setIsRunning(false);
        toast.success(`Monte Carlo analysis completed for ${selectedStocks.join(', ')}`);
      };
      
      runSimulations();
    }

    return () => clearInterval(interval);
  }, [isRunning, selectedStocks, stockData]);

  const toggleSimulation = () => {
    if (selectedStocks.length === 0) {
      toast.error("Please select stocks first using the 'Run Analysis' button above");
      return;
    }
    setIsRunning(!isRunning);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setResults([]);
    setPathData([]);
    setCurrentIteration(0);
    setProgress(0);
  };

  const getStockColor = (symbol: string, index: number) => {
    const colors = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];
    return colors[index % colors.length];
  };

  if (selectedStocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div className="space-y-4">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-muted-foreground">No Stocks Selected</h3>
            <p className="text-sm text-muted-foreground">Use the "Run Analysis" button above to select stocks and start the Monte Carlo simulation</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={toggleSimulation}
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            className="gap-2"
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Pause' : 'Start'} Simulation
          </Button>
          
          <Button onClick={resetSimulation} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant="secondary">
            {selectedStocks.join(', ')}
          </Badge>
          <Badge variant="outline">
            {isRunning ? 'Running' : results.length > 0 ? 'Completed' : 'Ready'}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Simulation Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {results.map((result) => {
              const oneYearResult = result.horizons.find(h => h.years === 1);
              if (!oneYearResult) return null;
              
              return (
                <Card key={result.symbol} className="bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      {result.symbol}
                      <Badge variant="outline" className="text-xs">1Y</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Expected Return</div>
                      <div className={`text-lg font-bold ${oneYearResult.expectedReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {oneYearResult.expectedReturn >= 0 ? '+' : ''}{(oneYearResult.expectedReturn * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">VaR (95%)</div>
                      <div className="text-sm font-semibold text-destructive">
                        {(oneYearResult.var95 * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
                      <div className="text-sm font-semibold text-primary">
                        {oneYearResult.sharpeRatio.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Price Path Visualization */}
          {pathData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>1-Year Price Path Simulation</span>
                  <Badge variant="outline">{numPaths.toLocaleString()} paths</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pathData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                      />
                      {selectedStocks.map((symbol, index) => (
                        <Line 
                          key={symbol}
                          type="monotone" 
                          dataKey={symbol} 
                          stroke={getStockColor(symbol, index)}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Results Table */}
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.symbol}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{result.symbol} - Detailed Analysis</span>
                    <Badge variant="secondary">{result.horizons.length} horizons</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2">Horizon</th>
                          <th className="text-right p-2">Expected Return</th>
                          <th className="text-right p-2">Expected Price</th>
                          <th className="text-right p-2">Volatility</th>
                          <th className="text-right p-2">VaR 95%</th>
                          <th className="text-right p-2">VaR 99%</th>
                          <th className="text-right p-2">Prob Loss</th>
                          <th className="text-right p-2">Sharpe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.horizons.map((horizon) => (
                          <tr key={horizon.years} className="border-b border-border/50">
                            <td className="p-2 font-medium">{horizon.years}Y</td>
                            <td className={`text-right p-2 ${horizon.expectedReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {horizon.expectedReturn >= 0 ? '+' : ''}{(horizon.expectedReturn * 100).toFixed(1)}%
                            </td>
                            <td className="text-right p-2">${horizon.expectedPrice.toFixed(2)}</td>
                            <td className="text-right p-2">{(horizon.volatility * 100).toFixed(1)}%</td>
                            <td className="text-right p-2 text-destructive">{(horizon.var95 * 100).toFixed(1)}%</td>
                            <td className="text-right p-2 text-destructive">{(horizon.var99 * 100).toFixed(1)}%</td>
                            <td className="text-right p-2">{(horizon.probLoss * 100).toFixed(1)}%</td>
                            <td className="text-right p-2">{horizon.sharpeRatio.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Assumptions */}
          <Card className="bg-card/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span>Model Assumptions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>• Geometric Brownian Motion with estimated drift and volatility</p>
              <p>• {numPaths.toLocaleString()} Monte Carlo paths per simulation</p>
              <p>• Risk-free rate: {(riskFreeRate * 100).toFixed(1)}% annually</p>
              <p>• Trading days: 252 per year</p>
              <p>• Parameters estimated from current stock performance</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};