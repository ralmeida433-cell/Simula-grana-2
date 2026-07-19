import React, { useState, useEffect, useRef } from 'react';
import { Award, Info, Search, RefreshCw, HelpCircle, Loader2, Sparkles, TrendingUp, ShieldCheck, AlertCircle, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react';
import { searchStockData, StockData } from '../../services/stockService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { AssetPrice } from '../shared/AssetPrice';
import PriceAlertButton from '../shared/PriceAlertButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const InfoTooltip = ({ content }: { content: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative inline-flex items-center justify-center ml-1.5"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-amber-400 cursor-help transition-colors" />
      
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

export default function BuffettCalculator() {
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

  // Calculation Modes: 'simplified' (Infographic/ROE based) vs 'dcf' (Interactive DCF)
  const [calcMode, setCalcMode] = useState<'simplified' | 'dcf'>('simplified');

  // Parameters
  const [roe, setRoe] = useState<number>(15); // Return on Equity (%) for simplified mode
  const [eps, setEps] = useState<number>(3.50); // Earnings Per Share (LPA) for DCF
  const [growthRate5Y, setGrowthRate5Y] = useState<number>(10); // Growth Rate for first 5 years (%)
  const [growthRate10Y, setGrowthRate10Y] = useState<number>(6); // Growth Rate for years 6-10 (%)
  const [discountRate, setDiscountRate] = useState<number>(10); // Required rate of return (%)
  const [terminalGrowthRate, setTerminalGrowthRate] = useState<number>(3.5); // Perpetuity growth rate (%)
  const [marginOfSafety, setMarginOfSafety] = useState<number>(25); // Margin of safety (%)

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
        if (data.roe > 0) {
          setRoe(parseFloat((data.roe).toFixed(1))); // roe is in percent already
        }
        if (data.eps > 0) {
          setEps(parseFloat(data.eps.toFixed(2)));
        }
      } else {
        setError('Ativo não encontrado ou sem dados fundamentalistas.');
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

  let intrinsicValue = 0;
  let precoTeto = 0;
  let projectionData: any[] = [];

  if (calcMode === 'simplified') {
    // Buffett ROE-based target: Price * (1 + ROE/100) * (1 - Margin/100)
    intrinsicValue = currentPrice * (1 + roe / 100);
    precoTeto = intrinsicValue * (1 - marginOfSafety / 100);
  } else {
    // Full 10Y DCF projection
    let cashFlow = eps;
    let sumPresentValue = 0;

    for (let year = 1; year <= 10; year++) {
      const growth = year <= 5 ? growthRate5Y : growthRate10Y;
      cashFlow = cashFlow * (1 + growth / 100);
      const discountFactor = Math.pow(1 + discountRate / 100, year);
      const presentValue = cashFlow / discountFactor;
      sumPresentValue += presentValue;

      projectionData.push({
        name: `Ano ${year}`,
        'Lucro Projetado': parseFloat(cashFlow.toFixed(2)),
        'Valor Presente': parseFloat(presentValue.toFixed(2))
      });
    }

    // Perpetuity value at year 10
    const terminalValue = (cashFlow * (1 + terminalGrowthRate / 100)) / ((discountRate - terminalGrowthRate) / 100);
    const presentTerminalValue = terminalValue / Math.pow(1 + discountRate / 100, 10);
    
    intrinsicValue = sumPresentValue + presentTerminalValue;
    precoTeto = intrinsicValue * (1 - marginOfSafety / 100);
  }

  const isOpportunity = currentPrice < precoTeto;
  const marginPercentage = ((precoTeto - currentPrice) / currentPrice) * 100;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4 sm:space-y-8 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
      {/* Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-2 sm:p-3 bg-amber-100 rounded-lg sm:rounded-xl text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
          <Award className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h2 className="text-sm sm:text-xl font-bold text-foreground">Valuation Warren Buffett <span className="hidden sm:inline">(Modelo DCF & ROE)</span></h2>
          <p className="text-slate-500 text-[10px] sm:text-sm">Determine o valor intrínseco de empresas com a metodologia de Fluxo de Caixa Descontado e a rigidez de Margem de Segurança de Warren Buffett.</p>
        </div>
      </div>

      {/* Selector of Calculation Mode */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setCalcMode('simplified')}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
            calcMode === 'simplified' 
              ? "bg-white text-amber-700 shadow-sm dark:bg-slate-700 dark:text-amber-400" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
          )}
        >
          Fórmula Baseada em ROE (Infográfico)
        </button>
        <button
          onClick={() => setCalcMode('dcf')}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
            calcMode === 'dcf' 
              ? "bg-white text-amber-700 shadow-sm dark:bg-slate-700 dark:text-amber-400" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
          )}
        >
          Fluxo de Caixa Descontado (DCF 10 Anos)
        </button>
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
            placeholder="Digite o ticker (ex: PETR4, WEGE3)"
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none uppercase text-xs sm:text-base dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
          className="px-4 py-2 sm:px-6 sm:py-2.5 bg-amber-600 text-white font-bold rounded-lg sm:rounded-xl hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-base cursor-pointer"
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

      {/* Setup Panel and Output */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Controls Column */}
        <div className="md:col-span-4 space-y-4 sm:space-y-6 bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <Sparkles className="w-4 h-4 text-amber-500" /> Parâmetros de Valuation
          </h3>

          <div className="space-y-4">
            {/* Margin of Safety (applies to both modes) */}
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1 text-foreground">
                <span className="flex items-center gap-1">
                  Margem de Segurança
                  <InfoTooltip content="Desconto exigido para reduzir o risco operacional e macroeconômico. Buffett costuma usar 25% a 30%." />
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{marginOfSafety}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                value={marginOfSafety}
                onChange={(e) => setMarginOfSafety(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>10%</span>
                <span>40%</span>
              </div>
            </div>

            {calcMode === 'simplified' ? (
              /* Simplified ROE Model Parameters */
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1 text-foreground">
                  <span className="flex items-center gap-1">
                    ROE Esperado (Retorno Líquido)
                    <InfoTooltip content="Retorno sobre o patrimônio líquido da empresa. Buffett busca empresas que geram alto ROE de forma sustentável (geralmente acima de 15%)." />
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{roe}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={roe}
                  onChange={(e) => setRoe(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>5% (Médio)</span>
                  <span>40% (Excepcional)</span>
                </div>
              </div>
            ) : (
              /* DCF Model Parameters */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                    Lucro por Ação Atual (LPA / EPS)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={eps}
                    onChange={(e) => setEps(parseFloat(e.target.value) || 0)}
                    className="block w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-amber-500 text-xs sm:text-sm dark:bg-slate-850 dark:border-slate-700 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1 text-foreground">
                    <span>Crescimento (Anos 1 a 5)</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{growthRate5Y}%</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={growthRate5Y}
                    onChange={(e) => setGrowthRate5Y(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1 text-foreground">
                    <span>Crescimento (Anos 6 a 10)</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{growthRate10Y}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={growthRate10Y}
                    onChange={(e) => setGrowthRate10Y(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1 text-foreground">
                    <span>Taxa de Desconto (WACC)</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{discountRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="18"
                    step="0.5"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1 text-foreground">
                    <span>Crescimento Perpétuo</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{terminalGrowthRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={Math.min(discountRate - 0.5, 6)}
                    step="0.1"
                    value={terminalGrowthRate}
                    onChange={(e) => setTerminalGrowthRate(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>
              </div>
            )}
          </div>

          {stockData && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Resumo Financeiro</div>
              <div className="flex items-center gap-3">
                {stockData.logourl ? (
                  <img src={stockData.logourl} alt={stockData.name} className="w-8 h-8 rounded-xl object-contain bg-white p-1 border border-slate-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 font-bold text-center flex items-center justify-center text-xs">
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
                  <div className="text-[10px] text-slate-400">ROE Real %</div>
                  <div className="font-mono font-bold text-xs text-foreground">{(stockData.roe).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="md:col-span-8 space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Price */}
            <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Preço de Cotação</span>
                <span className="text-xs text-slate-400 font-normal">Preço atual do mercado</span>
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-foreground">R$ {currentPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Intrinsic Value */}
            <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">Valor Intrínseco</span>
                <span className="text-xs text-slate-400 font-normal">{calcMode === 'simplified' ? 'Potencial com base em ROE' : 'Soma dos fluxos descontados'}</span>
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">R$ {intrinsicValue.toFixed(2)}</span>
              </div>
            </div>

            {/* Buffett Target Price */}
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
                )}>Preço Teto Buffett</span>
                <span className="text-xs text-slate-400 font-normal">Margem de {marginOfSafety}% aplicada</span>
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
                {isOpportunity ? 'Análise: Excelente margem de segurança!' : 'Análise: Ativo caro sob ótica de Buffett'}
              </div>
              <p className="text-xs opacity-90 leading-relaxed max-w-xl">
                {isOpportunity 
                  ? `O preço de mercado atual (R$ ${currentPrice.toFixed(2)}) confere um desconto real de ${Math.abs(marginPercentage).toFixed(1)}% em relação ao Preço Teto Buffett (R$ ${precoTeto.toFixed(2)}). Alinhado ao mandamento de Buffett: comprar ativos de qualidade abaixo do preço justo.`
                  : `O preço de mercado de R$ ${currentPrice.toFixed(2)} está acima do teto com desconto de R$ ${precoTeto.toFixed(2)}. Isto limita severamente sua margem de segurança e indica potencial precificação de otimismo exagerado.`
                }
              </p>
            </div>
            {stockData && (
              <PriceAlertButton 
                ticker={stockData.ticker} 
                suggestedTargetPrice={precoTeto} 
                currentPrice={stockData.price} 
                alertLabel="Preço Teto Warren Buffett"
              />
            )}
          </div>

          {/* Chart Section for DCF */}
          {calcMode === 'dcf' && projectionData.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider text-slate-400">
                Projeção do Fluxo de Caixa / LPA (Anos 1 a 10)
              </h3>
              <div className="h-64 sm:h-72 w-full bg-slate-50 dark:bg-slate-800/10 p-2 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="top" height={36} fontSize={11} />
                    <Bar dataKey="Lucro Projetado" name="Lucro Futuro Projetado" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Valor Presente" name="Valor Presente Descontado" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-400 text-center">O gráfico compara o lucro projetado ajustado pelas taxas de crescimento (laranja) versus seu valor descontado hoje à taxa de {discountRate}% (verde).</p>
            </div>
          )}

          {/* Philosophy Card */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-3.5">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-500" /> Filosofia de Valor de Warren Buffett
            </h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-2.5">
              <p>
                <strong>Owner Earnings:</strong> Warren Buffett baseia suas aquisições no Fluxo de Caixa livre descontado para o acionista. Ele define como lucro verdadeiro o lucro líquido somado à depreciação/amortização, deduzido o capex necessário para manter a competitividade operacional.
              </p>
              <p>
                <strong>Vantagem Competitiva (Moat):</strong> O modelo assume que a empresa crescerá seus lucros por muitos anos. No entanto, isto só é possível se a empresa possuir fortes barreiras de entrada (Moat), como marcas consagradas, patentes, ou escala imbatível, protegendo os retornos sobre capital investido (ROE/ROIC).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
