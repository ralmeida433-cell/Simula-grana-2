import React, { useState, useEffect, useRef } from 'react';
import { Activity, Info, Search, RefreshCw, DollarSign, HelpCircle, Loader2, TrendingUp, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { searchStockData, StockData } from '../../services/stockService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { AssetPrice } from '../shared/AssetPrice';
import PriceAlertButton from '../shared/PriceAlertButton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const InfoTooltip = ({ content }: { content: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative inline-flex items-center justify-center ml-1.5"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-indigo-400 cursor-help transition-colors" />
      
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

export default function SorosCalculator() {
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

  // George Soros Specific Parameters
  const [reflexivityPremium, setReflexivityPremium] = useState<number>(30); // % de prêmio por viés cognitivo/reflexividade do mercado
  const [marginOfSafety, setMarginOfSafety] = useState<number>(30); // % de margem de segurança do George Soros

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
      } else {
        setError('Ativo não encontrado ou sem dados de cotação.');
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

  // Soros Calculations
  const currentPrice = stockData ? stockData.price : 40.90; // Default or fetched price
  
  // O Preço Justo de Reflexividade é inflacionado pelo viés positivo do mercado (conforme teoria de Soros)
  const reflexivePrice = currentPrice * (1 + reflexivityPremium / 100);
  
  // O Preço Teto com margem aplica a margem de segurança (desconto) de Soros para mitigar o risco do boom-bust
  const precoTeto = reflexivePrice * (1 - marginOfSafety / 100);
  
  const discountPremium = ((precoTeto - currentPrice) / currentPrice) * 100;
  const isOpportunity = currentPrice < precoTeto;

  // Chart Data showing different reflexivity scenarios
  const chartData = Array.from({ length: 11 }).map((_, i) => {
    const premium = i * 10; // 0% to 100%
    const scenarioReflexive = currentPrice * (1 + premium / 100);
    const scenarioTeto = scenarioReflexive * (1 - marginOfSafety / 100);
    return {
      name: `${premium}%`,
      Reflexividade: premium,
      'Preço Estimado': parseFloat(scenarioReflexive.toFixed(2)),
      'Preço Teto': parseFloat(scenarioTeto.toFixed(2)),
      'Preço Atual': parseFloat(currentPrice.toFixed(2)),
    };
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4 sm:space-y-8 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
      {/* Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg sm:rounded-xl text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
          <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h2 className="text-sm sm:text-xl font-bold text-foreground">Método George Soros <span className="hidden sm:inline">(Teoria da Reflexividade)</span></h2>
          <p className="text-slate-500 text-[10px] sm:text-sm">Calcule o preço justo considerando as distorções cognitivas e o prêmio de reflexividade de mercado.</p>
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
            placeholder="Digite o ticker (ex: PETR4, AAPL)"
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-xs sm:text-base dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
          className="px-4 py-2 sm:px-6 sm:py-2.5 bg-indigo-600 text-white font-bold rounded-lg sm:rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-base cursor-pointer"
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

      {/* Main Stats and Setup */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Controls Panel */}
        <div className="md:col-span-4 space-y-4 sm:space-y-6 bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Parâmetros de Soros
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1.5 text-foreground">
                <span className="flex items-center gap-1.5">
                  Prêmio Reflexividade
                  <InfoTooltip content="Mede a intensidade do viés cognitivo do mercado que amplia os fundamentos. Um prêmio maior reflete uma fase de expansão ou Boom." />
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{reflexivityPremium}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={reflexivityPremium}
                onChange={(e) => setReflexivityPremium(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0% (Neutro)</span>
                <span>100% (Bolha)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1.5 text-foreground">
                <span className="flex items-center gap-1.5">
                  Margem de Segurança
                  <InfoTooltip content="Desconto prudencial aplicado para amortecer as oscilações violentas do mercado que ocorrem após a reversão de tendência (Bust)." />
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{marginOfSafety}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={marginOfSafety}
                onChange={(e) => setMarginOfSafety(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>10% (Alta Confiança)</span>
                <span>50% (Ultra Conservador)</span>
              </div>
            </div>
          </div>

          {stockData && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Ativo Selecionado</div>
              <div className="flex items-center gap-3">
                {stockData.logourl ? (
                  <img src={stockData.logourl} alt={stockData.name} className="w-8 h-8 rounded-xl object-contain bg-white p-1 border border-slate-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold text-center flex items-center justify-center text-xs">
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
                  <div className="text-[10px] text-slate-400">Preço Atual</div>
                  <div className="font-mono font-bold text-sm text-foreground">R$ {stockData.price.toFixed(2)}</div>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400">P/L Histórico</div>
                  <div className="font-mono font-bold text-sm text-foreground">{stockData.peRatio ? stockData.peRatio.toFixed(1) : 'N/A'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="md:col-span-8 space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Price Card */}
            <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Preço de Cotação</span>
                <span className="text-xs text-slate-400 font-normal">Valor atual no mercado</span>
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-foreground">R$ {currentPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Reflexive Fair Price */}
            <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider block">Preço de Reflexividade</span>
                <span className="text-xs text-slate-400 font-normal">Preço justo ajustado ao viés</span>
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">R$ {reflexivePrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Soros Ceiling Price */}
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
                )}>Preço Teto Soros</span>
                <span className="text-xs text-slate-400 font-normal">Preço máximo com Margem</span>
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
                <Shield className="w-4 h-4 shrink-0" />
                {isOpportunity ? 'Análise: Oportunidade com Margem!' : 'Análise: Ativo sobreprecificado!'}
              </div>
              <p className="text-xs opacity-90 leading-relaxed max-w-xl">
                {isOpportunity 
                  ? `O preço atual de R$ ${currentPrice.toFixed(2)} está com desconto de ${Math.abs(discountPremium).toFixed(1)}% em relação ao Preço Teto Soros de R$ ${precoTeto.toFixed(2)}. Isto aponta uma potencial assimetria de retorno favorável.`
                  : `O preço atual de R$ ${currentPrice.toFixed(2)} está ${Math.abs(discountPremium).toFixed(1)}% acima do Preço Teto Soros de R$ ${precoTeto.toFixed(2)}. Conforme a teoria do Boom-Bust, o risco de correção de mercado supera o prêmio atual.`
                }
              </p>
            </div>
            {stockData && (
              <PriceAlertButton 
                ticker={stockData.ticker} 
                suggestedTargetPrice={precoTeto} 
                currentPrice={stockData.price} 
                alertLabel="Preço Teto George Soros"
              />
            )}
          </div>

          {/* Interactive Scenario Chart */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider text-slate-400">
              Assimetria Soros vs. Prêmios de Reflexividade
            </h3>
            <div className="h-64 sm:h-72 w-full bg-slate-50 dark:bg-slate-800/10 p-2 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReflexive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTeto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                    labelFormatter={(label) => `Prêmio Reflexivo: ${label}`}
                  />
                  <Area type="monotone" dataKey="Preço Estimado" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorReflexive)" />
                  <Area type="monotone" dataKey="Preço Teto" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTeto)" />
                  <ReferenceLine y={currentPrice} stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Preço de Mercado', fill: '#f43f5e', fontSize: 10, position: 'top' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 text-center">Gráfico simula a evolução do Preço Justo e Preço Teto conforme o mercado aumenta o viés de reflexividade de 0% (Equilíbrio) até 100% (Euforia Extrema).</p>
          </div>

          {/* Theory and Guidelines Card */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-3.5">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" /> Filosofia de Investimento de George Soros
            </h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-2.5">
              <p>
                <strong>O Conceito de Reflexividade:</strong> George Soros postula que o comportamento dos participantes do mercado não é puramente passivo. As opiniões dos investidores afetam os preços e os próprios fundamentos da empresa. Isto cria ciclos de feedback de <strong>Boom-Bust</strong> (Expansão e Colapso).
              </p>
              <p>
                <strong>Diferença de outros métodos:</strong> Enquanto Graham assume que os mercados oscilam de forma eficiente ao redor do valor intrínseco, Soros defende que a própria busca do preço cria realidades artificiais temporárias. Logo, ao identificar o prêmio que a euforia ou depressão do mercado coloca no papel, você pode antecipar pontos de inflexão aplicando uma margem rigorosa de segurança.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
