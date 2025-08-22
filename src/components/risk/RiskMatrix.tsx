import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface RiskCell {
  probability: number;
  impact: number;
  value: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export const RiskMatrix = () => {
  const [matrix, setMatrix] = useState<RiskCell[][]>([]);
  
  // Generate risk matrix data
  useEffect(() => {
    const generateMatrix = () => {
      const newMatrix: RiskCell[][] = [];
      
      for (let i = 0; i < 5; i++) {
        const row: RiskCell[] = [];
        for (let j = 0; j < 5; j++) {
          const probability = (i + 1) * 20; // 20, 40, 60, 80, 100
          const impact = (j + 1) * 20; // 20, 40, 60, 80, 100
          const value = (probability * impact) / 100;
          
          let risk: 'low' | 'medium' | 'high' | 'critical';
          if (value <= 25) risk = 'low';
          else if (value <= 50) risk = 'medium';
          else if (value <= 75) risk = 'high';
          else risk = 'critical';
          
          row.push({ probability, impact, value, risk });
        }
        newMatrix.push(row);
      }
      
      setMatrix(newMatrix);
    };
    
    generateMatrix();
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-success/20 text-success border-success/50';
      case 'medium': return 'bg-warning/20 text-warning border-warning/50';
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/50';
      case 'critical': return 'bg-destructive/40 text-destructive border-destructive';
      default: return 'bg-muted';
    }
  };

  const impactLabels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
  const probabilityLabels = ['Very Rare', 'Rare', 'Possible', 'Likely', 'Almost Certain'];

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex justify-center space-x-2 text-xs">
        <Badge className="bg-success/20 text-success border-success/50">Low</Badge>
        <Badge className="bg-warning/20 text-warning border-warning/50">Medium</Badge>
        <Badge className="bg-destructive/20 text-destructive border-destructive/50">High</Badge>
        <Badge className="bg-destructive/40 text-destructive border-destructive">Critical</Badge>
      </div>

      {/* Risk Matrix */}
      <div className="grid grid-cols-6 gap-1 text-xs">
        {/* Empty corner */}
        <div />
        
        {/* Impact header */}
        {impactLabels.map((label, i) => (
          <div key={i} className="text-center font-medium text-muted-foreground p-2">
            {label}
          </div>
        ))}

        {/* Matrix rows */}
        {matrix.map((row, i) => (
          <div key={i} className="contents">
            {/* Probability label */}
            <div className="text-right font-medium text-muted-foreground p-2 flex items-center justify-end">
              {probabilityLabels[i]}
            </div>
            
            {/* Risk cells */}
            {row.map((cell, j) => (
              <Card 
                key={j} 
                className={`aspect-square flex items-center justify-center font-bold text-xs border-2 transition-all duration-200 hover:scale-105 cursor-pointer ${getRiskColor(cell.risk)}`}
              >
                {cell.value.toFixed(0)}
              </Card>
            ))}
          </div>
        ))}
      </div>

      {/* Axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <div className="text-center flex-1">
          <div className="font-medium">Probability →</div>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="text-xs text-muted-foreground font-medium -rotate-90">
          ← Impact
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-card/50 p-3 rounded-lg border">
          <div className="text-xs text-muted-foreground">Avg Risk Score</div>
          <div className="text-lg font-bold text-primary">
            {matrix.flat().reduce((sum, cell) => sum + cell.value, 0) / 25 || 0}
          </div>
        </div>
        
        <div className="bg-card/50 p-3 rounded-lg border">
          <div className="text-xs text-muted-foreground">Critical Risks</div>
          <div className="text-lg font-bold text-destructive">
            {matrix.flat().filter(cell => cell.risk === 'critical').length}
          </div>
        </div>
      </div>
    </div>
  );
};