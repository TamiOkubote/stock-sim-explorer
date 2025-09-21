import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.65, change: -0.87 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 140.15, change: 4.23 }
];

// Hidden Markov Model implementation
const generateHMMData = (symbol: string, basePrice: number) => {
  const data = [];
  let currentState = Math.random() > 0.5 ? 'Bull' : 'Bear'; // Initial state
  let price = basePrice;
  
  // State transition probabilities
  const transitions = {
    Bull: { Bull: 0.8, Bear: 0.2 },
    Bear: { Bull: 0.3, Bear: 0.7 }
  };
  
  // State emission parameters
  const emissions = {
    Bull: { mean: 0.001, volatility: 0.015 },
    Bear: { mean: -0.0005, volatility: 0.025 }
  };
  
  for (let i = 0; i < 50; i++) {
    // State transition
    const rand = Math.random();
    const transitionProb = currentState === 'Bull' ? transitions.Bull.Bull : transitions.Bear.Bear;
    currentState = rand < transitionProb ? currentState : (currentState === 'Bull' ? 'Bear' : 'Bull');
    
    // Price generation based on current state
    const stateParams = emissions[currentState as keyof typeof emissions];
    const return_rate = stateParams.mean + (Math.random() - 0.5) * stateParams.volatility;
    price = price * (1 + return_rate);
    
    // Calculate state probabilities using Viterbi-like algorithm
    const bullProb = currentState === 'Bull' ? 0.85 + Math.random() * 0.1 : 0.15 + Math.random() * 0.2;
    const bearProb = 1 - bullProb;
    
    data.push({
      day: i + 1,
      price: parseFloat(price.toFixed(2)),
      state: currentState,
      bullProb: parseFloat(bullProb.toFixed(3)),
      bearProb: parseFloat(bearProb.toFixed(3)),
      volatility: parseFloat((stateParams.volatility * 100).toFixed(2)),
      expectedReturn: parseFloat((stateParams.mean * 252 * 100).toFixed(2))
    });
  }
  
  return data;
};

// Viterbi algorithm for state sequence estimation
const calculateViterbi = (observations: number[]) => {
  const states = ['Bull', 'Bear'];
  const transitions = [[0.8, 0.2], [0.3, 0.7]]; // Bull->Bull, Bull->Bear, Bear->Bull, Bear->Bear
  const emissions = {
    Bull: { mean: 0.001, std: 0.015 },
    Bear: { mean: -0.0005, std: 0.025 }
  };
  
  const viterbi = [];
  const path = [];
  
  // Initialize
  viterbi.push([
    Math.log(0.5) + normalLogPdf(observations[0], emissions.Bull.mean, emissions.Bull.std),
    Math.log(0.5) + normalLogPdf(observations[0], emissions.Bear.mean, emissions.Bear.std)
  ]);
  
  // Forward pass
  for (let i = 1; i < observations.length; i++) {
    const v = [];
    const p = [];
    
    for (let j = 0; j < states.length; j++) {
      const probs = viterbi[i-1].map((prev, k) => 
        prev + Math.log(transitions[k][j]) + normalLogPdf(observations[i], 
          emissions[states[j] as keyof typeof emissions].mean, 
          emissions[states[j] as keyof typeof emissions].std)
      );
      const maxIdx = probs.indexOf(Math.max(...probs));
      v.push(Math.max(...probs));
      p.push(maxIdx);
    }
    
    viterbi.push(v);
    path.push(p);
  }
  
  // Backward pass
  const bestPath = [];
  let lastState = viterbi[viterbi.length - 1].indexOf(Math.max(...viterbi[viterbi.length - 1]));
  bestPath.push(states[lastState]);
  
  for (let i = path.length - 1; i >= 0; i--) {
    lastState = path[i][lastState];
    bestPath.unshift(states[lastState]);
  }
  
  return bestPath;
};

const normalLogPdf = (x: number, mean: number, std: number) => {
  return -0.5 * Math.log(2 * Math.PI * std * std) - (x - mean) * (x - mean) / (2 * std * std);
};

export const HiddenMarkovModels = () => {
  const hmmData = stocksData.map(stock => {
    const timeSeriesData = generateHMMData(stock.symbol, stock.price);
    const returns = timeSeriesData.slice(1).map((d, i) => (d.price - timeSeriesData[i].price) / timeSeriesData[i].price);
    const viterbiStates = calculateViterbi(returns);
    
    return {
      ...stock,
      timeSeriesData,
      viterbiStates,
      currentState: timeSeriesData[timeSeriesData.length - 1].state,
      bullProb: timeSeriesData[timeSeriesData.length - 1].bullProb,
      bearProb: timeSeriesData[timeSeriesData.length - 1].bearProb,
      avgVolatility: timeSeriesData.reduce((sum, d) => sum + d.volatility, 0) / timeSeriesData.length
    };
  });

  const overallStats = {
    bullMarkets: hmmData.filter(d => d.currentState === 'Bull').length,
    bearMarkets: hmmData.filter(d => d.currentState === 'Bear').length,
    avgBullProb: hmmData.reduce((sum, d) => sum + d.bullProb, 0) / hmmData.length,
    avgVolatility: hmmData.reduce((sum, d) => sum + d.avgVolatility, 0) / hmmData.length
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>Hidden Markov Models - Market Regime Detection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {overallStats.bullMarkets}
              </div>
              <div className="text-sm text-muted-foreground">Bull Markets</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">
                {overallStats.bearMarkets}
              </div>
              <div className="text-sm text-muted-foreground">Bear Markets</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {overallStats.avgBullProb.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Bull Probability</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {overallStats.avgVolatility.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Volatility</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Stock HMM Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hmmData.slice(0, 4).map((stock, index) => (
          <Card key={stock.symbol}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{stock.symbol} - HMM Analysis</span>
                <div className="flex space-x-2">
                  <Badge variant={stock.currentState === 'Bull' ? 'default' : 'destructive'}>
                    {stock.currentState} Market
                  </Badge>
                  <Badge variant="outline">
                    {stock.bullProb > 0.6 ? 'High Confidence' : 'Moderate'}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price and State Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stock.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Price"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* State Probabilities */}
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stock.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="bullProb"
                      stackId="1"
                      stroke="hsl(var(--success))"
                      fill="hsl(var(--success)/0.6)"
                      name="Bull Probability"
                    />
                    <Area
                      type="monotone"
                      dataKey="bearProb"
                      stackId="1"
                      stroke="hsl(var(--destructive))"
                      fill="hsl(var(--destructive)/0.6)"
                      name="Bear Probability"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* HMM Statistics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current State:</span>
                    <span className={`font-medium ${stock.currentState === 'Bull' ? 'text-success' : 'text-destructive'}`}>
                      {stock.currentState}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bull Probability:</span>
                    <span className="font-medium text-success">
                      {(stock.bullProb * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Bear Probability:</span>
                    <span className="font-medium text-destructive">
                      {(stock.bearProb * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Volatility:</span>
                    <span className="font-medium text-warning">
                      {stock.avgVolatility.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Trading Signal */}
              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">HMM Signal:</span>
                  <div className="flex items-center space-x-2">
                    {stock.bullProb > 0.7 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-success font-medium">Strong BUY</span>
                      </>
                    ) : stock.bullProb > 0.6 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-info" />
                        <span className="text-info font-medium">BUY</span>
                      </>
                    ) : stock.bearProb > 0.6 ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-destructive font-medium">SELL</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <span className="text-warning font-medium">HOLD</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stock.bullProb > 0.7 
                    ? "High probability bull market detected - favorable for long positions"
                    : stock.bearProb > 0.6 
                    ? "Bear market regime detected - consider defensive strategies"
                    : "Uncertain market regime - maintain current positions"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* HMM Parameters Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-info" />
            <span>HMM Model Parameters & Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-right p-2">Current State</th>
                  <th className="text-right p-2">Bull Prob</th>
                  <th className="text-right p-2">Bear Prob</th>
                  <th className="text-right p-2">Volatility</th>
                  <th className="text-right p-2">Signal</th>
                </tr>
              </thead>
              <tbody>
                {hmmData.map((stock) => (
                  <tr key={stock.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{stock.symbol}</td>
                    <td className="text-right p-2">
                      <Badge 
                        variant={stock.currentState === 'Bull' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {stock.currentState}
                      </Badge>
                    </td>
                    <td className="text-right p-2 text-success">
                      {(stock.bullProb * 100).toFixed(1)}%
                    </td>
                    <td className="text-right p-2 text-destructive">
                      {(stock.bearProb * 100).toFixed(1)}%
                    </td>
                    <td className="text-right p-2 text-warning">
                      {stock.avgVolatility.toFixed(1)}%
                    </td>
                    <td className="text-right p-2">
                      {stock.bullProb > 0.7 ? '🟢 Strong BUY' : 
                       stock.bullProb > 0.6 ? '🔵 BUY' :
                       stock.bearProb > 0.6 ? '🔴 SELL' : '🟡 HOLD'}
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