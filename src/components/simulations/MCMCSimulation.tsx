import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw } from "lucide-react";

interface SimulationData {
  iteration: number;
  price: number;
  volatility: number;
  return: number;
}

export const MCMCSimulation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [data, setData] = useState<SimulationData[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentIteration, setCurrentIteration] = useState(0);
  const maxIterations = 1000;

  // Generate random walk with mean reversion
  const generateNextPoint = (prevPrice: number, iteration: number): SimulationData => {
    const dt = 0.01;
    const meanReversion = 0.05;
    const longTermMean = 175;
    const volatility = 0.2 + Math.random() * 0.1;
    
    // Ornstein-Uhlenbeck process with random jumps
    const drift = meanReversion * (longTermMean - prevPrice) * dt;
    const randomShock = volatility * Math.sqrt(dt) * (Math.random() - 0.5) * 2;
    const jumpComponent = Math.random() < 0.02 ? (Math.random() - 0.5) * 10 : 0;
    
    const newPrice = Math.max(prevPrice + drift + randomShock + jumpComponent, 50);
    const returnValue = prevPrice > 0 ? (newPrice - prevPrice) / prevPrice : 0;
    
    return {
      iteration,
      price: newPrice,
      volatility,
      return: returnValue * 100
    };
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && currentIteration < maxIterations) {
      interval = setInterval(() => {
        setData(prev => {
          const lastPrice = prev.length > 0 ? prev[prev.length - 1].price : 175;
          const newPoint = generateNextPoint(lastPrice, currentIteration + 1);
          const newData = [...prev, newPoint];
          
          // Keep only last 200 points for performance
          return newData.length > 200 ? newData.slice(-200) : newData;
        });
        
        setCurrentIteration(prev => {
          const next = prev + 1;
          setProgress((next / maxIterations) * 100);
          if (next >= maxIterations) {
            setIsRunning(false);
          }
          return next;
        });
      }, 50);
    }

    return () => clearInterval(interval);
  }, [isRunning, currentIteration, maxIterations]);

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setData([]);
    setCurrentIteration(0);
    setProgress(0);
  };

  const currentPrice = data.length > 0 ? data[data.length - 1].price : 175;
  const currentVolatility = data.length > 0 ? data[data.length - 1].volatility : 0.2;
  const averageReturn = data.length > 0 ? data.reduce((sum, d) => sum + d.return, 0) / data.length : 0;

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
            Iteration: {currentIteration.toLocaleString()}/{maxIterations.toLocaleString()}
          </Badge>
          <Badge variant="outline">
            {isRunning ? 'Running' : currentIteration >= maxIterations ? 'Completed' : 'Paused'}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Simulation Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Current Price</div>
          <div className="text-2xl font-bold text-primary">${currentPrice.toFixed(2)}</div>
        </div>
        
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Volatility</div>
          <div className="text-2xl font-bold text-warning">{(currentVolatility * 100).toFixed(1)}%</div>
        </div>
        
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Avg Return</div>
          <div className={`text-2xl font-bold ${averageReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
            {averageReturn >= 0 ? '+' : ''}{averageReturn.toFixed(3)}%
          </div>
        </div>
        
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Samples</div>
          <div className="text-2xl font-bold text-info">{data.length.toLocaleString()}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="iteration" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: number, name: string) => [
                name === 'price' ? `$${value.toFixed(2)}` : `${value.toFixed(3)}%`,
                name === 'price' ? 'Price' : 'Return'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
            />
            <ReferenceLine y={175} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
