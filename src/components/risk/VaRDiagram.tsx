import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingDown } from "lucide-react";

interface VaRData {
  return: number;
  frequency: number;
  cumulative: number;
}

export const VaRDiagram = () => {
  const [confidence, setConfidence] = useState(95);
  const [timeHorizon, setTimeHorizon] = useState(1);
  const [data, setData] = useState<VaRData[]>([]);
  const [var95, setVar95] = useState(0);
  const [var99, setVar99] = useState(0);
  const [expectedShortfall, setExpectedShortfall] = useState(0);

  // Generate return distribution
  useEffect(() => {
    const generateVaRData = () => {
      const returns: number[] = [];
      
      // Generate 10000 random returns using Monte Carlo
      for (let i = 0; i < 10000; i++) {
        // Using normal distribution with fat tails
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        // Add some skewness and fat tails for more realistic financial returns
        const skew = -0.5; // Negative skew (more downside risk)
        const kurtosis = 3; // Fat tails
        const dailyReturn = (z0 + skew) * 0.02 * Math.sqrt(timeHorizon); // 2% daily volatility
        
        returns.push(dailyReturn * 100); // Convert to percentage
      }

      returns.sort((a, b) => a - b);

      // Calculate VaR at different confidence levels
      const var95Index = Math.floor((1 - 0.95) * returns.length);
      const var99Index = Math.floor((1 - 0.99) * returns.length);
      
      setVar95(Math.abs(returns[var95Index]));
      setVar99(Math.abs(returns[var99Index]));
      
      // Calculate Expected Shortfall (Conditional VaR)
      const tailReturns = returns.slice(0, var95Index);
      const es = tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
      setExpectedShortfall(Math.abs(es));

      // Create histogram data
      const bins = 50;
      const minReturn = returns[0];
      const maxReturn = returns[returns.length - 1];
      const binSize = (maxReturn - minReturn) / bins;
      
      const histogram: VaRData[] = [];
      let cumulative = 0;
      
      for (let i = 0; i < bins; i++) {
        const binStart = minReturn + i * binSize;
        const binEnd = binStart + binSize;
        const frequency = returns.filter(r => r >= binStart && r < binEnd).length;
        
        cumulative += frequency;
        
        histogram.push({
          return: binStart,
          frequency: frequency / returns.length * 100,
          cumulative: cumulative / returns.length * 100
        });
      }
      
      setData(histogram);
    };

    generateVaRData();
  }, [confidence, timeHorizon]);

  const confidenceLevels = [90, 95, 99];
  const timeHorizons = [1, 5, 10, 30];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Confidence Level:</span>
          {confidenceLevels.map(level => (
            <Button
              key={level}
              variant={confidence === level ? "default" : "outline"}
              size="sm"
              onClick={() => setConfidence(level)}
            >
              {level}%
            </Button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Time Horizon (days):</span>
          {timeHorizons.map(days => (
            <Button
              key={days}
              variant={timeHorizon === days ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeHorizon(days)}
            >
              {days}
            </Button>
          ))}
        </div>
      </div>

      {/* VaR Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card/50 p-4 rounded-lg border-l-4 border-l-warning">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">VaR (95%)</span>
          </div>
          <div className="text-2xl font-bold text-warning">
            {var95.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Maximum expected loss (95% confidence)
          </div>
        </div>

        <div className="bg-card/50 p-4 rounded-lg border-l-4 border-l-destructive">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">VaR (99%)</span>
          </div>
          <div className="text-2xl font-bold text-destructive">
            {var99.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Maximum expected loss (99% confidence)
          </div>
        </div>

        <div className="bg-card/50 p-4 rounded-lg border-l-4 border-l-primary">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium">Expected Shortfall</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {expectedShortfall.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Average loss beyond VaR
          </div>
        </div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="histogram" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="histogram">Return Distribution</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="histogram" className="space-y-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="return" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Frequency']}
                  labelFormatter={(value: number) => `Return: ${value.toFixed(2)}%`}
                />
                <Bar 
                  dataKey="frequency" 
                  fill="hsl(var(--primary) / 0.7)"
                  stroke="hsl(var(--primary))"
                />
                <ReferenceLine x={-var95} stroke="hsl(var(--warning))" strokeDasharray="5 5" />
                <ReferenceLine x={-var99} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
        
        <TabsContent value="cumulative" className="space-y-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="return" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Cumulative Probability']}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(var(--info))"
                  strokeWidth={2}
                  fill="hsl(var(--info) / 0.3)"
                />
                <ReferenceLine y={5} stroke="hsl(var(--warning))" strokeDasharray="5 5" />
                <ReferenceLine y={1} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>

      {/* Risk Interpretation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-semibold">Risk Interpretation</h4>
          <div className="space-y-1 text-muted-foreground">
            <div>• VaR (95%): 5% chance of losing more than {var95.toFixed(2)}%</div>
            <div>• VaR (99%): 1% chance of losing more than {var99.toFixed(2)}%</div>
            <div>• Time horizon: {timeHorizon} day{timeHorizon > 1 ? 's' : ''}</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-semibold">Risk Level</h4>
          <Badge className={
            var95 > 5 ? 'bg-destructive/20 text-destructive' :
            var95 > 3 ? 'bg-warning/20 text-warning' :
            'bg-success/20 text-success'
          }>
            {var95 > 5 ? 'High Risk' : var95 > 3 ? 'Medium Risk' : 'Low Risk'}
          </Badge>
        </div>
      </div>
    </div>
  );
};