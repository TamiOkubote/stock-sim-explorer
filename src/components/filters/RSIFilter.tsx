import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

interface RSIData {
  day: number;
  rsi: number;
  price: number;
  signal: 'buy' | 'sell' | 'hold';
}

export const RSIFilter = () => {
  const [rsiThreshold, setRsiThreshold] = useState([30, 70]);
  const [data, setData] = useState<RSIData[]>([]);
  const [currentRSI, setCurrentRSI] = useState(45);

  // Generate RSI data with realistic patterns
  useEffect(() => {
    const generateRSIData = () => {
      const newData: RSIData[] = [];
      let basePrice = 175;
      let rsi = 50;
      
      for (let i = 1; i <= 30; i++) {
        // Simulate price movement
        const priceChange = (Math.random() - 0.5) * 10;
        basePrice += priceChange;
        
        // Calculate RSI with mean reversion
        const rsiChange = (Math.random() - 0.5) * 10;
        rsi = Math.max(0, Math.min(100, rsi + rsiChange + (50 - rsi) * 0.1));
        
        // Generate signals based on thresholds
        let signal: 'buy' | 'sell' | 'hold' = 'hold';
        if (rsi <= rsiThreshold[0]) signal = 'buy';
        else if (rsi >= rsiThreshold[1]) signal = 'sell';
        
        newData.push({
          day: i,
          rsi: rsi,
          price: basePrice,
          signal
        });
      }
      
      setData(newData);
      setCurrentRSI(newData[newData.length - 1]?.rsi || 50);
    };

    generateRSIData();
  }, [rsiThreshold]);

  const getRSISignal = (rsi: number) => {
    if (rsi <= rsiThreshold[0]) return { label: 'Oversold - BUY', color: 'text-success', bg: 'bg-success/20' };
    if (rsi >= rsiThreshold[1]) return { label: 'Overbought - SELL', color: 'text-destructive', bg: 'bg-destructive/20' };
    return { label: 'HOLD', color: 'text-muted-foreground', bg: 'bg-muted/20' };
  };

  const currentSignal = getRSISignal(currentRSI);
  const buySignals = data.filter(d => d.signal === 'buy').length;
  const sellSignals = data.filter(d => d.signal === 'sell').length;

  return (
    <div className="space-y-6">
      {/* Current RSI Status */}
      <div className="text-center space-y-2">
        <div className="text-3xl font-bold text-primary">
          {currentRSI.toFixed(1)}
        </div>
        <Badge className={`${currentSignal.bg} ${currentSignal.color} border-0`}>
          {currentSignal.label}
        </Badge>
      </div>

      {/* RSI Threshold Controls */}
      <Card className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">RSI Thresholds</span>
          <div className="flex space-x-2">
            <Badge variant="outline" className="text-success">
              Oversold: {rsiThreshold[0]}
            </Badge>
            <Badge variant="outline" className="text-destructive">
              Overbought: {rsiThreshold[1]}
            </Badge>
          </div>
        </div>
        
        <div className="px-2">
          <Slider
            value={rsiThreshold}
            onValueChange={setRsiThreshold}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </Card>

      {/* Signal Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-success">{buySignals}</div>
          <div className="text-xs text-muted-foreground">Buy Signals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-destructive">{sellSignals}</div>
          <div className="text-xs text-muted-foreground">Sell Signals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground">{data.length - buySignals - sellSignals}</div>
          <div className="text-xs text-muted-foreground">Hold Signals</div>
        </div>
      </div>

      {/* RSI Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="day" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              domain={[0, 100]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: number) => [`${value.toFixed(1)}`, 'RSI']}
            />
            <Area
              type="monotone"
              dataKey="rsi"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="hsl(var(--primary) / 0.2)"
            />
            <ReferenceLine y={rsiThreshold[0]} stroke="hsl(var(--success))" strokeDasharray="5 5" />
            <ReferenceLine y={rsiThreshold[1]} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
            <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};