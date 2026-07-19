import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";
import { Info } from 'lucide-react';

/* ============================================================
   GRÁFICO LUCRO vs COTAÇÃO — SimulaGrana (v2 MOBILE-FIRST)
   ============================================================ */
const PALETTES = {
  'deep-dark': {
    fundo: "#000000",
    card: "#000000",
    borda: "#16211C",
    verde: "#2FD79B",
    verdeEscuro: "#0A5741",
    vermelho: "#F0524D",
    texto: "#E8F5EE",
    textoSuave: "#7C8F87",
  },
  'dark': {
    fundo: "#050807",
    card: "#0B120F",
    borda: "#16211C",
    verde: "#2FD79B",
    verdeEscuro: "#0A5741",
    vermelho: "#F0524D",
    texto: "#E8F5EE",
    textoSuave: "#7C8F87",
  },
  'light': {
    fundo: "#F8FAFC",
    card: "#FFFFFF",
    borda: "#E2E8F0",
    verde: "#10B981",
    verdeEscuro: "#047857",
    vermelho: "#EF4444",
    texto: "#0F172A",
    textoSuave: "#64748B",
  }
};

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

export interface HistoricalPrice {
  date: string;
  price: number;
}

export interface HistoricalProfit {
  year: string;
  profit: number;
  revenue: number;
  netIncome: number;
}

interface ProfitVsQuoteChartProps {
  ticker: string;
  historicalPrices: HistoricalPrice[];
  historicalProfits: HistoricalProfit[];
  currency?: string;
}

/* ---------- Hook: largura real do container ---------- */
function useLarguraContainer() {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(360);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) =>
      setLargura(entry.contentRect.width)
    );
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, largura] as const;
}

/* ---------- Formatadores ---------- */
const fmtBCheio = (v: number) => `$${v >= 100 ? v.toFixed(0) : v.toFixed(1)}B`;
const fmtBCompacto = (v: number) => `${v.toFixed(0)}B`;
const fmtUSCheio = (v: number) => `$${v.toFixed(0)}`;
const fmtUSCompacto = (v: number) => `${v.toFixed(0)}`;
const varPct = (atual: number, anterior: number) =>
  anterior ? (atual / anterior - 1) * 100 : null;

/* ---------- Tooltip ---------- */
function TooltipCustom({ active, payload, label, dados, mobile, currency, cores }: any) {
  if (!active || !payload?.length) return null;
  const idx = dados.findIndex((d: any) => d.ano === label);
  const atual = dados[idx];
  const anterior = dados[idx - 1];
  const dLucro = anterior ? varPct(atual.lucro, anterior.lucro) : null;
  const dCot = anterior ? varPct(atual.cotacao, anterior.cotacao) : null;

  const fmtCurrencyB = (v: number) => `${currency}${v >= 100 ? v.toFixed(0) : v.toFixed(1)}B`;
  const fmtCurrency = (v: number) => `${currency}${v.toFixed(0)}`;

  const Linha = ({ cor, nome, valor, delta }: any) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: cor, boxShadow: `0 0 8px ${cor}`, flexShrink: 0 }} />
      <span style={{ color: cores.textoSuave, fontSize: 11, flex: 1, whiteSpace: "nowrap" }}>{nome}</span>
      <span style={{ color: cores.texto, fontSize: mobile ? 12 : 13, fontWeight: 700 }}>{valor}</span>
      {delta !== null && (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6,
          color: delta >= 0 ? cores.verde : cores.vermelho,
          background: delta >= 0 ? `${cores.verde}22` : `${cores.vermelho}22`,
          whiteSpace: "nowrap",
        }}>
          {delta >= 0 ? "▲" : "▼"}{Math.abs(delta).toFixed(1)}%
        </span>
      )}
    </div>
  );

  return (
    <div style={{
      background: `${cores.card}F2`,
      border: `1px solid ${cores.borda}`,
      borderRadius: 14,
      padding: mobile ? "10px 12px" : "12px 14px",
      minWidth: mobile ? 190 : 210,
      maxWidth: "78vw",
      backdropFilter: "blur(8px)",
      boxShadow: "0 12px 32px rgba(0,0,0,.55)",
    }}>
      <div style={{ color: cores.texto, fontWeight: 800, fontSize: 14, letterSpacing: 0.5 }}>{label}</div>
      <Linha cor={cores.verde} nome="Lucro líq." valor={fmtCurrencyB(atual.lucro)} delta={dLucro} />
      <Linha cor={cores.vermelho} nome="Cotação" valor={fmtCurrency(atual.cotacao)} delta={dCot} />
    </div>
  );
}

/* ---------- Ponto da linha ---------- */
function PontoCotacao({ cx, cy, ativo, mobile, cores }: any) {
  if (cx == null || cy == null) return null;
  const base = mobile ? 4.5 : 5.5;
  return (
    <g>
      <circle cx={cx} cy={cy} r={ativo ? base + 8 : base + 4} fill={cores.vermelho} opacity={0.18} />
      <circle cx={cx} cy={cy} r={ativo ? base + 1.5 : base} fill={cores.card} stroke={cores.vermelho} strokeWidth={mobile ? 3 : 3.5} />
    </g>
  );
}

/* ---------- Componente principal ---------- */
export function ProfitVsQuoteChart({
  ticker = "GOOG",
  historicalPrices = [],
  historicalProfits = [],
  currency = "R$",
}: ProfitVsQuoteChartProps) {
  const [refContainer, largura] = useLarguraContainer();
  const [barraAtiva, setBarraAtiva] = useState<number | null>(null);
  const [mostrar, setMostrar] = useState({ lucro: true, cotacao: true });
  const theme = useAppTheme();
  const cores = PALETTES[theme];

  const dados = useMemo(() => {
    if (!historicalProfits || historicalProfits.length === 0 || !historicalPrices || historicalPrices.length === 0) return [];

    return historicalProfits.map(profitItem => {
      const year = profitItem.year;
      
      // Find prices for that year (formats: "M/YYYY", "MM/YYYY", "M / YYYY", etc.)
      const yearPrices = historicalPrices.filter(p => {
        const dateStr = String(p.date);
        return dateStr.endsWith(year) || dateStr.includes(`/${year}`) || dateStr.endsWith(` ${year}`);
      });
      
      const yearEndPrice = yearPrices.length > 0 
        ? yearPrices[yearPrices.length - 1].price 
        : null;

      return {
        ano: year,
        lucro: Number(profitItem.netIncome) / 1000000000,
        cotacao: yearEndPrice,
      };
    }).filter(item => item.cotacao !== null && item.lucro !== undefined && !isNaN(item.lucro));
  }, [historicalPrices, historicalProfits]);

  /* Breakpoints por largura do CONTAINER */
  const bp = largura < 360 ? "xs" : largura < 640 ? "sm" : "md";
  const mobile = bp !== "md";

  const cfg = {
    xs: { alturaGrafico: 240, eixoEsq: 34, eixoDir: 30, fonteEixo: 9,  fonteAno: 11, barraMax: 34, ticksY: 4, margem: { top: 14, right: 2, left: 0, bottom: 0 } },
    sm: { alturaGrafico: 290, eixoEsq: 38, eixoDir: 32, fonteEixo: 10, fonteAno: 12, barraMax: 46, ticksY: 4, margem: { top: 16, right: 2, left: 0, bottom: 0 } },
    md: { alturaGrafico: 380, eixoEsq: 56, eixoDir: 46, fonteEixo: 11, fonteAno: 13, barraMax: 64, ticksY: 5, margem: { top: 20, right: 4, left: 4, bottom: 4 } },
  }[bp];

  const fmtEixoLucro = (v: number) => mobile ? fmtBCompacto(v) : fmtBCheio(v);
  const fmtEixoCot = (v: number) => mobile ? fmtUSCompacto(v) : fmtUSCheio(v);

  const cagr = useMemo(() => {
    const n = dados.length - 1;
    if (n < 1) return { lucro: 0, cotacao: 0 };
    
    // Ensure we don't calculate Math.pow for negative numbers if the exponent is a fraction
    // If first year profit is negative, CAGR is complex, return 0 for simplicity.
    let lucroCagr = 0;
    if (dados[0].lucro > 0 && dados[n].lucro > 0) {
       lucroCagr = (Math.pow(dados[n].lucro / dados[0].lucro, 1 / n) - 1) * 100;
    }
    
    let cotacaoCagr = 0;
    if (dados[0].cotacao > 0 && dados[n].cotacao > 0) {
      cotacaoCagr = (Math.pow(dados[n].cotacao / dados[0].cotacao, 1 / n) - 1) * 100;
    }

    return {
      lucro: lucroCagr,
      cotacao: cotacaoCagr,
    };
  }, [dados]);

  const alternar = useCallback(
    (chave: 'lucro' | 'cotacao') => setMostrar((m) => ({ ...m, [chave]: !m[chave] })),
    []
  );

  const ChipLegenda = ({ chave, cor, rotulo }: any) => (
    <button
      onClick={() => alternar(chave)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        minHeight: 44,                      /* alvo de toque >=44px (Apple HIG) */
        flex: mobile ? 1 : "0 0 auto",       /* mobile: chips ocupam a linha toda */
        background: mostrar[chave as keyof typeof mostrar] ? `${cor}1A` : "transparent",
        border: `1px solid ${mostrar[chave as keyof typeof mostrar] ? cor + "55" : cores.borda}`,
        borderRadius: 999, padding: "8px 14px", cursor: "pointer",
        opacity: mostrar[chave as keyof typeof mostrar] ? 1 : 0.4,
        transition: "all .25s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: 5, background: cor, boxShadow: mostrar[chave as keyof typeof mostrar] ? `0 0 10px ${cor}` : "none", flexShrink: 0 }} />
      <span style={{ color: cores.texto, fontSize: bp === "xs" ? 10 : 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {rotulo}
      </span>
    </button>
  );

  if (dados.length < 2) return null;

  return (
    <div
      ref={refContainer}
      className="animate-in fade-in slide-in-from-bottom-4 duration-700"
      style={{
        background: `linear-gradient(180deg, ${cores.card} 0%, ${cores.fundo} 100%)`,
        border: `1px solid ${cores.borda}`,
        borderRadius: mobile ? 20 : 24,
        padding: mobile ? "16px 10px 12px" : "22px 16px 14px",
        fontFamily: "'Poppins','Inter',system-ui,sans-serif",
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Cabeçalho */}
      <div style={{ padding: "0 6px 4px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, color: cores.texto, fontSize: "clamp(17px,4.8vw,24px)", fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15 }}>
            Lucro vs Cotação
          </h2>
          <span style={{
            color: cores.verde, fontWeight: 800, fontSize: 12,
            background: "rgba(47,215,155,.1)", border: "1px solid rgba(47,215,155,.3)",
            borderRadius: 8, padding: "2px 8px", letterSpacing: 1,
          }}>{ticker}</span>
        </div>
        {!mobile && (
          <p style={{ margin: "6px 0 0", color: cores.textoSuave, fontSize: 12.5, lineHeight: 1.5 }}>
            Lucro líquido anual (barras, em bilhões) versus preço da ação (linha).
          </p>
        )}
      </div>

      {/* Cards CAGR — grid fluido: 2 colunas sempre que couber, 1 no xs */}
      <div style={{
        display: "grid",
        gridTemplateColumns: bp === "xs" ? "1fr" : "repeat(2, 1fr)",
        gap: 8,
        padding: "10px 4px",
      }}>
        {[
          { rot: "CAGR Lucro", val: cagr.lucro, cor: cores.verde },
          { rot: "CAGR Cotação", val: cagr.cotacao, cor: cores.vermelho },
        ].map((c) => (
          <div key={c.rot} style={{
            background: "rgba(255,255,255,.02)",
            border: `1px solid ${cores.borda}`,
            borderRadius: 14,
            padding: mobile ? "8px 12px" : "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}>
            <span style={{ color: cores.textoSuave, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600 }}>{c.rot}</span>
            <span style={{ color: c.cor, fontSize: mobile ? 16 : 20, fontWeight: 800, whiteSpace: "nowrap" }}>
              {c.val >= 0 ? "+" : ""}{c.val.toFixed(1)}%
              <span style={{ fontSize: 9, color: cores.textoSuave, fontWeight: 600 }}> a.a.</span>
            </span>
          </div>
        ))}
      </div>

      {/* Legenda interativa */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "0 4px 8px" }}>
        <ChipLegenda chave="lucro" cor={cores.verde} rotulo={bp === "xs" ? "Lucro" : "Lucro líquido"} />
        <ChipLegenda chave="cotacao" cor={cores.vermelho} rotulo="Cotação" />
      </div>

      {/* Rótulos de unidade dos eixos (mobile usa formato compacto) */}
      {mobile && (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px 2px" }}>
          <span style={{ color: cores.verde, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{currency} bilhões</span>
          <span style={{ color: cores.vermelho, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{currency}/ação</span>
        </div>
      )}

      {/* Gráfico */}
      <div style={{ width: "100%", height: cfg.alturaGrafico, touchAction: "pan-y" }}>
        <ResponsiveContainer>
          <ComposedChart
            data={dados}
            margin={cfg.margem}
            onMouseLeave={() => setBarraAtiva(null)}
          >
            <defs>
              <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cores.verde} stopOpacity={0.95} />
                <stop offset="100%" stopColor={cores.verdeEscuro} stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="gradLucroAtivo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5FF2BC" stopOpacity={1} />
                <stop offset="100%" stopColor={cores.verde} stopOpacity={0.9} />
              </linearGradient>
              <filter id="glowLinha" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation={mobile ? 3 : 4} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid stroke={cores.borda} strokeDasharray="4 8" vertical={false} />

            <XAxis
              dataKey="ano"
              tick={{ fill: cores.texto, fontSize: cfg.fonteAno, fontWeight: 700 }}
              axisLine={{ stroke: cores.borda }}
              tickLine={false}
              dy={6}
              interval={0}
            />
            <YAxis
              yAxisId="lucro"
              tickFormatter={fmtEixoLucro}
              tick={{ fill: cores.verde, fontSize: cfg.fonteEixo, fontWeight: 600 }}
              axisLine={false} tickLine={false}
              width={cfg.eixoEsq}
              tickCount={cfg.ticksY}
            />
            <YAxis
              yAxisId="cotacao"
              orientation="right"
              tickFormatter={fmtEixoCot}
              tick={{ fill: cores.vermelho, fontSize: cfg.fonteEixo, fontWeight: 600 }}
              axisLine={false} tickLine={false}
              width={cfg.eixoDir}
              tickCount={cfg.ticksY}
            />

            <Tooltip
              content={<TooltipCustom dados={dados} mobile={mobile} currency={currency} cores={cores} />}
              cursor={{ fill: cores.textoSuave + "15" }}
              position={mobile ? { y: 0 } : undefined}
              allowEscapeViewBox={{ x: false, y: false }}
              wrapperStyle={{ zIndex: 10, outline: "none" }}
            />

            {barraAtiva !== null && (
              <ReferenceLine
                yAxisId="lucro"
                x={dados[barraAtiva]?.ano}
                stroke={cores.textoSuave}
                strokeDasharray="3 5"
                strokeOpacity={0.35}
              />
            )}

            {mostrar.lucro && (
              <Bar
                yAxisId="lucro"
                dataKey="lucro"
                radius={[8, 8, 0, 0]}
                maxBarSize={cfg.barraMax}
                animationDuration={900}
                animationEasing="ease-out"
                onMouseEnter={(_, i) => setBarraAtiva(i)}
                onClick={(_, i) => setBarraAtiva((a) => (a === i ? null : i))}
              >
                {dados.map((_, i) => (
                  <Cell
                    key={i}
                    fill={barraAtiva === i ? "url(#gradLucroAtivo)" : "url(#gradLucro)"}
                    style={{ transition: "fill .25s ease", cursor: "pointer" }}
                  />
                ))}
              </Bar>
            )}

            {mostrar.cotacao && (
              <Line
                yAxisId="cotacao"
                type="monotone"
                dataKey="cotacao"
                stroke={cores.vermelho}
                strokeWidth={mobile ? 3 : 4}
                strokeLinecap="round"
                filter="url(#glowLinha)"
                dot={(p: any) => <PontoCotacao key={p.index} {...p} ativo={barraAtiva === p.index} mobile={mobile} cores={cores} />}
                activeDot={false}
                animationDuration={1400}
                animationBegin={300}
                animationEasing="ease-in-out"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Rodapé e Info Box */}
      <div style={{ textAlign: "center", color: cores.textoSuave, fontSize: 9.5, letterSpacing: 0.8, paddingTop: 6, paddingBottom: 16 }}>
        {mobile ? "Toque nas barras • Toque na legenda para ocultar" : "Passe o mouse nas barras para detalhes • Clique na legenda para ocultar séries"}
      </div>

      <div className="flex items-start gap-4 text-[10px] sm:text-xs font-bold text-muted-foreground leading-relaxed bg-black/40 p-4 sm:p-5 rounded-2xl border border-[#16211C]">
        <Info className="w-5 h-5 text-[#2FD79B] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[#E8F5EE] font-black uppercase tracking-wider">Por que observar essa relação?</p>
          <p className="text-[#7C8F87]">No longo prazo, o preço de uma ação tende a seguir a trajetória dos seus lucros. Quando o lucro sobe e a cotação não acompanha, pode haver uma oportunidade de valor. Por outro lado, lucros em queda com preços subindo podem indicar exuberância ou mudança nos fundamentos.</p>
        </div>
      </div>
    </div>
  );
}

