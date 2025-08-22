import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, Calendar } from "lucide-react";

interface SimulationData {
  iteration: number;
  price: number;
  volatility: number;
  return: number;
  time: number;
}

interface TimeSpanConfig {
  label: string;
  years: number;
  maxIterations: number;
  dt: number;
  displayInterval: number;
}

const timeSpans: Record<string, TimeSpanConfig> = {
  "1y": { label: "1 Year", years: 1, maxIterations: 252, dt: 1/252, displayInterval: 1 },
  "5y": { label: "5 Years", years: 5, maxIterations: 1260, dt: 1/252, displayInterval: 5 },
  "10y": { label: "10 Years", years: 10, maxIterations: 2520, dt: 1/252, displayInterval: 10 },
  "20y": { label: "20 Years", years: 20, maxIterations: 5040, dt: 1/252, displayInterval: 20 }
};

export const MCMCSimulation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [data, setData] = useState<SimulationData[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [selectedTimeSpan, setSelectedTimeSpan] = useState<string>("1y");
  
  const currentConfig = timeSpans[selectedTimeSpan];
  const maxIterations = currentConfig.maxIterations;

  // Generate random walk with mean reversion for different time horizons
  const generateNextPoint = (prevPrice: number, iteration: number): SimulationData => {
    const config = currentConfig;
    const dt = config.dt;
    const years = config.years;
    
    // Adjust parameters based on time horizon
    const meanReversion = 0.05 * (1 + years * 0.1); // Stronger mean reversion over longer periods
    const longTermMean = 175 * (1 + years * 0.03); // Account for long-term growth
    const baseVolatility = 0.2 + (years * 0.02); // Increase volatility for longer periods
    const volatility = baseVolatility + Math.random() * 0.1;
    
    // Ornstein-Uhlenbeck process with time-adjusted parameters
    const drift = meanReversion * (longTermMean - prevPrice) * dt + (0.08 * dt); // Add drift component
    const randomShock = volatility * Math.sqrt(dt) * (Math.random() - 0.5) * 2;
    
    // Reduce jump frequency for longer time horizons but increase impact
    const jumpProbability = 0.02 / Math.sqrt(years);
    const jumpMagnitude = 10 * Math.sqrt(years);
    const jumpComponent = Math.random() < jumpProbability ? (Math.random() - 0.5) * jumpMagnitude : 0;
    
    const newPrice = Math.max(prevPrice + drift + randomShock + jumpComponent, 10);
    const returnValue = prevPrice > 0 ? (newPrice - prevPrice) / prevPrice : 0;
    const timeInYears = (iteration * dt);
    
    return {
      iteration,
      price: newPrice,
      volatility,
      return: returnValue * 100,
      time: timeInYears
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

  const handleTimeSpanChange = (value: string) => {
    setSelectedTimeSpan(value);
    resetSimulation();
  };

  const currentPrice = data.length > 0 ? data[data.length - 1].price : 175;
  const currentVolatility = data.length > 0 ? data[data.length - 1].volatility : 0.2;
  const averageReturn = data.length > 0 ? data.reduce((sum, d) => sum + d.return, 0) / data.length : 0;
  const totalReturn = data.length > 0 ? ((currentPrice - 175) / 175) * 100 : 0;
  const annualizedReturn = data.length > 0 ? (Math.pow(currentPrice / 175, 1 / currentConfig.years) - 1) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedTimeSpan} onValueChange={handleTimeSpanChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Timespan" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(timeSpans).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Badge variant="secondary">
            {currentConfig.years === 1 ? 'Days' : 'Trading Days'}: {currentIteration.toLocaleString()}/{maxIterations.toLocaleString()}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Current Price</div>
          <div className="text-2xl font-bold text-primary">${currentPrice.toFixed(2)}</div>
        </div>
        
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Total Return</div>
          <div className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
            {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Annualized Return</div>
          <div className={`text-2xl font-bold ${annualizedReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
            {annualizedReturn >= 0 ? '+' : ''}{annualizedReturn.toFixed(2)}%
          </div>
        </div>
        
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Volatility</div>
          <div className="text-2xl font-bold text-warning">{(currentVolatility * 100).toFixed(1)}%</div>
        </div>
        
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Avg Daily Return</div>
          <div className={`text-2xl font-bold ${averageReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
            {averageReturn >= 0 ? '+' : ''}{averageReturn.toFixed(3)}%
          </div>
        </div>
        
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Time Elapsed</div>
          <div className="text-2xl font-bold text-info">
            {data.length > 0 ? data[data.length - 1].time.toFixed(1) : '0.0'} yr
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `${value.toFixed(1)}y`}
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
              formatter={(value: number, name: string) => {
                if (name === 'price') return [`$${value.toFixed(2)}`, 'Price'];
                if (name === 'return') return [`${value.toFixed(3)}%`, 'Daily Return'];
                if (name === 'time') return [`${value.toFixed(2)} years`, 'Time'];
                return [value, name];
              }}
              labelFormatter={(value) => `Year ${Number(value).toFixed(2)}`}
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
