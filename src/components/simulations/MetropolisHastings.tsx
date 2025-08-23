import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";

interface MHState {
  iteration: number;
  mu: number;
  sigma: number;
  accepted: boolean;
  likelihood: number;
}

interface ParameterTrace {
  iteration: number;
  mu: number;
  sigma: number;
}

export const MetropolisHastings = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [states, setStates] = useState<MHState[]>([]);
  const [traces, setTraces] = useState<ParameterTrace[]>([]);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [acceptanceRate, setAcceptanceRate] = useState(0);
  const [convergence, setConvergence] = useState(false);
  const maxIterations = 1000;

  // Target distribution: Normal with unknown parameters
  const targetData = [175, 172, 178, 176, 174, 179, 173, 177, 175, 176]; // Sample stock prices

  // Log-likelihood function for normal distribution
  const logLikelihood = (mu: number, sigma: number, data: number[]) => {
    const n = data.length;
    let sum = 0;
    for (const x of data) {
      sum += (x - mu) ** 2;
    }
    return -0.5 * n * Math.log(2 * Math.PI) - n * Math.log(sigma) - sum / (2 * sigma ** 2);
  };

  // Metropolis-Hastings step
  const mhStep = (currentMu: number, currentSigma: number) => {
    // Propose new parameters
    const proposalMu = currentMu + (Math.random() - 0.5) * 2; // Random walk
    const proposalSigma = Math.max(0.1, currentSigma + (Math.random() - 0.5) * 0.5);

    // Calculate likelihood ratio
    const currentLL = logLikelihood(currentMu, currentSigma, targetData);
    const proposalLL = logLikelihood(proposalMu, proposalSigma, targetData);
    
    const alpha = Math.min(1, Math.exp(proposalLL - currentLL));
    const accepted = Math.random() < alpha;

    return {
      mu: accepted ? proposalMu : currentMu,
      sigma: accepted ? proposalSigma : currentSigma,
      accepted,
      likelihood: accepted ? proposalLL : currentLL
    };
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && currentIteration < maxIterations) {
      interval = setInterval(() => {
        setStates(prev => {
          const lastState = prev.length > 0 ? prev[prev.length - 1] : { mu: 175, sigma: 2 };
          const newState = mhStep(lastState.mu, lastState.sigma);
          
          const newStates = [...prev, {
            iteration: currentIteration + 1,
            ...newState
          }];

          // Update traces for plotting
          setTraces(prevTraces => {
            const newTrace = {
              iteration: currentIteration + 1,
              mu: newState.mu,
              sigma: newState.sigma
            };
            return [...prevTraces, newTrace].slice(-1000); // Keep last 1000 points
          });

          // Calculate acceptance rate
          const accepted = newStates.filter(s => s.accepted).length;
          setAcceptanceRate((accepted / newStates.length) * 100);

          // Check convergence (simplified)
          if (newStates.length > 1000) {
            const recent = newStates.slice(-500);
            const muVar = recent.reduce((sum, s) => sum + s.mu, 0) / recent.length;
            const muStd = Math.sqrt(recent.reduce((sum, s) => sum + (s.mu - muVar) ** 2, 0) / recent.length);
            setConvergence(muStd < 0.5); // Converged if std dev is small
          }

          return newStates.slice(-2000); // Keep last 2000 states
        });

        setCurrentIteration(prev => {
          const next = prev + 1;
          if (next >= maxIterations) {
            setIsRunning(false);
          }
          return next;
        });
      }, 20); // Fast simulation
    }

    return () => clearInterval(interval);
  }, [isRunning, currentIteration, maxIterations]);

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setStates([]);
    setTraces([]);
    setCurrentIteration(0);
    setAcceptanceRate(0);
    setConvergence(false);
  };

  const currentMu = states.length > 0 ? states[states.length - 1].mu : 175;
  const currentSigma = states.length > 0 ? states[states.length - 1].sigma : 2;
  const progress = (currentIteration / maxIterations) * 100;

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
            {isRunning ? 'Pause' : 'Start'} MCMC
          </Button>
          
          <Button onClick={resetSimulation} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant={convergence ? "default" : "secondary"} className="gap-1">
            <Zap className="h-3 w-3" />
            {convergence ? 'Converged' : 'Sampling'}
          </Badge>
          <Badge variant="outline">
            {currentIteration.toLocaleString()}/{maxIterations.toLocaleString()}
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

      {/* Current Estimates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Mean (μ)</div>
          <div className="text-2xl font-bold text-primary">{currentMu.toFixed(3)}</div>
        </div>
        
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Std Dev (σ)</div>
          <div className="text-2xl font-bold text-info">{currentSigma.toFixed(3)}</div>
        </div>
        
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Acceptance Rate</div>
          <div className={`text-2xl font-bold ${acceptanceRate > 20 && acceptanceRate < 60 ? 'text-success' : 'text-warning'}`}>
            {acceptanceRate.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-card/50 p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Samples</div>
          <div className="text-2xl font-bold text-muted-foreground">{states.length.toLocaleString()}</div>
        </div>
      </div>

      {/* Parameter Traces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mu trace */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">μ Parameter Trace</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={traces.slice(-500)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="iteration" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mu" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={1}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sigma trace */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">σ Parameter Trace</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={traces.slice(-500)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="iteration" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sigma" 
                  stroke="hsl(var(--info))" 
                  strokeWidth={1}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Parameter Space */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Parameter Space Exploration</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={traces.slice(-1000)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="mu" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                name="μ"
              />
              <YAxis 
                dataKey="sigma"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                name="σ"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                formatter={(value: number, name: string) => [value.toFixed(3), name]}
              />
              <Scatter 
                dataKey="sigma" 
                fill="hsl(var(--primary) / 0.6)"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Algorithm Info */}
      <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
        <strong>Metropolis-Hastings Algorithm:</strong> Sampling from posterior distribution of normal parameters (μ, σ) 
        given observed stock price data. Optimal acceptance rate: 20-50%. 
        Target data: [{targetData.join(', ')}]
      </div>
    </div>
  );
};