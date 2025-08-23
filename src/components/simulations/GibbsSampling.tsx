import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

interface GibbsState {
  iteration: number;
  x: number;
  y: number;
  logLikelihood: number;
}

interface ParameterTrace {
  iteration: number;
  x: number;
  y: number;
}

export const GibbsSampling = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [states, setStates] = useState<GibbsState[]>([]);
  const [traces, setTraces] = useState<ParameterTrace[]>([]);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [convergence, setConvergence] = useState({ x: false, y: false });

  const maxIterations = 5000;
  const burnIn = 1000;

  // Target distribution parameters (bivariate normal)
  const targetMeanX = 0;
  const targetMeanY = 0;
  const targetSigmaX = 1;
  const targetSigmaY = 1;
  const correlation = 0.7;

  // Calculate conditional distributions for Gibbs sampling
  const sampleXGivenY = (y: number): number => {
    const conditionalMean = targetMeanX + correlation * (targetSigmaX / targetSigmaY) * (y - targetMeanY);
    const conditionalSigma = targetSigmaX * Math.sqrt(1 - correlation * correlation);
    return conditionalMean + conditionalSigma * (Math.random() * 2 - 1) * Math.sqrt(3); // Approximation using uniform
  };

  const sampleYGivenX = (x: number): number => {
    const conditionalMean = targetMeanY + correlation * (targetSigmaY / targetSigmaX) * (x - targetMeanX);
    const conditionalSigma = targetSigmaY * Math.sqrt(1 - correlation * correlation);
    return conditionalMean + conditionalSigma * (Math.random() * 2 - 1) * Math.sqrt(3); // Approximation using uniform
  };

  const logLikelihood = (x: number, y: number): number => {
    const det = targetSigmaX * targetSigmaY * Math.sqrt(1 - correlation * correlation);
    const invSigmaXX = 1 / (targetSigmaX * targetSigmaX * (1 - correlation * correlation));
    const invSigmaYY = 1 / (targetSigmaY * targetSigmaY * (1 - correlation * correlation));
    const invSigmaXY = -correlation / (targetSigmaX * targetSigmaY * (1 - correlation * correlation));
    
    const dx = x - targetMeanX;
    const dy = y - targetMeanY;
    
    const exponent = -0.5 * (invSigmaXX * dx * dx + invSigmaYY * dy * dy + 2 * invSigmaXY * dx * dy);
    return exponent - Math.log(2 * Math.PI * det);
  };

  const gibbsStep = useCallback((currentX: number, currentY: number): { x: number; y: number } => {
    // Sample X given Y
    const newX = sampleXGivenY(currentY);
    
    // Sample Y given new X
    const newY = sampleYGivenX(newX);
    
    return { x: newX, y: newY };
  }, []);

  const checkConvergence = useCallback((traces: ParameterTrace[]): { x: boolean; y: boolean } => {
    if (traces.length < 100) return { x: false, y: false };
    
    const recent = traces.slice(-100);
    const earlier = traces.slice(-200, -100);
    
    if (earlier.length === 0) return { x: false, y: false };
    
    const recentMeanX = recent.reduce((sum, t) => sum + t.x, 0) / recent.length;
    const recentMeanY = recent.reduce((sum, t) => sum + t.y, 0) / recent.length;
    const earlierMeanX = earlier.reduce((sum, t) => sum + t.x, 0) / earlier.length;
    const earlierMeanY = earlier.reduce((sum, t) => sum + t.y, 0) / earlier.length;
    
    const convergedX = Math.abs(recentMeanX - earlierMeanX) < 0.01;
    const convergedY = Math.abs(recentMeanY - earlierMeanY) < 0.01;
    
    return { x: convergedX, y: convergedY };
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setStates(prev => {
        const currentState = prev[prev.length - 1] || { 
          iteration: 0, 
          x: Math.random() * 2 - 1, 
          y: Math.random() * 2 - 1, 
          logLikelihood: 0 
        };
        
        if (currentState.iteration >= maxIterations) {
          setIsRunning(false);
          return prev;
        }

        const { x: newX, y: newY } = gibbsStep(currentState.x, currentState.y);
        const newLogLikelihood = logLikelihood(newX, newY);
        
        const newState: GibbsState = {
          iteration: currentState.iteration + 1,
          x: newX,
          y: newY,
          logLikelihood: newLogLikelihood
        };

        const newStates = [...prev, newState];
        
        // Update traces (skip burn-in period)
        if (newState.iteration > burnIn) {
          setTraces(prevTraces => {
            const newTrace: ParameterTrace = {
              iteration: newState.iteration,
              x: newX,
              y: newY
            };
            const newTraces = [...prevTraces, newTrace];
            
            // Check convergence
            setConvergence(checkConvergence(newTraces));
            
            return newTraces;
          });
        }
        
        setCurrentIteration(newState.iteration);
        return newStates;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, gibbsStep, checkConvergence]);

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setStates([]);
    setTraces([]);
    setCurrentIteration(0);
    setConvergence({ x: false, y: false });
  };

  const currentState = states[states.length - 1];
  const effectiveTraces = traces.slice(-1000); // Show last 1000 points for performance
  const scatterData = effectiveTraces.map(trace => ({ x: trace.x, y: trace.y }));
  
  // Calculate statistics from post-burn-in samples
  const postBurnInStates = states.filter(s => s.iteration > burnIn);
  const meanX = postBurnInStates.length > 0 ? postBurnInStates.reduce((sum, s) => sum + s.x, 0) / postBurnInStates.length : 0;
  const meanY = postBurnInStates.length > 0 ? postBurnInStates.reduce((sum, s) => sum + s.y, 0) / postBurnInStates.length : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Button 
            onClick={toggleSimulation}
            variant={isRunning ? "secondary" : "default"}
            size="sm"
          >
            {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={resetSimulation} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
        <Badge variant={isRunning ? "default" : "secondary"}>
          {isRunning ? 'Running' : 'Stopped'}
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{currentIteration} / {maxIterations} iterations</span>
        </div>
        <Progress value={(currentIteration / maxIterations) * 100} className="w-full" />
      </div>

      {/* Current Estimates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mean X (μₓ)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {meanX.toFixed(3)}
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {targetMeanX.toFixed(3)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mean Y (μᵧ)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {meanY.toFixed(3)}
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {targetMeanY.toFixed(3)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Samples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {postBurnInStates.length.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Post burn-in
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Convergence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Badge variant={convergence.x ? "default" : "secondary"} className="text-xs">
                X: {convergence.x ? '✓' : '○'}
              </Badge>
              <Badge variant={convergence.y ? "default" : "secondary"} className="text-xs">
                Y: {convergence.y ? '✓' : '○'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Parameter Traces */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Parameter Traces</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={effectiveTraces}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="iteration" 
                    type="number"
                    scale="linear"
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis domain={[-3, 3]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="x" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={1.5}
                    name="X parameter"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="hsl(var(--info))" 
                    strokeWidth={1.5}
                    name="Y parameter"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Parameter Space */}
        <Card>
          <CardHeader>
            <CardTitle>Parameter Space Exploration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={scatterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    domain={[-3, 3]}
                    name="X"
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    domain={[-3, 3]}
                    name="Y"
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [Number(value).toFixed(3), name]}
                  />
                  <Scatter 
                    name="Samples" 
                    data={scatterData}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>About Gibbs Sampling</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gibbs sampling is a MCMC algorithm for sampling from multivariate distributions. It samples from 
            conditional distributions sequentially, making it particularly useful for high-dimensional problems. 
            This simulation targets a bivariate normal distribution with correlation ρ = {correlation}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};