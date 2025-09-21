import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Target, Zap, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.65, change: -0.87 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 140.15, change: 4.23 }
];

// Q-Learning Agent for Trading
class QLearningAgent {
  private qTable: { [key: string]: { [key: string]: number } } = {};
  private learningRate = 0.1;
  private discountFactor = 0.95;
  private epsilon = 0.1; // exploration rate
  private actions = ['BUY', 'SELL', 'HOLD'];
  
  getState(price: number, sma: number, rsi: number): string {
    const priceVsSMA = price > sma ? 'ABOVE' : 'BELOW';
    const rsiLevel = rsi > 70 ? 'OVERBOUGHT' : rsi < 30 ? 'OVERSOLD' : 'NEUTRAL';
    return `${priceVsSMA}_${rsiLevel}`;
  }
  
  chooseAction(state: string): string {
    // Initialize state if not exists
    if (!this.qTable[state]) {
      this.qTable[state] = {};
      this.actions.forEach(action => this.qTable[state][action] = 0);
    }
    
    // Epsilon-greedy action selection
    if (Math.random() < this.epsilon) {
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    } else {
      const qValues = this.qTable[state];
      return Object.keys(qValues).reduce((a, b) => qValues[a] > qValues[b] ? a : b);
    }
  }
  
  updateQValue(state: string, action: string, reward: number, nextState: string): void {
    if (!this.qTable[state]) {
      this.qTable[state] = {};
      this.actions.forEach(a => this.qTable[state][a] = 0);
    }
    if (!this.qTable[nextState]) {
      this.qTable[nextState] = {};
      this.actions.forEach(a => this.qTable[nextState][a] = 0);
    }
    
    const maxNextQ = Math.max(...Object.values(this.qTable[nextState]));
    const currentQ = this.qTable[state][action];
    
    this.qTable[state][action] = currentQ + this.learningRate * 
      (reward + this.discountFactor * maxNextQ - currentQ);
  }
  
  getQTable(): { [key: string]: { [key: string]: number } } {
    return this.qTable;
  }
}

// Deep Q-Network simulation
const generateDQNData = (symbol: string, basePrice: number) => {
  const agent = new QLearningAgent();
  const data = [];
  let price = basePrice;
  let position = 0; // -1: short, 0: neutral, 1: long
  let portfolio_value = 10000;
  let cash = 10000;
  let shares = 0;
  
  for (let episode = 0; episode < 100; episode++) {
    // Generate market data
    const trend = (Math.random() - 0.5) * 0.02;
    const noise = (Math.random() - 0.5) * 0.04;
    price = price * (1 + trend + noise);
    
    // Calculate technical indicators
    const sma = price * (1 + (Math.random() - 0.5) * 0.01);
    const rsi = 30 + Math.random() * 40;
    
    // Get state and action
    const state = agent.getState(price, sma, rsi);
    const action = agent.chooseAction(state);
    
    // Execute action and calculate reward
    let reward = 0;
    const prevValue = portfolio_value;
    
    if (action === 'BUY' && position <= 0) {
      if (cash >= price) {
        const buyShares = Math.floor(cash / price);
        shares += buyShares;
        cash -= buyShares * price;
        position = 1;
      }
    } else if (action === 'SELL' && position >= 0) {
      if (shares > 0) {
        cash += shares * price;
        shares = 0;
        position = -1;
      }
    }
    
    portfolio_value = cash + shares * price;
    reward = (portfolio_value - prevValue) / prevValue;
    
    // Update Q-values
    const nextState = agent.getState(price * 1.001, sma, rsi); // simulate next state
    agent.updateQValue(state, action, reward * 1000, nextState); // scale reward
    
    // Calculate performance metrics
    const sharpeRatio = episode > 10 ? 
      (portfolio_value - 10000) / (10000 * Math.sqrt(episode) * 0.02) : 0;
    
    const maxDrawdown = episode > 0 ? 
      Math.max(0, (Math.max(...data.slice(Math.max(0, episode-10)).map(d => d.portfolioValue || 10000)) - portfolio_value) / 
      Math.max(...data.slice(Math.max(0, episode-10)).map(d => d.portfolioValue || 10000))) * 100 : 0;
    
    data.push({
      episode: episode + 1,
      price: parseFloat(price.toFixed(2)),
      action: action,
      reward: parseFloat(reward.toFixed(4)),
      portfolioValue: parseFloat(portfolio_value.toFixed(2)),
      position: position,
      state: state,
      qValue: Object.values(agent.getQTable()[state] || {}).reduce((a, b) => Math.max(a, b), 0),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(3)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      cash: parseFloat(cash.toFixed(2)),
      shares: shares
    });
  }
  
  return { data, agent };
};

// Policy Gradient simulation
const generatePolicyGradientData = (episodes: number) => {
  const data = [];
  let avgReward = 0;
  
  for (let episode = 0; episode < episodes; episode++) {
    // Simulate policy learning
    const exploration = Math.exp(-episode / 20); // Decreasing exploration
    const policyLoss = Math.random() * exploration;
    const episodeReward = Math.sin(episode / 10) + Math.random() * 0.5 - 0.25;
    
    avgReward = avgReward * 0.9 + episodeReward * 0.1; // Moving average
    
    data.push({
      episode: episode + 1,
      policyLoss: parseFloat(policyLoss.toFixed(4)),
      episodeReward: parseFloat(episodeReward.toFixed(3)),
      avgReward: parseFloat(avgReward.toFixed(3)),
      exploration: parseFloat(exploration.toFixed(3))
    });
  }
  
  return data;
};

export const ReinforcementLearning = () => {
  const rlData = stocksData.map(stock => {
    const { data, agent } = generateDQNData(stock.symbol, stock.price);
    const finalData = data[data.length - 1];
    
    return {
      ...stock,
      tradingData: data,
      agent: agent,
      finalPortfolioValue: finalData.portfolioValue,
      totalReturn: ((finalData.portfolioValue - 10000) / 10000) * 100,
      sharpeRatio: finalData.sharpeRatio,
      maxDrawdown: finalData.maxDrawdown,
      currentAction: finalData.action,
      currentPosition: finalData.position
    };
  });

  const policyGradientData = generatePolicyGradientData(50);
  
  const overallStats = {
    avgReturn: rlData.reduce((sum, d) => sum + d.totalReturn, 0) / rlData.length,
    avgSharpe: rlData.reduce((sum, d) => sum + d.sharpeRatio, 0) / rlData.length,
    profitableAgents: rlData.filter(d => d.totalReturn > 0).length,
    avgDrawdown: rlData.reduce((sum, d) => sum + d.maxDrawdown, 0) / rlData.length
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>Reinforcement Learning Trading Agents</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {overallStats.avgReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Return</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {overallStats.avgSharpe.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Sharpe Ratio</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {overallStats.profitableAgents}
              </div>
              <div className="text-sm text-muted-foreground">Profitable Agents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {overallStats.avgDrawdown.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Drawdown</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Agent Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rlData.slice(0, 4).map((stock, index) => (
          <Card key={stock.symbol}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{stock.symbol} - DQN Agent</span>
                <div className="flex space-x-2">
                  <Badge variant={stock.totalReturn > 0 ? 'default' : 'destructive'}>
                    {stock.totalReturn > 0 ? 'Profitable' : 'Loss'}
                  </Badge>
                  <Badge variant="outline">{stock.currentAction}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Portfolio Value Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stock.tradingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="episode" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="portfolioValue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Portfolio Value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Reward Chart */}
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stock.tradingData.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="episode" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="reward"
                      stroke="hsl(var(--success))"
                      fill="hsl(var(--success)/0.6)"
                      name="Reward"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Agent Statistics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Return:</span>
                    <span className={`font-medium ${stock.totalReturn > 0 ? 'text-success' : 'text-destructive'}`}>
                      {stock.totalReturn.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sharpe Ratio:</span>
                    <span className="font-medium text-info">
                      {stock.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Max Drawdown:</span>
                    <span className="font-medium text-destructive">
                      {stock.maxDrawdown.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Final Value:</span>
                    <span className="font-medium">
                      ${stock.finalPortfolioValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Action */}
              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Agent Decision:</span>
                  <div className="flex items-center space-x-2">
                    {stock.currentAction === 'BUY' ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-success font-medium">BUY</span>
                      </>
                    ) : stock.currentAction === 'SELL' ? (
                      <>
                        <Target className="h-4 w-4 text-destructive" />
                        <span className="text-destructive font-medium">SELL</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 text-warning" />
                        <span className="text-warning font-medium">HOLD</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Position: {stock.currentPosition === 1 ? 'Long' : stock.currentPosition === -1 ? 'Short' : 'Neutral'} | 
                  Q-Learning agent trained over 100 episodes
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Policy Gradient Learning Curve */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-info" />
            <span>Policy Gradient Learning Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={policyGradientData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="episode" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="avgReward" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Average Reward"
                />
                <Line 
                  type="monotone" 
                  dataKey="policyLoss" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  name="Policy Loss"
                />
                <Line 
                  type="monotone" 
                  dataKey="exploration" 
                  stroke="hsl(var(--warning))" 
                  strokeWidth={2}
                  name="Exploration Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Agent Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-success" />
            <span>RL Agent Performance Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Agent</th>
                  <th className="text-right p-2">Return</th>
                  <th className="text-right p-2">Sharpe</th>
                  <th className="text-right p-2">Drawdown</th>
                  <th className="text-right p-2">Action</th>
                  <th className="text-right p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rlData.map((stock) => (
                  <tr key={stock.symbol} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{stock.symbol}</td>
                    <td className={`text-right p-2 ${stock.totalReturn > 0 ? 'text-success' : 'text-destructive'}`}>
                      {stock.totalReturn.toFixed(1)}%
                    </td>
                    <td className="text-right p-2 text-info">
                      {stock.sharpeRatio.toFixed(2)}
                    </td>
                    <td className="text-right p-2 text-destructive">
                      {stock.maxDrawdown.toFixed(1)}%
                    </td>
                    <td className="text-right p-2">
                      <Badge 
                        variant={stock.currentAction === 'BUY' ? 'default' : 
                                stock.currentAction === 'SELL' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {stock.currentAction}
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      {stock.totalReturn > 5 ? '🟢 Excellent' : 
                       stock.totalReturn > 0 ? '🔵 Profitable' : 
                       '🔴 Needs Training'}
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