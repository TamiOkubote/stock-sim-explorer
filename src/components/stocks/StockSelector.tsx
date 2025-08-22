import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Play } from "lucide-react";
import { useState } from "react";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface StockSelectorProps {
  stocks: Stock[];
}

export const StockSelector = ({ stocks }: StockSelectorProps) => {
  const [selectedStocks, setSelectedStocks] = useState<string[]>([stocks[0]?.symbol || ""]);

  const toggleStock = (symbol: string) => {
    setSelectedStocks(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Top Performing Stocks</h3>
          <Button size="sm" className="gap-2">
            <Play className="h-4 w-4" />
            Run Analysis
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {stocks.map((stock) => {
            const isSelected = selectedStocks.includes(stock.symbol);
            const isPositive = stock.change >= 0;
            
            return (
              <div
                key={stock.symbol}
                onClick={() => toggleStock(stock.symbol)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  isSelected 
                    ? 'border-primary bg-primary/10 shadow-lg' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm">{stock.symbol}</div>
                  {isPositive ? (
                    <ArrowUp className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-destructive" />
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground mb-2 truncate">
                  {stock.name}
                </div>
                
                <div className="space-y-1">
                  <div className="font-semibold">${stock.price.toFixed(2)}</div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={isPositive ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="mt-2 w-full h-1 bg-primary rounded-full animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          Selected: {selectedStocks.join(', ')} • {selectedStocks.length} stock{selectedStocks.length !== 1 ? 's' : ''} for analysis
        </div>
      </CardContent>
    </Card>
  );
};