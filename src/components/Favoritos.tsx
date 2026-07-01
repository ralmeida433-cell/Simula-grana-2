import React, { useState, useEffect } from 'react';
import { 
  Star,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Trash2,
  DollarSign,
  AlertCircle,
  Briefcase,
  Building2,
  BarChart3,
  Globe,
  Loader2,
  PieChart,
  HelpCircle
} from 'lucide-react';
import { useFavorites, FavoriteAsset, AssetCategory } from '../contexts/FavoritesContext';
import { cn } from '../lib/utils';
import { AssetPrice } from './shared/AssetPrice';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AssetDetailsData {
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  currency: string;
  historicalData: any[];
  fundamentals: any;
  loading: boolean;
  error: boolean;
}

const formatLargeNumber = (num?: number) => {
  if (!num) return 'N/D';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + ' B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + ' M';
  return num.toFixed(2);
};

const formatPercent = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'N/D';
  return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
};

const getRiskAlerts = (fundamentals: any, currentPrice: number, basePrice: number, type: AssetCategory) => {
  const alerts = [];
  const rentabilidade = ((currentPrice - basePrice) / basePrice) * 100;

  if (rentabilidade < -15) {
    alerts.push({ type: 'danger', message: `Queda acentuada de ${Math.abs(rentabilidade).toFixed(1)}% desde que você favoritou o ativo.` });
  }

  if (fundamentals) {
    // Debt alerts (for stocks)
    if (type.includes('Ações') && fundamentals.enterpriseToEbitda && fundamentals.enterpriseToEbitda > 15) {
      alerts.push({ type: 'warning', message: `Múltiplo EV/EBITDA alto (${fundamentals.enterpriseToEbitda.toFixed(1)}x), indicando possível endividamento ou precificação esticada.` });
    }
    
    // Profit margin drops
    if (fundamentals.profitMargins && fundamentals.profitMargins < 0.05 && fundamentals.profitMargins > -1) {
      alerts.push({ type: 'warning', message: `Margem de lucro estreita (${(fundamentals.profitMargins * 100).toFixed(1)}%). A empresa tem pouco espaço para erro.` });
    } else if (fundamentals.profitMargins && fundamentals.profitMargins < 0) {
      alerts.push({ type: 'danger', message: 'A empresa está apresentando prejuízo (margem líquida negativa).' });
    }

    // P/E alerts
    if (fundamentals.trailingPE && fundamentals.trailingPE > 30) {
      alerts.push({ type: 'warning', message: `P/L muito elevado (${fundamentals.trailingPE.toFixed(1)}x), o que pode indicar sobrevalorização em relação ao lucro atual.` });
    } else if (fundamentals.trailingPE && fundamentals.trailingPE < 0) {
       alerts.push({ type: 'danger', message: 'Preço/Lucro negativo, indicando que a empresa não está gerando lucros.' });
    }

    // P/B for FIIs
    if ((type === 'FIIs' || type === 'REITs') && fundamentals.priceToBook) {
      if (fundamentals.priceToBook > 1.2) {
        alerts.push({ type: 'warning', message: `Sendo negociado com ágio relevante (P/VP de ${fundamentals.priceToBook.toFixed(2)}).` });
      } else if (fundamentals.priceToBook < 0.7) {
         alerts.push({ type: 'warning', message: `Desconto muito forte (P/VP de ${fundamentals.priceToBook.toFixed(2)}), pode indicar estresse no portfólio ou oportunidade.` });
      }
    }
  }

  return alerts;
};

export default function Favoritos() {
  const { favorites, removeFavorite } = useFavorites();
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'Todos'>('Todos');
  const [selectedAsset, setSelectedAsset] = useState<FavoriteAsset | null>(null);
  const [assetsData, setAssetsData] = useState<Record<string, AssetDetailsData>>({});

  const categories: (AssetCategory | 'Todos')[] = ['Todos', 'Ações BR', 'Ações EUA', 'ETFs', 'FIIs', 'REITs'];

  const filteredFavorites = activeCategory === 'Todos' 
    ? favorites 
    : favorites.filter(f => f.category === activeCategory);

  useEffect(() => {
    // Fetch current data for all favorites
    const fetchAllData = async () => {
      const newAssetsData = { ...assetsData };
      let updated = false;

      for (const asset of favorites) {
        if (!newAssetsData[asset.ticker] || newAssetsData[asset.ticker].error) {
          newAssetsData[asset.ticker] = { loading: true, error: false, regularMarketPrice: 0, regularMarketChangePercent: 0, currency: asset.currency, historicalData: [], fundamentals: null };
          updated = true;
        }
      }
      
      if (updated) {
        setAssetsData(newAssetsData);
      }

      for (const asset of favorites) {
        // Skip if we already have valid data (to avoid spamming API on every render, though a real app might use React Query or SWR)
        // Here we'll just fetch if we don't have it or if it's currently marked as loading
        if (assetsData[asset.ticker] && !assetsData[asset.ticker].loading && !assetsData[asset.ticker].error) {
          continue;
        }

        try {
          const res = await fetch(`/api/fin/${asset.ticker}`);
          if (!res.ok) throw new Error('API Error');
          const data = await res.json();
          
          let histRes = null;
          try {
             // For history, fetch from start date
             const d = new Date(asset.favoritedAt);
             const startTs = Math.floor(d.getTime() / 1000);
             const url = `/api/fin/history?ticker=${asset.ticker}&start=${startTs}&interval=1d`; // Assuming this route doesn't exist, we fallback to brapi or something else.
             // Wait, there is no /api/fin/history with start date out of the box unless we implement it. We can just use the regular quote which brings history usually, or we can mock it.
             // Let's check what we have in `data.historicalDataPrice`.
             
          } catch(e) {}

          setAssetsData(prev => ({
            ...prev,
            [asset.ticker]: {
              loading: false,
              error: false,
              regularMarketPrice: data.regularMarketPrice,
              regularMarketChangePercent: data.regularMarketChangePercent,
              currency: data.currency,
              fundamentals: data.defaultKeyStatistics || {},
              historicalData: data.historicalDataPrice || []
            }
          }));
        } catch (error) {
          setAssetsData(prev => ({
            ...prev,
            [asset.ticker]: {
              ...prev[asset.ticker],
              loading: false,
              error: true
            }
          }));
        }
      }
    };

    if (favorites.length > 0) {
      fetchAllData();
    }
  }, [favorites]); // Removed assetsData from dependency array to avoid infinite loop

  if (selectedAsset) {
    const data = assetsData[selectedAsset.ticker];
    const isDataLoading = !data || data.loading;
    const currentPrice = data?.regularMarketPrice || selectedAsset.priceAtFavoritation;
    const rentabilidade = ((currentPrice - selectedAsset.priceAtFavoritation) / selectedAsset.priceAtFavoritation) * 100;
    const isPositive = rentabilidade >= 0;

    // Filter history starting from favoritedAt
    const favTimestamp = new Date(selectedAsset.favoritedAt).getTime() / 1000;
    const filteredHistory = (data?.historicalData || []).filter((h: any) => h.date >= favTimestamp).map((h: any) => ({
       ...h,
       dateStr: format(new Date(h.date * 1000), 'dd/MM'),
       rentabilidade: ((h.close - selectedAsset.priceAtFavoritation) / selectedAsset.priceAtFavoritation) * 100
    }));
    
    // Add point zero
    if (filteredHistory.length === 0 || filteredHistory[0].date > favTimestamp + 86400) {
       filteredHistory.unshift({
          date: favTimestamp,
          dateStr: format(new Date(selectedAsset.favoritedAt), 'dd/MM'),
          close: selectedAsset.priceAtFavoritation,
          rentabilidade: 0
       });
    }
    
    // Add current point
    filteredHistory.push({
       date: Date.now() / 1000,
       dateStr: 'Hoje',
       close: currentPrice,
       rentabilidade
    });

    const alerts = getRiskAlerts(data?.fundamentals, currentPrice, selectedAsset.priceAtFavoritation, selectedAsset.category);

    return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
        <button 
          onClick={() => setSelectedAsset(null)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors mb-4"
        >
          &larr; Voltar para a lista
        </button>

        <div className="bg-card border border-border p-6 sm:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
          <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 shadow-xl shadow-amber-500/10">
                   <Star className="w-8 h-8 fill-amber-500" />
                </div>
                <div>
                   <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tighter truncate max-w-[300px] sm:max-w-md">{selectedAsset.ticker}</h1>
                   <p className="text-lg text-muted-foreground font-medium">{selectedAsset.name}</p>
                </div>
             </div>
             
             <div className="flex flex-col md:items-end mt-4 md:mt-0">
               <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">Cotação Atual</p>
               {isDataLoading ? (
                 <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
               ) : (
                 <>
                   <h2 className="text-4xl sm:text-5xl font-black text-foreground font-mono">
                     <AssetPrice price={currentPrice} currency={selectedAsset.currency} ticker={selectedAsset.ticker} />
                   </h2>
                   <div className={cn(
                     "flex items-center gap-2 mt-2 px-4 py-1.5 rounded-xl text-sm font-black w-fit",
                     isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                   )}>
                     {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                     <span>Rentabilidade: {formatPercent(rentabilidade)}</span>
                   </div>
                 </>
               )}
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-6 border-t border-border/50">
             <div>
                <p className="text-xs text-muted-foreground font-black uppercase mb-1">Favoritado em</p>
                <p className="text-lg font-bold">{format(parseISO(selectedAsset.favoritedAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
             </div>
             <div>
                <p className="text-xs text-muted-foreground font-black uppercase mb-1">Preço Inicial (Ponto Zero)</p>
                <p className="text-lg font-bold font-mono"><AssetPrice price={selectedAsset.priceAtFavoritation} currency={selectedAsset.currency} ticker={selectedAsset.ticker} /></p>
             </div>
             <div className="flex justify-start md:justify-end">
                <button 
                  onClick={() => {
                    removeFavorite(selectedAsset.ticker);
                    setSelectedAsset(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors font-bold text-sm h-fit"
                >
                  <Trash2 className="w-4 h-4" /> Deixar de Acompanhar
                </button>
             </div>
          </div>
        </div>

        {/* Evolução da Rentabilidade */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                 <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-foreground">Evolução da Rentabilidade (Ponto Zero)</h3>
           </div>
           
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={filteredHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                    <XAxis 
                      dataKey="dateStr" 
                      stroke="currentColor" 
                      className="text-muted-foreground text-xs"
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="currentColor" 
                      className="text-muted-foreground text-xs font-mono"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
                      domain={['auto', 'auto']}
                      dx={-10}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '1rem', color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                      formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}%`, 'Rentabilidade']}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
                    <Line 
                      type="monotone" 
                      dataKey="rentabilidade" 
                      stroke={isPositive ? "#10b981" : "#ef4444"} 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: isPositive ? "#10b981" : "#ef4444" }}
                    />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>
        
        {/* Alertas de Risco */}
        {alerts.length > 0 && (
           <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                 </div>
                 <h3 className="text-xl font-black text-foreground">Monitoramento de Risco</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {alerts.map((alert, i) => (
                    <div key={i} className={cn(
                       "p-4 rounded-2xl border flex gap-4 items-start",
                       alert.type === 'danger' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    )}>
                       <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                       <p className="text-sm font-medium">{alert.message}</p>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* Indicadores Fundamentalistas e Dívida */}
        {data?.fundamentals && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                       <BarChart3 className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">Indicadores Chave</h3>
                 </div>
                 <div className="space-y-4">
                    {data.fundamentals.trailingPE !== undefined && (
                      <div className="flex justify-between items-center p-3 hover:bg-muted rounded-xl transition-colors">
                        <span className="text-sm font-bold text-muted-foreground">P/L (Preço/Lucro)</span>
                        <span className="font-mono font-black">{data.fundamentals.trailingPE.toFixed(2)}</span>
                      </div>
                    )}
                    {data.fundamentals.priceToBook !== undefined && (
                      <div className="flex justify-between items-center p-3 hover:bg-muted rounded-xl transition-colors">
                        <span className="text-sm font-bold text-muted-foreground">P/VP</span>
                        <span className="font-mono font-black">{data.fundamentals.priceToBook.toFixed(2)}</span>
                      </div>
                    )}
                    {data.fundamentals.yield !== undefined && (
                      <div className="flex justify-between items-center p-3 hover:bg-muted rounded-xl transition-colors">
                        <span className="text-sm font-bold text-muted-foreground">Dividend Yield</span>
                        <span className="font-mono font-black">{(data.fundamentals.yield * 100).toFixed(2)}%</span>
                      </div>
                    )}
                    {data.fundamentals.profitMargins !== undefined && (
                      <div className="flex justify-between items-center p-3 hover:bg-muted rounded-xl transition-colors">
                        <span className="text-sm font-bold text-muted-foreground">Margem Líquida</span>
                        <span className="font-mono font-black">{(data.fundamentals.profitMargins * 100).toFixed(2)}%</span>
                      </div>
                    )}
                 </div>
             </div>
             
             <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                       <Briefcase className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">Contexto de Dívida e Valor</h3>
                 </div>
                 <div className="space-y-4">
                    {data.fundamentals.enterpriseToEbitda !== undefined && (
                      <div className="flex justify-between items-center p-3 hover:bg-muted rounded-xl transition-colors">
                        <span className="text-sm font-bold text-muted-foreground">EV / EBITDA</span>
                        <span className="font-mono font-black">{data.fundamentals.enterpriseToEbitda.toFixed(2)}</span>
                      </div>
                    )}
                    {data.fundamentals.enterpriseValue !== undefined && (
                      <div className="flex justify-between items-center p-3 hover:bg-muted rounded-xl transition-colors">
                        <span className="text-sm font-bold text-muted-foreground">Valor da Firma (EV)</span>
                        <span className="font-mono font-black">{formatLargeNumber(data.fundamentals.enterpriseValue)}</span>
                      </div>
                    )}
                 </div>
                 <div className="mt-6 p-4 bg-muted rounded-xl text-sm text-muted-foreground">
                    A relação de lucro e dívida ajuda a entender se o preço da ação acompanha o desempenho real do negócio ou apenas especulação do mercado.
                 </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 w-16 h-16 rounded-2xl mb-2 text-amber-500 border border-amber-500/20 shadow-xl shadow-amber-500/10">
          <Star className="w-8 h-8 fill-amber-500" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tighter">Meus Favoritos</h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Acompanhe o desempenho, risco e fundamentos dos ativos selecionados, a partir do exato momento em que você os favoritou.
        </p>
      </div>

      {favorites.length === 0 ? (
         <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-[2.5rem] text-center shadow-sm">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
               <Star className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">Nenhum ativo favoritado</h3>
            <p className="text-muted-foreground">Use a pesquisa de ativos para favoritar ações, FIIs e ETFs.</p>
         </div>
      ) : (
        <>
          {/* Categorias */}
          <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all border shrink-0",
                  activeCategory === cat 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid de Ativos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
             {filteredFavorites.map((asset) => {
               const data = assetsData[asset.ticker];
               const isLoading = !data || data.loading;
               
               const currentPrice = data?.regularMarketPrice || asset.priceAtFavoritation;
               const rentabilidade = ((currentPrice - asset.priceAtFavoritation) / asset.priceAtFavoritation) * 100;
               const isPositive = rentabilidade >= 0;

               return (
                  <button 
                    key={asset.ticker}
                    onClick={() => setSelectedAsset(asset)}
                    className="bg-card border border-border rounded-3xl p-6 text-left hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all group flex flex-col justify-between h-[200px]"
                  >
                     <div className="flex justify-between items-start">
                        <div>
                           <h3 className="text-2xl font-black text-foreground group-hover:text-amber-500 transition-colors">{asset.ticker}</h3>
                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{asset.category}</p>
                        </div>
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                           <Star className="w-5 h-5 fill-amber-500" />
                        </div>
                     </div>
                     
                     <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Cotação Atual</p>
                        {isLoading ? (
                           <div className="h-8 w-24 bg-muted animate-pulse rounded-lg" />
                        ) : (
                           <div className="flex items-end justify-between">
                              <span className="text-2xl font-black font-mono"><AssetPrice price={currentPrice} currency={asset.currency} ticker={asset.ticker} /></span>
                              <div className={cn(
                                "flex items-center gap-1 text-sm font-black px-2 py-1 rounded-lg",
                                isPositive ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                              )}>
                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {formatPercent(rentabilidade)}
                              </div>
                           </div>
                        )}
                     </div>
                  </button>
               );
             })}
             {filteredFavorites.length === 0 && (
               <div className="col-span-full p-8 text-center text-muted-foreground border border-dashed border-border rounded-3xl bg-muted/20">
                  Nenhum ativo nesta categoria.
               </div>
             )}
          </div>
        </>
      )}
    </div>
  );
}
