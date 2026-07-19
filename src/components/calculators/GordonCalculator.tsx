import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Info, Search, RefreshCw, DollarSign, HelpCircle, Loader2, Sparkles, Percent, ShieldCheck, AlertCircle } from 'lucide-react';
import { searchStockData, StockData } from '../../services/stockService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { AssetPrice } from '../shared/AssetPrice';
import PriceAlertButton from '../shared/PriceAlertButton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend, ReferenceLine } from 'recharts';

const InfoTooltip = ({ content }: { content: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative inline-flex items-center justify-center ml-1.5"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-emerald-400 cursor-help transition-colors" />
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-slate-100 text-xs rounded-xl shadow-xl z-50 pointer-events-none text-left font-normal normal-case tracking-normal leading-relaxed"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function GordonCalculator() {
  const [ticker, setTicker] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ticker') || '';
    }
    return '';
  });
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gordon specific parameters
  const [manualD0, setManualD0] = useState<number>(2.5); // Dividendo atual pago (D0)
  const [discountRate, setDiscountRate] = useState<number>(10); // Taxa de Desconto Exigida (K) em %
  const [growthRate, setGrowthRate] = useState<number>(5); // Crescimento Perpétuo de Dividendos (G) em %

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false);

  // Initial search on mount
  useEffect(() => {
    if (ticker) {
      doSearch(ticker);
    }
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTicker = params.get('ticker');
      if (urlTicker && urlTicker !== ticker) {
        setTicker(urlTicker);
        doSearch(urlTicker);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [ticker]);

  const doSearch = async (targetTicker: string) => {
    if (!targetTicker) return;
    setLoading(true);
    setError(null);
    setStockData(null);
    
    try {
      const data = await searchStockData(targetTicker);
      if (data) {
        setStockData(data);
        // Set manual dividend based on actual yield and price
        const calcD0 = data.price * (data.dividendYield / 100);
        if (calcD0 > 0) {
          setManualD0(parseFloat(calcD0.toFixed(2)));
        } else if (data.trailingAnnualDividendRate > 0) {
          setManualD0(data.trailingAnnualDividendRate);
        } else {
          setManualD0(1.5);
        }
      } else {
        setError('Ativo não encontrado ou sem dados de dividendos.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados do ativo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!ticker || ticker.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      if (isSelectingRef.current) {
        isSelectingRef.current = false;
        return;
      }

      setIsSearchingSuggestions(true);
      try {
        const res = await fetch(`/api/fin/search/${encodeURIComponent(ticker)}`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (!contentType || contentType.indexOf("application/json") === -1) return;
          const data = await res.json();
          setSuggestions(data);
          if (document.activeElement === inputRef.current) {
            setShowSuggestions(true);
          }
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsSearchingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [ticker]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
        setShowSuggestions(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        const selected = suggestions[activeSuggestionIndex];
        isSelectingRef.current = true;
        setTicker(selected.ticker);
        setShowSuggestions(false);
        inputRef.current?.blur();
        doSearch(selected.ticker);
      } else {
        handleSearch();
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    doSearch(ticker);
  };

  // Calculations
  const currentPrice = stockData ? stockData.price : 40.90;
  
  // D1 = Dividendo esperado no próximo ano
  const d1 = manualD0 * (1 + growthRate / 100);
  
  // Preço Justo Gordon = D1 / (K - G)
  const isModelValid = discountRate > growthRate;
  const precoTeto = isModelValid ? d1 / ((discountRate - growthRate) / 100) : 0;
  
  const marginPercentage = stockData ? ((precoTeto - currentPrice) / currentPrice) * 100 : 0;
  const isOpportunity = isModelValid && currentPrice < precoTeto;

  // Chart Data showing sensitivity of Fair Price to Growth Rate G
  const chartData = Array.from({ length: 9 }).map((_, i) => {
    // Generates growth rates G smaller than K (e.g., from discountRate - 8 to discountRate - 0.5)
    const step = (discountRate - 1) / 8;
    const g = parseFloat((0.5 + i * step).toFixed(2));
    const calcD1 = manualD0 * (1 + g / 100);
    const scenarioTeto = discountRate > g ? calcD1 / ((discountRate - g) / 100) : 0;
    return {
      name: `${g}%`,
      'Taxa Crescimento (G)': g,
      'Preço Estimado': parseFloat(scenarioTeto.toFixed(2)),
      'Preço Atual': parseFloat(currentPrice.toFixed(2)),
    };
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4 sm:space-y-8 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
      {/* Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg sm:rounded-xl text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h2 className="text-sm sm:text-xl font-bold text-foreground">Modelo de Gordon <span className="hidden sm:inline">(Dividend Growth Model)</span></h2>
          <p className="text-slate-500 text-[10px] sm:text-sm">Calcule o preço justo de dividendos perpétuos com taxas de crescimento e taxas de desconto customizáveis.</p>
        </div>
      </div>

      {/* Autocomplete Input */}
      <div className="flex flex-col sm:flex-row gap-2 relative">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => ticker.length >= 2 && setShowSuggestions(true)}
            placeholder="Digite o ticker (ex: PETR4, TAEE11)"
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none uppercase text-xs sm:text-base dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-700"
              >
                {suggestions.map((item, index) => (
                  <button
                    key={item.ticker}
                    onMouseDown={() => {
                      isSelectingRef.current = true;
                      setTicker(item.ticker);
                      setShowSuggestions(false);
                      doSearch(item.ticker);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between text-xs sm:text-sm",
                      activeSuggestionIndex === index && "bg-slate-50 dark:bg-slate-700/50"
                    )}
                  >
                    <div>
                      <span className="font-bold text-foreground">{item.ticker}</span>
                      <span className="text-slate-400 ml-2 text-xs">{item.name}</span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => doSearch(ticker)}
          disabled={loading || !ticker}
          className="px-4 py-2 sm:px-6 sm:py-2.5 bg-emerald-600 text-white font-bold rounded-lg sm:rounded-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-base cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Buscar
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs sm:text-sm flex items-center gap-2 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Form & Results */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Parameters input */}
        <div className="md:col-span-4 space-y-4 sm:space-y-6 bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <Sparkles className="w-4 h-4 text-emerald-500" /> Parâmetros de Gordon
          </h3>

          <div className="space-y-4">
            {/* D0 Input */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                Dividendo Pago Últimos 12M (D0)
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-mono text-xs sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  value={manualD0}
                  onChange={(e) => setManualD0(parseFloat(e.target.value) || 0)}
                  className="block w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 text-xs sm:text-sm dark:bg-slate-850 dark:border-slate-700 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Discount Rate K */}
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1 text-foreground">
                <span className="flex items-center gap-1">
                  Taxa de Retorno Exigida (K)
                  <InfoTooltip content="A taxa mínima de retorno (Custo de Capital Próprio) exigida pelo acionista. Geralmente entre 8% e 12%." />
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{discountRate}%</span>
              </div>
              <input
                type="range"
                min="6"
                max="25"
                step="0.5"
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>6%</span>
                <span>25%</span>
              </div>
            </div>

            {/* Perpetual Growth Rate G */}
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1 text-foreground">
                <span className="flex items-center gap-1">
                  Crescimento de Dividendos (G)
                  <InfoTooltip content="A taxa estimada de crescimento perpétuo anual dos dividendos da companhia. Deve ser menor do que a Taxa K." />
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{growthRate}%</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.min(discountRate - 0.5, 15)}
                step="0.5"
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>0%</span>
                <span>{Math.min(discountRate - 0.5, 15)}%</span>
              </div>
            </div>
          </div>

          {stockData && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Resumo Financeiro</div>
              <div className="flex items-center gap-3">
                {stockData.logourl ? (
                  <img src={stockData.logourl} alt={stockData.name} className="w-8 h-8 rounded-xl object-contain bg-white p-1 border border-slate-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-center flex items-center justify-center text-xs">
                    {stockData.ticker.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-foreground truncate uppercase">{stockData.ticker}</div>
                  <div className="text-xs text-slate-400 truncate">{stockData.name}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400">Preço Mercado</div>
                  <div className="font-mono font-bold text-xs text-foreground">R$ {stockData.price.toFixed(2)}</div>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400">Yield Real %</div>
                  <div className="font-mono font-bold text-xs text-foreground">{stockData.dividendYield.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results column */}
        <div className="md:col-span-8 space-y-6 sm:space-y-8">
          {!isModelValid ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-800 dark:text-amber-300 space-y-2 text-xs sm:text-sm">
              <div className="font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Configuração Inválida de Parâmetros
              </div>
              <p>A Taxa de Desconto Exigida (K) deve ser estritamente maior que a Taxa de Crescimento Perpétuo dos Dividendos (G) para que o Modelo de Gordon seja matematicamente aplicável. Reduza a taxa de crescimento ou aumente o retorno exigido.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Current Price */}
                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Preço de Mercado</span>
                    <span className="text-xs text-slate-400 font-normal">Preço de negociação atual</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-black text-foreground">R$ {currentPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Expected Dividend D1 */}
                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Dividendo Esperado (D1)</span>
                    <span className="text-xs text-slate-400 font-normal">D0 * (1 + G) para o próximo ano</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">R$ {d1.toFixed(2)}</span>
                  </div>
                </div>

                {/* Gordon Price */}
                <div className={cn(
                  "border rounded-2xl p-4 flex flex-col justify-between transition-all",
                  isOpportunity 
                    ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-800 dark:text-emerald-300" 
                    : "bg-rose-500/5 border-rose-500/30 text-rose-800 dark:text-rose-300"
                )}>
                  <div>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider block",
                      isOpportunity ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>Preço Teto Gordon</span>
                    <span className="text-xs text-slate-400 font-normal">Valuation intrínseco Gordon</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-black">R$ {precoTeto.toFixed(2)}</span>
                    <span className={cn(
                      "text-xs font-mono font-bold px-1.5 py-0.5 rounded",
                      isOpportunity ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                    )}>
                      {isOpportunity ? 'ABAIXO' : 'ACIMA'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Alert Banner */}
              <div className={cn(
                "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5",
                isOpportunity 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 text-emerald-800 dark:text-emerald-300" 
                  : "bg-rose-50 dark:bg-rose-950/20 border-rose-200/50 text-rose-800 dark:text-rose-300"
              )}>
                <div className="space-y-1">
                  <div className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    {isOpportunity ? 'Análise: Desconto intrínseco favorável' : 'Análise: Ativo sobreprecificado'}
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed max-w-xl">
                    {isOpportunity 
                      ? `O preço atual de R$ ${currentPrice.toFixed(2)} é inferior ao teto de Gordon de R$ ${precoTeto.toFixed(2)}. Oferecendo uma margem implícita de ${Math.abs(marginPercentage).toFixed(1)}% sob a premissa de dividendos perpétuos.`
                      : `O preço atual de R$ ${currentPrice.toFixed(2)} está com prêmio de ${Math.abs(marginPercentage).toFixed(1)}% acima do teto calculado de R$ ${precoTeto.toFixed(2)}. Isto aponta um retorno esperado inferior a taxa K escolhida.`
                    }
                  </p>
                </div>
                {stockData && (
                  <PriceAlertButton 
                    ticker={stockData.ticker} 
                    suggestedTargetPrice={precoTeto} 
                    currentPrice={stockData.price} 
                    alertLabel="Preço Teto Gordon (D1/(K-G))"
                  />
                )}
              </div>

              {/* Chart of Sensitivity */}
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider text-slate-400">
                  Sensibilidade do Preço ao Crescimento (G)
                </h3>
                <div className="h-64 sm:h-72 w-full bg-slate-50 dark:bg-slate-800/10 p-2 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGordon" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                        labelFormatter={(label) => `Crescimento perpétuo: ${label}`}
                      />
                      <Area type="monotone" dataKey="Preço Estimado" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGordon)" name="Preço de Gordon" />
                      <ReferenceLine y={currentPrice} stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: 'Preço de Mercado', fill: '#f43f5e', fontSize: 10, position: 'top' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-slate-400 text-center">O gráfico mostra o quanto o preço teto de Gordon é sensível ao crescimento perpétuo (G) estimado. À medida que G se aproxima de K ({discountRate}%), o valor intrínseco tende ao infinito.</p>
              </div>

              {/* Philosophy Card */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-3.5">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-500" /> Detalhes da Fórmula de Gordon (Myron J. Gordon)
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-2.5">
                  <p>
                    <strong>Fundamento do Modelo:</strong> O Gordon Growth Model (ou Modelo de Crescimento de Gordon) assume que o valor justo de uma ação corresponde ao valor presente de todos os seus dividendos futuros, que crescerão perpetuamente a uma taxa constante (G) e serão descontados pela taxa exigida de retorno (K).
                  </p>
                  <p>
                    <strong>Limitações do Modelo:</strong> O modelo assume crescimento constante em caráter perpétuo, o que funciona melhor em empresas maduras, consolidadas e com fluxos de caixa altamente previsíveis (como concessionárias de energia elétrica, saneamento e seguros). Além disso, não deve ser aplicado em empresas que não distribuem dividendos frequentes.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
