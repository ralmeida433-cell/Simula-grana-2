cat << 'INNER_EOF' > src/components/shared/AssetComparisonChart.tsx
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot,
} from "recharts";
import { Search, X, Loader2, LineChart as LineChartIcon } from 'lucide-react';
import { searchStockData, StockData } from '../../services/stockService';
import { getCompanyLogo, isBrazilianTicker } from '../../services/logoService';

export interface CompareAsset {
  ticker: string;
  data: StockData | null;
  loading: boolean;
  error: boolean;
}

const CORES_ESCURO = {
  fundo: "#000000",
  card: "#000000",
  borda: "#16211C",
  verde: "#2FD79B",
  verdeEscuro: "#0A5741",
  texto: "#E8F5EE",
  textoSuave: "#7C8F87",
  trilha: "rgba(255,255,255,.03)",
  inputBg: "rgba(255,255,255,.02)",
  overlay: "rgba(255,255,255,.06)",
  painelBg: "rgba(0,0,0,.97)",
  corSobrePilula: "#04140D",
  corNucleoPonto: "#FFFFFF",
  sombraPainel: "0 12px 32px rgba(0,0,0,.55)",
  sombraPainelForte: "0 14px 34px rgba(0,0,0,.55)",
};

const CORES_CLARO = {
  fundo: "#F8FAFC",
  card: "#FFFFFF",
  borda: "#E2E8F0",
  verde: "#10B981",
  verdeEscuro: "#047857",
  texto: "#0F172A",
  textoSuave: "#64748B",
  trilha: "rgba(10,40,25,.045)",
  inputBg: "rgba(10,40,25,.03)",
  overlay: "rgba(10,40,25,.07)",
  painelBg: "rgba(255,255,255,.97)",
  corSobrePilula: "#FFFFFF",
  corNucleoPonto: "#0B1F17",
  sombraPainel: "0 12px 32px rgba(15,40,30,.14)",
  sombraPainelForte: "0 14px 34px rgba(15,40,30,.16)",
};

const PALETA_ATIVOS_ESCURO = ["#2FD79B", "#22C3C0", "#E8B342", "#4FA3F7", "#F0524D", "#B98CE8"];
const PALETA_ATIVOS_CLARO = ["#0E7A54", "#0E8E8A", "#B9791A", "#2E6FD1", "#D6362F", "#8558C4"];

const CATALOGO_ATIVOS = [
  { ticker: "ITUB4.SA", nome: "Itaú Unibanco" },
  { ticker: "PETR4.SA", nome: "Petrobras PN" },
  { ticker: "VALE3.SA", nome: "Vale" },
  { ticker: "BOVA11.SA", nome: "iShares Bovespa" },
  { ticker: "IVVB11.SA", nome: "iShares S&P 500" },
  { ticker: "GARE11.SA", nome: "Guardian FII" },
  { ticker: "GOOG", nome: "Alphabet Inc." },
  { ticker: "AAPL", nome: "Apple Inc." },
  { ticker: "MSFT", nome: "Microsoft" },
  { ticker: "NVDA", nome: "Nvidia" },
  { ticker: "AMZN", nome: "Amazon" },
  { ticker: "WEGE3.SA", nome: "WEG S.A." },
  { ticker: "BBDC4.SA", nome: "Bradesco" },
  { ticker: "BBAS3.SA", nome: "Banco do Brasil" },
  { ticker: "SUZB3.SA", nome: "Suzano S.A." },
];

function useAppTheme() {
  const [theme, setTheme] = useState<'light'|'dark'|'deep-dark'>('dark');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document.documentElement.classList.contains('deep-dark')) {
        setTheme('deep-dark');
      } else if (document.documentElement.classList.contains('dark')) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    if (document.documentElement.classList.contains('deep-dark')) {
      setTheme('deep-dark');
    } else if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    } else {
      setTheme('light');
    }

    return () => observer.disconnect();
  }, []);

  return theme;
}

function useLarguraContainer() {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(360);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setLargura(entry.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, largura] as const;
}

const fmtEixo = (v: number) => (Number.isInteger(v) ? `${v}` : v.toFixed(1));
const fmtValor = (v: number) => v.toFixed(2);

function TooltipComparador({ active, payload, label, cores, mobile, tema }: any) {
  if (!active || !payload?.length) return null;
  const linhas = [...payload].sort((a, b) => b.value - a.value);
  return (
    <div style={{
      background: tema.painelBg,
      border: `1px solid ${tema.borda}`,
      borderRadius: 14,
      padding: mobile ? "10px 12px" : "12px 14px",
      minWidth: mobile ? 180 : 200,
      maxWidth: "80vw",
      backdropFilter: "blur(8px)",
      boxShadow: tema.sombraPainel,
    }}>
      <div style={{ color: tema.texto, fontWeight: 800, fontSize: 13, letterSpacing: 0.4, marginBottom: 4 }}>{label}</div>
      {linhas.map((l: any) => {
        if (l.dataKey === 'date' || l.dataKey === 'Retorno Real (%)' || l.dataKey === 'IPCA Acumulado (%)' || l.dataKey === 'price' || l.dataKey === 'rotulo') return null;
        const delta = l.value - 100;
        const cor = cores[l.dataKey] || tema.verde;
        return (
          <div key={l.dataKey} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: cor, boxShadow: `0 0 8px ${cor}`, flexShrink: 0 }} />
            <span style={{ color: tema.textoSuave, fontSize: 11, flex: 1, whiteSpace: "nowrap" }}>{l.dataKey}</span>
            <span style={{ color: tema.texto, fontSize: 12.5, fontWeight: 700 }}>{fmtValor(l.value)}</span>
            <span style={{
              fontSize: 9.5, fontWeight: 700, padding: "1px 5px", borderRadius: 5,
              color: delta >= 0 ? tema.verde : "#D6362F",
              background: delta >= 0 ? `${tema.verde}22` : "rgba(214,54,47,.12)",
              whiteSpace: "nowrap",
            }}>
              {delta >= 0 ? "▲" : "▼"}{Math.abs(delta).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface AssetComparisonChartProps {
  stockData: StockData | null;
  ipcaAnual: number;
}

export function AssetComparisonChart({ stockData, ipcaAnual }: AssetComparisonChartProps) {
  const [refContainer, largura] = useLarguraContainer();
  const bp = largura < 380 ? "xs" : largura < 640 ? "sm" : "md";
  const mobile = bp !== "md";

  const themeMode = useAppTheme();
  const temaAtual = themeMode === 'light' ? 'claro' : 'escuro';
  const CORES = temaAtual === "claro" ? CORES_CLARO : CORES_ESCURO;
  const paletaAtual = temaAtual === "claro" ? PALETA_ATIVOS_CLARO : PALETA_ATIVOS_ESCURO;

  const [compareList, setCompareList] = useState<CompareAsset[]>([]);
  const [saindo, setSaindo] = useState<Set<string>>(new Set());
  const [periodo, setPeriodo] = useState<'1y' | '5y' | '10y' | 'max'>('1y');
  const [descontarInflacao, setDescontarInflacao] = useState(false);
  const [destaque, setDestaque] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  
  const [busca, setBusca] = useState("");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [isCompareLoading, setIsCompareLoading] = useState(false);

  const ativosNoGrafico = useMemo(() => {
    const arr = [];
    if (stockData) arr.push(stockData.ticker);
    compareList.forEach(c => {
      if (!c.error && c.data) arr.push(c.ticker);
    });
    return arr;
  }, [stockData, compareList]);

  const cores = useMemo(() => {
    const mapa: Record<string, string> = {};
    ativosNoGrafico.forEach((t, i) => (mapa[t] = paletaAtual[i % paletaAtual.length]));
    return mapa;
  }, [ativosNoGrafico, paletaAtual]);

  const chartData = useMemo(() => {
    if (!stockData || !stockData.historicalPrices) return [];
    
    const monthsMap = {
      '1y': 12,
      '5y': 60,
      '10y': 120,
      'max': 999
    };
    
    const monthsToLookBack = monthsMap[periodo];
    const filteredPrices = periodo === 'max' 
       ? stockData.historicalPrices 
       : stockData.historicalPrices.slice(-Math.min(monthsToLookBack + 1, stockData.historicalPrices.length));
      
    if (filteredPrices.length === 0) return [];

    const firstPrice = filteredPrices[0]?.price || 1;
    
    const compareStarts: Record<string, number> = {};
    const validCompares = compareList.filter(c => c.data && c.data.historicalPrices && c.data.historicalPrices.length > 0);
    
    validCompares.forEach(c => {
      const match = c.data!.historicalPrices.find(p => p.date === filteredPrices[0].date);
      if (match) {
        compareStarts[c.ticker] = match.price;
      } else {
        const cLen = c.data!.historicalPrices.length;
        compareStarts[c.ticker] = c.data!.historicalPrices[Math.max(0, cLen - filteredPrices.length)]?.price || 1;
      }
    });

    const monthlyIpca = (Math.pow(1 + (ipcaAnual / 100), 1/12) - 1) * 100;

    return filteredPrices.map((item, index) => {
      const monthsElapsed = index;
      const currentIpcaCompounded = (Math.pow(1 + (monthlyIpca / 100), monthsElapsed) - 1) * 100;
      
      const nominalReturn = ((item.price - firstPrice) / firstPrice) * 100;
      const realReturn = (((1 + (nominalReturn / 100)) / (1 + (currentIpcaCompounded / 100))) - 1) * 100;
      const baseValue = descontarInflacao ? realReturn : nominalReturn;
      
      const res: any = {
        date: item.date,
        rotulo: item.date, // For XAxis
        [stockData.ticker]: Number((100 + baseValue).toFixed(2)),
      };

      validCompares.forEach(c => {
        const match = c.data!.historicalPrices.find(p => p.date === item.date);
        let cPrice = compareStarts[c.ticker];
        if (match) {
          cPrice = match.price;
        } else {
          const cLen = c.data!.historicalPrices.length;
          cPrice = c.data!.historicalPrices[Math.max(0, cLen - filteredPrices.length + index)]?.price || compareStarts[c.ticker];
        }
        const cNominalReturn = ((cPrice - compareStarts[c.ticker]) / compareStarts[c.ticker]) * 100;
        const cRealReturn = (((1 + (cNominalReturn / 100)) / (1 + (currentIpcaCompounded / 100))) - 1) * 100;
        res[c.ticker] = Number((100 + (descontarInflacao ? cRealReturn : cNominalReturn)).toFixed(2));
      });

      return res;
    });
  }, [stockData, ipcaAnual, periodo, compareList, descontarInflacao]);

  const hoverRow = hoverIndex != null ? chartData[hoverIndex] : null;

  const sugestoes = useMemo(() => {
    const q = busca.trim().toUpperCase();
    return CATALOGO_ATIVOS
      .filter((a) => !ativosNoGrafico.includes(a.ticker))
      .filter((a) => !q || a.ticker.includes(q) || a.nome.toUpperCase().includes(q))
      .slice(0, 6);
  }, [busca, ativosNoGrafico]);

  const adicionarAtivo = async (ticker: string) => {
    if (ativosNoGrafico.length >= 6 || ativosNoGrafico.includes(ticker)) return;
    setBusca("");
    setBuscaAberta(false);
    setIsCompareLoading(true);

    const newAsset: CompareAsset = {
      ticker,
      data: null,
      loading: true,
      error: false,
    };
    
    setCompareList(prev => [...prev, newAsset]);

    try {
      const data = await searchStockData(ticker);
      if (data) {
        setCompareList(prev => prev.map(c => c.ticker === ticker ? { ...c, data, loading: false } : c));
      } else {
        setCompareList(prev => prev.map(c => c.ticker === ticker ? { ...c, error: true, loading: false } : c));
      }
    } catch (e) {
      setCompareList(prev => prev.map(c => c.ticker === ticker ? { ...c, error: true, loading: false } : c));
    } finally {
      setIsCompareLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = busca.trim().toUpperCase();
      if (q && !ativosNoGrafico.includes(q) && ativosNoGrafico.length < 6) {
        // Formatar ticker para BR se não tiver sufixo e for 5-6 caracteres alfanuméricos
        let targetTicker = q;
        if (/^[A-Z0-9]{5,6}$/.test(q) && !q.includes('.SA') && !q.includes('=')) {
           targetTicker = `${q}.SA`;
        }
        adicionarAtivo(targetTicker);
      }
    }
  };

  const removerAtivo = useCallback((ticker: string) => {
    if (stockData && ticker === stockData.ticker) return; // Cant remove base asset
    setSaindo((s) => new Set(s).add(ticker));
    setTimeout(() => {
      setCompareList((a) => a.filter((t) => t.ticker !== ticker));
      setSaindo((s) => { const n = new Set(s); n.delete(ticker); return n; });
    }, 200);
  }, [stockData]);

  const idxPeriodo = ['1y', '5y', '10y', 'max'].indexOf(periodo);
  const cfg = {
    xs: { altura: 260, eixoEsq: 38, fonteEixo: 9, fonteRotulo: 9, margem: { top: 18, right: 6, left: 0, bottom: 0 } },
    sm: { altura: 300, eixoEsq: 42, fonteEixo: 10, fonteRotulo: 10, margem: { top: 20, right: 8, left: 0, bottom: 0 } },
    md: { altura: 380, eixoEsq: 48, fonteEixo: 11, fonteRotulo: 11, margem: { top: 22, right: 12, left: 4, bottom: 0 } },
  }[bp];

  if (!stockData) return null;

  return (
    <div
      ref={refContainer}
      style={{
        background: CORES.card, // removed gradient to fit app style
        border: `1px solid ${CORES.borda}`,
        borderRadius: 24,
        padding: mobile ? "16px 12px 14px" : "22px 20px 18px",
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        animation: "sg-entrada .5s ease both",
        transition: "background .35s ease, border-color .35s ease",
      }}
      className="shadow-sm"
    >
      <style>{`
        @keyframes sg-entrada { from { opacity:0; transform:translateY(8px);} to {opacity:1; transform:translateY(0);} }
        @keyframes sg-chip-in { from { opacity:0; transform:scale(.82);} to {opacity:1; transform:scale(1);} }
        @keyframes sg-marchar { to { stroke-dashoffset:-24; } }
        @keyframes sg-pulso { 0%,100% { box-shadow:0 0 0 0 rgba(47,215,155,.35);} 50% { box-shadow:0 0 0 6px rgba(47,215,155,0);} }
        .sg-chip { animation: sg-chip-in .28s cubic-bezier(.2,.8,.3,1.2) both; }
        .sg-chip-saindo { opacity:0; transform:scale(.8); transition: all .2s ease; }
        .sg-linha-base { animation: sg-marchar 1.4s linear infinite; }
        .sg-toggle-ativo { animation: sg-pulso 1.6s ease-out 1; }
        .sg-item-sugestao:active { background: rgba(47,215,155,.14) !important; }
      `}</style>

      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              background: `${CORES.verde}22`, border: `1px solid ${CORES.verde}55`,
            }}><LineChartIcon className="w-4 h-4" color={CORES.verde} /></span>
            <h2 style={{ margin: 0, color: CORES.texto, fontSize: "clamp(16px,4.5vw,20px)", fontWeight: 800, letterSpacing: -0.3 }}>
              Comparador de Ativos
            </h2>
          </div>
          {!mobile && (
            <p style={{ margin: "5px 0 0 34px", color: CORES.textoSuave, fontSize: 12.5 }}>
              Comparação interativa de performance (Base 100)
            </p>
          )}
        </div>

        {/* Controles: inflação + período */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => setDescontarInflacao((v) => !v)}
            className={descontarInflacao ? "sg-toggle-ativo" : ""}
            style={{
              minHeight: 34, padding: "0 14px", borderRadius: 999, cursor: "pointer",
              fontSize: 12, fontWeight: 700, letterSpacing: 0.2,
              border: `1px solid ${descontarInflacao ? CORES.verde + "88" : CORES.borda}`,
              background: descontarInflacao ? `${CORES.verde}22` : "transparent",
              color: descontarInflacao ? CORES.verde : CORES.textoSuave,
              transition: "all .25s ease", whiteSpace: "nowrap",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {descontarInflacao ? "✓ " : ""}Descontar Inflação
          </button>

          <div style={{
            position: "relative", display: "flex", background: CORES.trilha,
            border: `1px solid ${CORES.borda}`, borderRadius: 999, padding: 3, minHeight: 34,
          }}>
            <div style={{
              position: "absolute", top: 3, bottom: 3, left: 3,
              width: `calc(${100 / 4}% - 3px)`,
              transform: `translateX(${idxPeriodo * 100}%)`,
              background: CORES.verde, borderRadius: 999,
              transition: "transform .35s cubic-bezier(.2,.8,.2,1)",
              boxShadow: `0 0 10px ${CORES.verde}77`,
            }} />
            {(['1y', '5y', '10y', 'max'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                style={{
                  position: "relative", zIndex: 1, minWidth: 38, minHeight: 28,
                  border: "none", background: "transparent", cursor: "pointer",
                  fontSize: 11, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase",
                  color: periodo === p ? CORES.corSobrePilula : CORES.textoSuave,
                  transition: "color .25s ease", padding: "0 8px",
                  WebkitTapHighlightColor: "transparent",
                }}
              >{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Chips de ativos + busca */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        {ativosNoGrafico.map((t) => {
          const isBase = stockData && t === stockData.ticker;
          const loading = compareList.find(c => c.ticker === t)?.loading;
          const error = compareList.find(c => c.ticker === t)?.error;
          
          return (
            <div
              key={t}
              className={`sg-chip ${saindo.has(t) ? "sg-chip-saindo" : ""}`}
              onMouseEnter={() => setDestaque(t)}
              onMouseLeave={() => setDestaque(null)}
              onTouchStart={() => setDestaque(destaque === t ? null : t)}
              style={{
                display: "flex", alignItems: "center", gap: 7, minHeight: 34,
                padding: "0 8px 0 12px", borderRadius: 999, cursor: "pointer",
                background: destaque === t ? `${cores[t]}22` : CORES.trilha,
                border: `1px solid ${destaque === t ? cores[t] + "77" : CORES.borda}`,
                transition: "background .2s ease, border-color .2s ease",
              }}
            >
              {loading ? (
                <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
              ) : (
                <span style={{ width: 9, height: 9, borderRadius: 5, background: error ? CORES.textoSuave : cores[t], boxShadow: error ? 'none' : `0 0 8px ${cores[t]}`, flexShrink: 0 }} />
              )}
              <span style={{ color: error ? CORES.textoSuave : CORES.texto, fontSize: 12, fontWeight: 700, textDecoration: error ? 'line-through' : 'none' }}>{t}</span>
              {!isBase && (
                <button
                  onClick={(e) => { e.stopPropagation(); removerAtivo(t); }}
                  style={{
                    width: 20, height: 20, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: CORES.overlay, color: CORES.textoSuave,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    WebkitTapHighlightColor: "transparent",
                  }}
                ><X className="w-3 h-3" /></button>
              )}
            </div>
          );
        })}

        {/* Campo de busca / adicionar ativo */}
        <div style={{ position: "relative", flex: mobile ? "1 1 100%" : "0 0 auto" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7, minHeight: 34,
            padding: "0 12px", borderRadius: 999,
            border: `1px solid ${buscaAberta ? CORES.verde + "77" : CORES.borda}`,
            background: CORES.inputBg,
            transition: "border-color .2s ease",
          }}>
            <Search className="w-3.5 h-3.5" color={CORES.textoSuave} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onFocus={() => setBuscaAberta(true)}
              onBlur={() => setTimeout(() => setBuscaAberta(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder={ativosNoGrafico.length >= 6 ? "Limite de 6 ativos" : "Adicionar ativo"}
              disabled={ativosNoGrafico.length >= 6 || isCompareLoading}
              style={{
                background: "transparent", border: "none", outline: "none",
                color: CORES.texto, fontSize: 12, fontWeight: 600, width: mobile ? "100%" : 130,
                textTransform: "uppercase"
              }}
            />
            {isCompareLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 ml-1" />}
          </div>

          {buscaAberta && sugestoes.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: mobile ? 0 : "auto",
              width: mobile ? "100%" : 260, zIndex: 20,
              background: CORES.painelBg, border: `1px solid ${CORES.borda}`,
              borderRadius: 14, overflow: "hidden", backdropFilter: "blur(10px)",
              boxShadow: CORES.sombraPainelForte,
            }}>
              {sugestoes.map((a) => {
                const isB3 = isBrazilianTicker(a.ticker);
                const logo = isB3 ? `https://icons.brapi.dev/icons/${a.ticker.replace('.SA', '')}.svg` : `https://s3-symbol-logo.tradingview.com/${a.ticker.toLowerCase()}--big.svg`;
                return (
                  <div
                    key={a.ticker}
                    className="sg-item-sugestao flex items-center justify-between"
                    onMouseDown={(e) => { e.preventDefault(); adicionarAtivo(a.ticker); }}
                    style={{
                      padding: "8px 14px", minHeight: 44, cursor: "pointer",
                      borderBottom: `1px solid ${CORES.borda}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img src={logo} alt={a.ticker} className="w-6 h-6 rounded-full bg-white object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                      <div className="flex flex-col">
                        <span style={{ color: CORES.texto, fontSize: 12.5, fontWeight: 700 }}>{a.ticker}</span>
                        <span style={{ color: CORES.textoSuave, fontSize: 10 }}>{a.nome}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <div style={{ width: "100%", height: cfg.altura, touchAction: "pan-y" }}>
        <ResponsiveContainer>
          <ComposedChart
            data={chartData}
            margin={cfg.margem}
            onMouseMove={(s: any) => { if (s?.activeTooltipIndex != null) setHoverIndex(s.activeTooltipIndex); }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              {ativosNoGrafico.map((t) => {
                const id = t.replace(/[^a-zA-Z0-9]/g, "");
                return (
                  <React.Fragment key={t}>
                    <filter id={`sombra-${id}`} x="-30%" y="-60%" width="160%" height="240%">
                      <feDropShadow
                        dx="0" dy={mobile ? 2 : 3}
                        stdDeviation={destaque === t ? 3.2 : 1.8}
                        floodColor={cores[t]}
                        floodOpacity={destaque === t ? 0.55 : 0.28}
                      />
                    </filter>
                    <linearGradient id={`sombra-area-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cores[t]} stopOpacity={destaque === t ? 0.28 : 0.14} />
                      <stop offset="35%" stopColor={cores[t]} stopOpacity={destaque === t ? 0.1 : 0.05} />
                      <stop offset="100%" stopColor={cores[t]} stopOpacity={0} />
                    </linearGradient>
                  </React.Fragment>
                );
              })}
            </defs>

            <CartesianGrid stroke={CORES.borda} strokeDasharray="4 8" vertical={false} />

            <XAxis
              dataKey="rotulo"
              tick={{ fill: CORES.textoSuave, fontSize: cfg.fonteRotulo, fontWeight: 600 }}
              axisLine={{ stroke: CORES.borda }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={mobile ? 28 : 40}
              dy={6}
            />
            <YAxis
              tickFormatter={fmtEixo}
              tick={{ fill: CORES.textoSuave, fontSize: cfg.fonteEixo, fontWeight: 600 }}
              axisLine={false} tickLine={false}
              width={cfg.eixoEsq}
              domain={["auto", "auto"]}
            />

            <Tooltip
              content={<TooltipComparador cores={cores} mobile={mobile} tema={CORES} />}
              cursor={false}
              position={mobile ? { y: 0 } : undefined}
              allowEscapeViewBox={{ x: false, y: false }}
              wrapperStyle={{ zIndex: 10, outline: "none" }}
            />

            <ReferenceLine y={100} stroke={CORES.textoSuave} strokeOpacity={0.5} strokeDasharray="4 6" className="sg-linha-base" />

            {hoverRow && (
              <ReferenceLine x={hoverRow.rotulo} stroke={CORES.textoSuave} strokeOpacity={0.3} strokeDasharray="3 5" />
            )}
            {hoverRow && ativosNoGrafico.map((t) => (
              <ReferenceDot
                key={t}
                x={hoverRow.rotulo}
                y={hoverRow[t]}
                r={destaque === t ? 7 : 5.5}
                fill={CORES.corNucleoPonto}
                stroke={cores[t]}
                strokeWidth={3}
              />
            ))}

            {ativosNoGrafico.map((t, i) => (
              <Area
                key={`area-${t}`}
                dataKey={t}
                type="monotone"
                stroke="none"
                fill={`url(#sombra-area-${t.replace(/[^a-zA-Z0-9]/g, "")})`}
                fillOpacity={1}
                dot={false}
                activeDot={false}
                animationDuration={1100}
                animationBegin={i * 160}
                animationEasing="ease-out"
                isAnimationActive={true}
              />
            ))}

            {ativosNoGrafico.map((t, i) => (
              <Line
                key={t}
                dataKey={t}
                type="monotone"
                stroke={cores[t]}
                strokeWidth={destaque === t ? 3.2 : destaque ? 1.3 : 2.1}
                strokeOpacity={destaque && destaque !== t ? 0.28 : 0.92}
                dot={false}
                activeDot={false}
                filter={`url(#sombra-${t.replace(/[^a-zA-Z0-9]/g, "")})`}
                animationDuration={1100}
                animationBegin={i * 160}
                animationEasing="ease-out"
                isAnimationActive={true}
                style={{ transition: "stroke-width .2s ease, stroke-opacity .2s ease" }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ textAlign: "center", color: CORES.textoSuave, fontSize: 9.5, letterSpacing: 0.6, paddingTop: 8 }}>
        {mobile ? "Toque no gráfico para detalhes • Toque em um ativo para destacá-lo" : "Passe o mouse no gráfico para detalhes • Clique em um ativo para destacá-lo"}
      </div>
    </div>
  );
}
INNER_EOF
sh replace_chart.sh
