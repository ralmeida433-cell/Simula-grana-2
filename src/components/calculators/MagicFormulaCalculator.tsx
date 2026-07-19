import React, { useState, useEffect, useRef } from 'react';
import { Wand2, Info, Search, RefreshCw, HelpCircle, Loader2, Sparkles, TrendingUp, ShieldCheck, AlertCircle, BarChart3, Star, CheckCircle } from 'lucide-react';
import { searchStockData, StockData } from '../../services/stockService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { AssetPrice } from '../shared/AssetPrice';
import PriceAlertButton from '../shared/PriceAlertButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

const InfoTooltip = ({ content }: { content: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative inline-flex items-center justify-center ml-1.5"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help transition-colors" />
      
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

export default function MagicFormulaCalculator() {
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

  // Magic Formula Calculations Mode: 'simplified' (Infographic based pricing) vs 'diagnostic' (Metric analysis)
  const [calcMode, setCalcMode] = useState<'simplified' | 'diagnostic'>('simplified');

  // Input States
  const [roic, setRoic] = useState<number>(18); // Return on Invested Capital (%)
  const [earningsYield, setEarningsYield] = useState<number>(12); // EBIT / EV (%)
  const [ebit, setEbit] = useState<number>(2500); // R$ Milhões (for custom diagnostic calculations)
  const [enterpriseValue, setEnterpriseValue] = useState<number>(20000); // R$ Milhões

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
        // Map actual fundamental values
        if (data.roe > 0) {
          setRoic(parseFloat((data.roe * 0.9).toFixed(1))); // Conservatively estimating ROIC from ROE if not directly cached
        }
        
        // Calculate estimated EBIT & EV
        // EBIT can be estimated from EBITDA or Margins
        const estEbitda = data.ebitda || (data.price * data.sharesOutstanding * (data.netMargin / 100) * 1.3);
        const estEv = (data.price * data.sharesOutstanding) + data.netDebt;
        
        if (estEbitda > 0 && estEv > 0) {
          setEbit(parseFloat((estEbitda * 0.85 / 1000000).toFixed(1))); // in Millions
          setEnterpriseValue(parseFloat((estEv / 1000000).toFixed(1))); // in Millions
          
          const estYield = ((estEbitda * 0.85) / estEv) * 100;
          setEarningsYield(parseFloat(estYield.toFixed(1)));
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
  
  // Preço Justo Estimado conforme Infográfico de Magic Formula
  // Formula: Preço Atual * (1 + (ROIC - 10) / 100) * 1.05
  const estimatedPrecoTeto = currentPrice * (1 + (roic - 10) / 100) * 1.05;

  // Calculo de Earnings Yield real baseado nos sliders de EBIT e EV
  const computedEarningsYield = enterpriseValue > 0 ? (ebit / enterpriseValue) * 100 : 0;
  
  // Determinação de atratividade
  // Greenblatt procura empresas com alto ROIC (lucro gerado por capital investido) e alto Earnings Yield (preço barato)
  const isRoicGood = roic >= 15;
  const isYieldGood = (calcMode === 'simplified' ? earningsYield : computedEarningsYield) >= 10;
  
  // Score de atratividade final (0 a 100)
  const actualYield = calcMode === 'simplified' ? earningsYield : computedEarningsYield;
  const attrScore = Math.min(100, Math.max(0, Math.round((roic / 25) * 50 + (actualYield / 15) * 50)));

  let diagnosticRating = 'Neutro';
  let ratingColor = 'text-amber-500';
  let ratingBg = 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/50';

  if (roic >= 20 && actualYield >= 12) {
    diagnosticRating = 'Super Oportunidade (Fórmula Mágica)';
    ratingColor = 'text-emerald-500';
    ratingBg = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50';
  } else if (roic >= 15 && actualYield >= 8) {
    diagnosticRating = 'Altamente Atrativo';
    ratingColor = 'text-emerald-500';
    ratingBg = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 animate-pulse';
  } else if (roic < 10 || actualYield < 6) {
    diagnosticRating = 'Evitar (Abaixo do Limite Greenblatt)';
    ratingColor = 'text-rose-500';
    ratingBg = 'bg-rose-50 dark:bg-rose-950/20 border-rose-200/50';
  }

  const isOpportunity = currentPrice < estimatedPrecoTeto;
  const marginPercentage = ((estimatedPrecoTeto - currentPrice) / currentPrice) * 100;

  // Chart Data showing comparison with threshold values
  const thresholdData = [
    {
      name: 'Retorno s/ Capital (ROIC)',
      Ativo: parseFloat(roic.toFixed(1)),
      Mínimo: 15,
    },
    {
      name: 'Earnings Yield (EBIT/EV)',
      Ativo: parseFloat(actualYield.toFixed(1)),
      Mínimo: 10,
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4 sm:space-y-8 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
      {/* Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-2 sm:p-3 bg-cyan-100 rounded-lg sm:rounded-xl text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400">
          <Wand2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h2 className="text-sm sm:text-xl font-bold text-foreground">Magic Formula Greenblatt <span className="hidden sm:inline">(Fórmula Mágica de Ações)</span></h2>
          <p className="text-slate-500 text-[10px] sm:text-sm">Desenvolvida por Joel Greenblatt, identifica empresas baratas (alto Earnings Yield) e extremamente eficientes (alto ROIC).</p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setCalcMode('simplified')}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
            calcMode === 'simplified' 
              ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-700 dark:text-cyan-400" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
          )}
        >
          Preço Teto Estimado (Infográfico)
        </button>
        <button
          onClick={() => setCalcMode('diagnostic')}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
            calcMode === 'diagnostic' 
              ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-700 dark:text-cyan-400" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
          )}
        >
          Diagnóstico EBIT & Valor de Firma (EV)
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
            placeholder="Digite o ticker (ex: PETR4, VALE3)"
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none uppercase text-xs sm:text-base dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
          className="px-4 py-2 sm:px-6 sm:py-2.5 bg-cyan-600 text-white font-bold rounded-lg sm:rounded-xl hover:bg-cyan-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-base cursor-pointer"
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

      {/* Main Form and Output */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Parameters input column */}
        <div className="md:col-span-4 space-y-4 sm:space-y-6 bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <Sparkles className="w-4 h-4 text-cyan-500" /> Parâmetros Mágicos
          </h3>

          <div className="space-y-4">
            {/* ROIC (all modes) */}
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1 text-foreground">
                <span className="flex items-center gap-1">
                  Retorno s/ Capital (ROIC)
                  <InfoTooltip content="Mede a capacidade de uma empresa gerar lucros a partir do capital investido na sua operação. Greenblatt busca acima de 15%." />
                </span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{roic}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="0.5"
                value={roic}
                onChange={(e) => setRoic(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>5% (Baixo)</span>
                <span>50% (Excepcional)</span>
              </div>
            </div>

            {calcMode === 'simplified' ? (
              /* Simplified Mode inputs */
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1 text-foreground">
                  <span className="flex items-center gap-1">
                    Earnings Yield (EBIT/EV)
                    <InfoTooltip content="Calcula o rendimento operacional da empresa em relação ao seu valor total. Quanto maior, mais barata é a ação. Alvo: superior a 10%." />
                  </span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{earningsYield}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  step="0.5"
                  value={earningsYield}
                  onChange={(e) => setEarningsYield(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>2% (Caro)</span>
                  <span>30% (Extremamente Barato)</span>
                </div>
              </div>
            ) : (
              /* Diagnostic Mode inputs */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                    EBIT Operacional (R$ Milhões)
                  </label>
                  <input
                    type="number"
                    value={ebit}
                    onChange={(e) => setEbit(parseFloat(e.target.value) || 0)}
                    className="block w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-cyan-500 text-xs sm:text-sm dark:bg-slate-850 dark:border-slate-700 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                    Valor de Firma (EV) (R$ Milhões)
                  </label>
                  <input
                    type="number"
                    value={enterpriseValue}
                    onChange={(e) => setEnterpriseValue(parseFloat(e.target.value) || 0)}
                    className="block w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-cyan-500 text-xs sm:text-sm dark:bg-slate-850 dark:border-slate-700 dark:text-white font-mono"
                  />
                </div>

                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-1">
                  <div className="text-[10px] text-slate-400">Yield de Lucro Calculado</div>
                  <div className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">
                    {computedEarningsYield.toFixed(2)}%
                  </div>
                </div>
              </div>
            )}
          </div>

          {stockData && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Ativo Selecionado</div>
              <div className="flex items-center gap-3">
                {stockData.logourl ? (
                  <img src={stockData.logourl} alt={stockData.name} className="w-8 h-8 rounded-xl object-contain bg-white p-1 border border-slate-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 font-bold text-center flex items-center justify-center text-xs">
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
                  <div className="text-[10px] text-slate-400">P/VP Real</div>
                  <div className="font-mono font-bold text-xs text-foreground">{stockData.pvp.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results column */}
        <div className="md:col-span-8 space-y-6 sm:space-y-8">
          {calcMode === 'simplified' ? (
            /* Card Grid for Valuation Results */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current Price */}
              <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Preço de Mercado</span>
                  <span className="text-xs text-slate-400 font-normal">Preço atual do ativo</span>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-foreground">R$ {currentPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Threshold indicator score */}
              <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-cyan-500 uppercase tracking-wider block">Score de Atratividade</span>
                  <span className="text-xs text-slate-400 font-normal">ROIC & Yield combinados</span>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400">{attrScore}/100</span>
                </div>
              </div>

              {/* Price target card */}
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
                  )}>Preço Teto Mágico</span>
                  <span className="text-xs text-slate-400 font-normal">Valor de Formula Mágica</span>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black">R$ {estimatedPrecoTeto.toFixed(2)}</span>
                  <span className={cn(
                    "text-xs font-mono font-bold px-1.5 py-0.5 rounded",
                    isOpportunity ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                  )}>
                    {isOpportunity ? 'ABAIXO' : 'ACIMA'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Diagnostic metrics results */
            <div className={cn("p-5 border rounded-2xl text-xs sm:text-sm space-y-3", ratingBg)}>
              <div className="font-bold flex items-center gap-2 text-sm sm:text-base">
                <Star className="w-5 h-5 fill-current text-cyan-500" />
                Diagnóstico Greenblatt: <span className={ratingColor}>{diagnosticRating}</span>
              </div>
              <p className="opacity-90 leading-relaxed">
                Retorno sobre Capital Investido (ROIC) de <strong>{roic}%</strong> combinada com um Yield de Lucro operacional (Earnings Yield) de <strong>{computedEarningsYield.toFixed(1)}%</strong>. 
                {roic >= 15 && computedEarningsYield >= 10 
                  ? ' Preenche perfeitamente os requisitos da Fórmula Mágica, apresentando uma excelente relação entre lucratividade de capital e preço atrativo.'
                  : ' Não preenche todos os critérios estritos de Greenblatt. Verifique se o ROIC ou o Yield estão penalizados por problemas de rentabilidade ou sobrevalorização.'
                }
              </p>
            </div>
          )}

          {/* Action alert banner (for simplified pricing) */}
          {calcMode === 'simplified' && (
            <div className={cn(
              "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5",
              isOpportunity 
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 text-emerald-800 dark:text-emerald-300" 
                : "bg-rose-50 dark:bg-rose-950/20 border-rose-200/50 text-rose-800 dark:text-rose-300"
            )}>
              <div className="space-y-1">
                <div className="font-bold text-sm sm:text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {isOpportunity ? 'Análise: Ativo com excelente eficiência operacional' : 'Análise: Ativo sobreprecificado ou ineficiente'}
                </div>
                <p className="text-xs opacity-90 leading-relaxed max-w-xl">
                  {isOpportunity 
                    ? `O preço de mercado atual (R$ ${currentPrice.toFixed(2)}) é inferior ao Preço Teto de Formula Mágica (R$ ${estimatedPrecoTeto.toFixed(2)}). Com margem implícita de ${Math.abs(marginPercentage).toFixed(1)}% sob a ótica de geração de valor operacional.`
                    : `O preço de mercado atual (R$ ${currentPrice.toFixed(2)}) está acima do teto calculado de R$ ${estimatedPrecoTeto.toFixed(2)}. Isto aponta uma margem limitada ou uma eficiência de capital insatisfatória para as premissas.`
                  }
                </p>
              </div>
              {stockData && (
                <PriceAlertButton 
                  ticker={stockData.ticker} 
                  suggestedTargetPrice={estimatedPrecoTeto} 
                  currentPrice={stockData.price} 
                  alertLabel="Preço Teto Magic Formula Greenblatt"
                />
              )}
            </div>
          )}

          {/* Charts Comparing values with Threshold */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider text-slate-400">
              Métricas vs Filtro de Qualidade Greenblatt
            </h3>
            <div className="h-64 sm:h-72 w-full bg-slate-50 dark:bg-slate-800/10 p-2 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={thresholdData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="top" height={36} fontSize={11} />
                  <Bar dataKey="Ativo" name="Ativo Selecionado" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Mínimo" name="Limiar Greenblatt" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 text-center">Filtro de Greenblatt recomenda empresas com Retorno s/ Capital Investido (ROIC) superior a 15% e Earnings Yield operacional superior a 10%.</p>
          </div>

          {/* Guidelines wisdom */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-3.5">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-500" /> Como Funciona a Magic Formula de Joel Greenblatt?
            </h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-2.5">
              <p>
                <strong>A Essência da Fórmula:</strong> Em seu livro <i>"The Little Book that Beats the Market"</i>, Joel Greenblatt detalhou uma estratégia sistemática quantitativa. Ele classifica todo o universo de ações de acordo com dois eixos complementares:
              </p>
              <ul className="list-disc pl-5 space-y-1 border-l-2 border-cyan-500/30">
                <li><strong>Eficiência de Capital (ROIC):</strong> Quanto maior o ROIC, maior a capacidade da gestão de reinvestir com altos retornos.</li>
                <li><strong>Atratividade de Preço (Earnings Yield):</strong> Medido por `EBIT / Enterprise Value` (onde o EV soma valor de mercado e dívida líquida), mostra quanto lucro operacional a empresa gera por real gasto para comprar a firma inteira.</li>
              </ul>
              <p>
                <strong>Estratégia de Carteira:</strong> Greenblatt recomenda comprar as 20 ou 30 melhores empresas classificadas pela soma destes dois rankings e manter as posições por exatamente um ano.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
