import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, GitBranch, Target } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const stocksData = [
  { symbol: "LLY", name: "Eli Lilly & Co", price: 734.52, change: 2.34, volume: 2150000, marketCap: 701.2 },
  { symbol: "META", name: "Meta Platforms", price: 563.33, change: -1.23, volume: 15200000, marketCap: 1431.5 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: 3.45, volume: 89500000, marketCap: 792.1 },
  { symbol: "AAPL", name: "Apple Inc.", price: 229.87, change: 1.12, volume: 45200000, marketCap: 3520.8 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.65, change: -0.87, volume: 28400000, marketCap: 2158.7 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 140.15, change: 4.23, volume: 62800000, marketCap: 3451.2 },
  { symbol: "AMZN", name: "Amazon.com", price: 186.29, change: 0.98, volume: 38900000, marketCap: 1956.4 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 416.42, change: 1.67, volume: 23100000, marketCap: 3098.5 }
];

// K-Means clustering implementation
const euclideanDistance = (a: number[], b: number[]): number => {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
};

const kMeansClustering = (data: number[][], k: number, maxIterations: number = 100): { clusters: number[], centroids: number[][], inertia: number } => {
  const n = data.length;
  const features = data[0].length;
  
  // Initialize centroids randomly
  let centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    centroids.push(data[Math.floor(Math.random() * n)].slice());
  }
  
  let clusters = new Array(n).fill(0);
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const newClusters = new Array(n).fill(0);
    
    // Assign points to nearest centroid
    for (let i = 0; i < n; i++) {
      let minDistance = Infinity;
      let nearestCluster = 0;
      
      for (let j = 0; j < k; j++) {
        const distance = euclideanDistance(data[i], centroids[j]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCluster = j;
        }
      }
      
      newClusters[i] = nearestCluster;
    }
    
    // Update centroids
    const newCentroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, idx) => newClusters[idx] === i);
      if (clusterPoints.length > 0) {
        const centroid = new Array(features).fill(0);
        for (const point of clusterPoints) {
          for (let j = 0; j < features; j++) {
            centroid[j] += point[j];
          }
        }
        for (let j = 0; j < features; j++) {
          centroid[j] /= clusterPoints.length;
        }
        newCentroids.push(centroid);
      } else {
        newCentroids.push(centroids[i]);
      }
    }
    
    // Check for convergence
    const converged = clusters.every((cluster, idx) => cluster === newClusters[idx]);
    clusters = newClusters;
    centroids = newCentroids;
    
    if (converged) break;
  }
  
  // Calculate inertia (within-cluster sum of squares)
  let inertia = 0;
  for (let i = 0; i < n; i++) {
    const distance = euclideanDistance(data[i], centroids[clusters[i]]);
    inertia += distance * distance;
  }
  
  return { clusters, centroids, inertia };
};

// Hierarchical clustering (simplified)
const hierarchicalClustering = (data: number[][], linkage: 'single' | 'complete' | 'average' = 'complete') => {
  const n = data.length;
  const clusters = data.map((_, i) => [i]);
  const distances: number[][] = [];
  
  // Calculate distance matrix
  for (let i = 0; i < n; i++) {
    distances[i] = [];
    for (let j = 0; j < n; j++) {
      distances[i][j] = i === j ? 0 : euclideanDistance(data[i], data[j]);
    }
  }
  
  const dendrogram = [];
  
  while (clusters.length > 1) {
    let minDistance = Infinity;
    let mergeI = 0, mergeJ = 1;
    
    // Find closest clusters
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        let clusterDistance = 0;
        
        if (linkage === 'single') {
          clusterDistance = Math.min(...clusters[i].flatMap(a => 
            clusters[j].map(b => distances[a][b])));
        } else if (linkage === 'complete') {
          clusterDistance = Math.max(...clusters[i].flatMap(a => 
            clusters[j].map(b => distances[a][b])));
        } else { // average
          const allDistances = clusters[i].flatMap(a => 
            clusters[j].map(b => distances[a][b]));
          clusterDistance = allDistances.reduce((sum, d) => sum + d, 0) / allDistances.length;
        }
        
        if (clusterDistance < minDistance) {
          minDistance = clusterDistance;
          mergeI = i;
          mergeJ = j;
        }
      }
    }
    
    // Merge clusters
    dendrogram.push({
      clusters: [clusters[mergeI].slice(), clusters[mergeJ].slice()],
      distance: minDistance,
      level: clusters.length
    });
    
    clusters[mergeI] = [...clusters[mergeI], ...clusters[mergeJ]];
    clusters.splice(mergeJ, 1);
  }
  
  return dendrogram;
};

// Generate clustering analysis for stocks
const generateClusteringAnalysis = () => {
  // Normalize features for clustering
  const features = stocksData.map(stock => [
    Math.log(stock.price), // Log price
    stock.change, // Price change
    Math.log(stock.volume), // Log volume  
    Math.log(stock.marketCap) // Log market cap
  ]);
  
  // Apply K-means with different k values
  const kValues = [2, 3, 4];
  const kMeansResults = kValues.map(k => {
    const result = kMeansClustering(features, k);
    return {
      k,
      ...result,
      silhouetteScore: calculateSilhouetteScore(features, result.clusters)
    };
  });
  
  // Use best k value (highest silhouette score)
  const bestKMeans = kMeansResults.reduce((best, current) => 
    current.silhouetteScore > best.silhouetteScore ? current : best);
  
  // Apply hierarchical clustering
  const dendrogram = hierarchicalClustering(features);
  
  // Prepare visualization data
  const clusterData = stocksData.map((stock, i) => ({
    ...stock,
    cluster: bestKMeans.clusters[i],
    x: features[i][0], // Log price
    y: features[i][1], // Change
    size: Math.log(stock.volume) / 2 // Volume as size
  }));
  
  return {
    kMeansResults,
    bestKMeans,
    dendrogram,
    clusterData,
    features
  };
};

const calculateSilhouetteScore = (data: number[][], clusters: number[]): number => {
  const n = data.length;
  let totalScore = 0;
  
  for (let i = 0; i < n; i++) {
    const clusterI = clusters[i];
    
    // Calculate a(i) - average distance to points in same cluster
    const sameCluster = clusters.map((cluster, idx) => cluster === clusterI ? idx : -1).filter(idx => idx !== -1 && idx !== i);
    const a = sameCluster.length > 0 ? 
      sameCluster.reduce((sum, idx) => sum + euclideanDistance(data[i], data[idx]), 0) / sameCluster.length : 0;
    
    // Calculate b(i) - average distance to points in nearest cluster
    const otherClusters = [...new Set(clusters)].filter(cluster => cluster !== clusterI);
    let b = Infinity;
    
    for (const cluster of otherClusters) {
      const clusterPoints = clusters.map((c, idx) => c === cluster ? idx : -1).filter(idx => idx !== -1);
      if (clusterPoints.length > 0) {
        const avgDist = clusterPoints.reduce((sum, idx) => sum + euclideanDistance(data[i], data[idx]), 0) / clusterPoints.length;
        b = Math.min(b, avgDist);
      }
    }
    
    const silhouette = b === Infinity ? 0 : (b - a) / Math.max(a, b);
    totalScore += silhouette;
  }
  
  return totalScore / n;
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export const ClusteringAlgorithms = () => {
  const analysis = generateClusteringAnalysis();
  
  // Group stocks by cluster
  const clusterGroups = analysis.clusterData.reduce((groups, stock) => {
    const cluster = stock.cluster;
    if (!groups[cluster]) groups[cluster] = [];
    groups[cluster].push(stock);
    return groups;
  }, {} as { [key: number]: any[] });

  const clusterStats = Object.entries(clusterGroups).map(([cluster, stocks]) => ({
    cluster: parseInt(cluster),
    count: stocks.length,
    avgPrice: stocks.reduce((sum, s) => sum + s.price, 0) / stocks.length,
    avgChange: stocks.reduce((sum, s) => sum + s.change, 0) / stocks.length,
    avgVolume: stocks.reduce((sum, s) => sum + s.volume, 0) / stocks.length,
    avgMarketCap: stocks.reduce((sum, s) => sum + s.marketCap, 0) / stocks.length,
    stocks: stocks.map(s => s.symbol).join(', ')
  }));

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-primary" />
            <span>Stock Clustering Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {analysis.bestKMeans.k}
              </div>
              <div className="text-sm text-muted-foreground">Optimal Clusters</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {analysis.bestKMeans.silhouetteScore.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground">Silhouette Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {analysis.bestKMeans.inertia.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Inertia</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {stocksData.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Stocks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* K-Means Scatter Plot */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>K-Means Clustering (Price vs Change)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={analysis.clusterData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Log Price" 
                    fontSize={10}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Change %" 
                    fontSize={10}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.symbol}</p>
                            <p className="text-sm">Price: ${data.price}</p>
                            <p className="text-sm">Change: {data.change}%</p>
                            <p className="text-sm">Cluster: {data.cluster}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {Object.entries(clusterGroups).map(([cluster, stocks]) => (
                    <Scatter
                      key={cluster}
                      data={stocks}
                      fill={COLORS[parseInt(cluster) % COLORS.length]}
                      name={`Cluster ${cluster}`}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Elbow Method Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitBranch className="h-5 w-5 text-info" />
              <span>Elbow Method - Optimal K</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analysis.kMeansResults}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="k" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="inertia" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Inertia"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="silhouetteScore" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Silhouette Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cluster Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cluster Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clusterStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ cluster, count }) => `Cluster ${cluster}: ${count}`}
                  >
                    {clusterStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cluster Characteristics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clusterStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="cluster" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="avgPrice" 
                    fill="hsl(var(--primary))" 
                    name="Avg Price"
                  />
                  <Bar 
                    dataKey="avgChange" 
                    fill="hsl(var(--success))" 
                    name="Avg Change %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cluster Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-success" />
            <span>Cluster Analysis Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Cluster</th>
                  <th className="text-right p-2">Count</th>
                  <th className="text-right p-2">Avg Price</th>
                  <th className="text-right p-2">Avg Change</th>
                  <th className="text-right p-2">Avg Volume</th>
                  <th className="text-left p-2">Stocks</th>
                </tr>
              </thead>
              <tbody>
                {clusterStats.map((cluster) => (
                  <tr key={cluster.cluster} className="border-b hover:bg-muted/30">
                    <td className="p-2">
                      <Badge 
                        style={{ backgroundColor: COLORS[cluster.cluster % COLORS.length] }}
                        className="text-xs text-white"
                      >
                        Cluster {cluster.cluster}
                      </Badge>
                    </td>
                    <td className="text-right p-2 font-medium">
                      {cluster.count}
                    </td>
                    <td className="text-right p-2 text-primary">
                      ${cluster.avgPrice.toFixed(2)}
                    </td>
                    <td className={`text-right p-2 ${cluster.avgChange > 0 ? 'text-success' : 'text-destructive'}`}>
                      {cluster.avgChange.toFixed(2)}%
                    </td>
                    <td className="text-right p-2 text-info">
                      {(cluster.avgVolume / 1000000).toFixed(1)}M
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {cluster.stocks}
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