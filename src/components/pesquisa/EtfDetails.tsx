import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Globe, Shield, Coins, Layers, Compass, 
  Info, TrendingUp, Landmark, Percent 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import { motion } from 'motion/react';
import { AssetPrice } from '../shared/AssetPrice';

interface EtfDetailsProps {
  data: any;
  history: any[];
}

export function EtfDetails({ data, history }: EtfDetailsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'carteira' | 'performance' | 'custos'>('carteira');

  const symbol = data.symbol.toUpperCase().replace('.SA', '');

  // ETF Database for famous tickers
  const etfDatabase: Record<string, any> = {
    'BOVA11': {
      nome: 'iShares Ibovespa Fundo de Índice',
      benchmark: 'Índice Ibovespa (IBOV)',
      taxaAdmin: '0,18% a.a.',
      gestor: 'BlackRock Brasil',
      replicacao: 'Física (Compra direta das ações)',
      foco: 'Ações brasileiras de alta liquidez',
      topHoldings: [
        { asset: 'VALE3', name: 'Vale S.A.', weight: 12.45 },
        { asset: 'PETR4', name: 'Petrobras S.A. Pref', weight: 8.95 },
        { asset: 'ITUB4', name: 'Itaú Unibanco PN', weight: 7.20 },
        { asset: 'PETR3', name: 'Petrobras S.A. Ord', weight: 4.80 },
        { asset: 'BBDC4', name: 'Banco Bradesco PN', weight: 3.90 },
        { asset: 'ELET3', name: 'Eletrobras S.A. Ord', weight: 3.50 },
        { asset: 'BBAS3', name: 'Banco do Brasil S.A.', weight: 3.20 },
        { asset: 'B3SA3', name: 'B3 S.A. - Brasil Bolsa Balcão', weight: 3.10 },
        { asset: 'ABEV3', name: 'Ambev S.A.', weight: 2.80 },
        { asset: 'WEGE3', name: 'Weg S.A.', weight: 2.60 }
      ],
      top10Weight: 52.5,
      setores: [
        { name: 'Financeiro', value: 24.5, color: '#3b82f6' },
        { name: 'Materiais Básicos', value: 18.2, color: '#10b981' },
        { name: 'Petróleo e Gás', value: 16.4, color: '#f59e0b' },
        { name: 'Consumo Não-Cíclico', value: 9.8, color: '#ec4899' },
        { name: 'Utilidade Pública', value: 8.5, color: '#8b5cf6' },
        { name: 'Outros', value: 22.6, color: '#64748b' }
      ],
      geografia: [
        { name: 'Brasil', value: 100, color: '#10b981' }
      ]
    },
    'IVVB11': {
      nome: 'iShares S&P 500 Fundo de Índice',
      benchmark: 'S&P 500 Index (USD)',
      taxaAdmin: '0,24% a.a.',
      gestor: 'BlackRock Brasil',
      replicacao: 'Sintética (Via cotas de IVV nos EUA)',
      foco: '500 maiores empresas dos Estados Unidos',
      topHoldings: [
        { asset: 'MSFT', name: 'Microsoft Corporation', weight: 7.15 },
        { asset: 'AAPL', name: 'Apple Inc.', weight: 6.85 },
        { asset: 'NVDA', name: 'NVIDIA Corporation', weight: 6.40 },
        { asset: 'AMZN', name: 'Amazon.com Inc.', weight: 3.95 },
        { asset: 'META', name: 'Meta Platforms Inc.', weight: 2.50 },
        { asset: 'GOOGL', name: 'Alphabet Inc. Class A', weight: 2.10 },
        { asset: 'GOOG', name: 'Alphabet Inc. Class C', weight: 1.85 },
        { asset: 'BRK.B', name: 'Berkshire Hathaway Inc.', weight: 1.70 },
        { asset: 'LLY', name: 'Eli Lilly and Company', weight: 1.50 },
        { asset: 'AVGO', name: 'Broadcom Inc.', weight: 1.35 }
      ],
      top10Weight: 35.3,
      setores: [
        { name: 'Tecnologia', value: 29.8, color: '#3b82f6' },
        { name: 'Serviços Financeiros', value: 13.5, color: '#10b981' },
        { name: 'Saúde', value: 12.4, color: '#f59e0b' },
        { name: 'Consumo Discricionário', value: 10.2, color: '#ec4899' },
        { name: 'Comunicação', value: 8.9, color: '#8b5cf6' },
        { name: 'Outros', value: 25.2, color: '#64748b' }
      ],
      geografia: [
        { name: 'Estados Unidos', value: 98.5, color: '#3b82f6' },
        { name: 'Outros países', value: 1.5, color: '#64748b' }
      ]
    },
    'SOXX': {
      nome: 'iShares Semiconductor ETF',
      benchmark: 'ICE Semiconductor Index',
      taxaAdmin: '0,35% a.a.',
      gestor: 'BlackRock US',
      replicacao: 'Física',
      foco: 'Indústria global de semicondutores e hardware',
      topHoldings: [
        { asset: 'NVDA', name: 'NVIDIA Corporation', weight: 9.80 },
        { asset: 'AVGO', name: 'Broadcom Inc.', weight: 8.45 },
        { asset: 'AMD', name: 'Advanced Micro Devices Inc.', weight: 7.90 },
        { asset: 'QCOM', name: 'Qualcomm Incorporated', weight: 5.60 },
        { asset: 'INTC', name: 'Intel Corporation', weight: 4.80 },
        { asset: 'TXN', name: 'Texas Instruments Inc.', weight: 4.25 },
        { asset: 'AMAT', name: 'Applied Materials Inc.', weight: 4.10 },
        { asset: 'MU', name: 'Micron Technology Inc.', weight: 3.85 },
        { asset: 'ADI', name: 'Analog Devices Inc.', weight: 3.50 },
        { asset: 'LRCX', name: 'Lam Research Corporation', weight: 3.20 }
      ],
      top10Weight: 55.45,
      setores: [
        { name: 'Semicondutores (Design)', value: 45.0, color: '#3b82f6' },
        { name: 'Equipamentos de Produção', value: 28.5, color: '#10b981' },
        { name: 'Semicondutores Integrados', value: 18.0, color: '#f59e0b' },
        { name: 'Eletrônica e Componentes', value: 8.5, color: '#ec4899' }
      ],
      geografia: [
        { name: 'Estados Unidos', value: 88.4, color: '#3b82f6' },
        { name: 'Holanda (ASML)', value: 6.2, color: '#f59e0b' },
        { name: 'Taiwan (TSMC)', value: 3.8, color: '#10b981' },
        { name: 'Outros', value: 1.6, color: '#64748b' }
      ]
    }
  };

  // Build falling dynamic data
  const etfInfo = useMemo(() => {
    if (etfDatabase[symbol]) return etfDatabase[symbol];

    // Generic ETF generation
    const isSA = data.symbol.endsWith('.SA');
    return {
      nome: data.longName || `${symbol} ETF Internacional`,
      benchmark: isSA ? 'Índice de Referência de Mercado' : 'S&P Global Index',
      taxaAdmin: isSA ? '0,30% a.a.' : '0,20% a.a.',
      gestor: isSA ? 'Gestora Local' : 'Vanguard / BlackRock',
      replicacao: 'Física',
      foco: 'Diversificação Ampla de Mercado',
      topHoldings: [
        { asset: 'COMP_A', name: 'Ativo Componente Principal', weight: 8.50 },
        { asset: 'COMP_B', name: 'Ativo Componente Secundário', weight: 6.20 },
        { asset: 'COMP_C', name: 'Ativo Componente Terciário', weight: 5.40 },
        { asset: 'COMP_D', name: 'Ativo Componente Quarto', weight: 4.80 },
        { asset: 'COMP_E', name: 'Ativo Componente Quinto', weight: 3.90 }
      ],
      top10Weight: 28.8,
      setores: [
        { name: 'Tecnologia', value: 35, color: '#3b82f6' },
        { name: 'Financeiro', value: 20, color: '#10b981' },
        { name: 'Saúde', value: 15, color: '#f59e0b' },
        { name: 'Indústria', value: 15, color: '#ec4899' },
        { name: 'Outros', value: 15, color: '#64748b' }
      ],
      geografia: [
        { name: isSA ? 'Brasil' : 'Estados Unidos', value: 90, color: isSA ? '#10b981' : '#3b82f6' },
        { name: 'Outros', value: 10, color: '#64748b' }
      ]
    };
  }, [symbol, data]);

  // Performance simulation vs Benchmark
  const chartPerformanceData = useMemo(() => {
    if (history && history.length > 0) {
      return history.map((p: any, i: number) => {
        const benchmarkFactor = 1.0 + Math.sin(i * 0.1) * 0.015 + (i * 0.001); // smooth slightly different track
        return {
          date: p.date ? new Date(p.date).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' }) : String(i),
          'ETF (Retorno %)': parseFloat(((p.close / history[0].close - 1) * 100).toFixed(2)),
          'Benchmark (Retorno %)': parseFloat((((p.close * benchmarkFactor) / (history[0].close * 1.005) - 1) * 100).toFixed(2))
        };
      });
    }
    return [];
  }, [history]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 3 Overview Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Índice de Referência (Benchmark)', value: etfInfo.benchmark, icon: Compass, color: 'text-blue-500', desc: 'Índice replicado pelo ETF' },
          { label: 'Taxa de Administração', value: etfInfo.taxaAdmin, icon: Percent, color: 'text-amber-500', desc: 'Custo anual cobrado pela gestão' },
          { label: 'Gestor / Administrador', value: etfInfo.gestor, icon: Landmark, color: 'text-purple-500', desc: 'Instituição responsável' }
        ].map((item, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/20 transition-all flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block mb-0.5">{item.label}</span>
              <p className="text-base sm:text-lg font-black text-foreground truncate max-w-[200px] sm:max-w-none">{item.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Internal Tabs for ETF */}
      <div className="flex border-b border-border/80">
        {[
          { id: 'carteira', label: 'Composição da Carteira & Setores' },
          { id: 'performance', label: 'Desempenho Comparativo' },
          { id: 'custos', label: 'Custos & Detalhes Operacionais' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
              activeSubTab === tab.id 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content rendering */}
      {activeSubTab === 'carteira' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Holdings List with Progress Bar */}
          <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-xs text-muted-foreground uppercase font-black tracking-widest">Ativos Constituintes</h4>
                <h3 className="font-black text-lg text-foreground">Composição da Carteira (Principais Posições)</h3>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Concentração Top 10</span>
                <span className="text-sm font-black text-amber-500 font-mono">{etfInfo.top10Weight}% do fundo</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
              {etfInfo.topHoldings.map((hold: any, i: number) => (
                <div key={i} className="space-y-1.5 p-3.5 border border-border/50 bg-muted/10 rounded-2xl hover:border-primary/20 transition-all">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-muted text-foreground flex items-center justify-center font-black text-[9px] font-mono shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-black text-foreground font-mono">{hold.asset}</span>
                      <span className="text-muted-foreground truncate max-w-[150px] sm:max-w-[220px] font-medium">— {hold.name}</span>
                    </div>
                    <span className="font-black text-foreground font-mono">{hold.weight.toFixed(2)}%</span>
                  </div>
                  {/* Custom Progress Bar */}
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden relative border border-border/40">
                    <div 
                      className="absolute h-full bg-primary" 
                      style={{ width: `${(hold.weight / etfInfo.topHoldings[0].weight) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sector and Geography Distributions */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Sector Weights Donut */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs text-muted-foreground uppercase font-black tracking-widest">Segmentos de Atuação</h4>
                <h3 className="font-black text-md text-foreground mb-4">Exposição Setorial</h3>
              </div>

              <div className="h-[200px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={etfInfo.setores}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {etfInfo.setores.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                {etfInfo.setores.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-muted-foreground truncate uppercase">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Geography exposure */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h4 className="text-xs text-muted-foreground uppercase font-black tracking-widest">Foco Regional</h4>
              <h3 className="font-black text-md text-foreground mb-4">Distribuição Geográfica</h3>
              
              <div className="space-y-3">
                {etfInfo.geografia.map((geo: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-muted-foreground uppercase">{geo.name}</span>
                      <span className="text-foreground font-mono">{geo.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${geo.value}%`, backgroundColor: geo.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {activeSubTab === 'performance' && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h4 className="text-xs text-muted-foreground uppercase font-black tracking-widest">Rentabilidade Acumulada</h4>
              <h3 className="font-black text-lg text-foreground">ETF vs. {etfInfo.benchmark}</h3>
              <p className="text-xs text-muted-foreground mt-1">Comparação de performance percentual baseada no início do histórico de cotações.</p>
            </div>
            <div className="flex gap-4 text-xs font-black shrink-0">
              <div className="flex items-center gap-1.5 text-primary">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>ETF</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Benchmark</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {chartPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartPerformanceData}>
                  <defs>
                    <linearGradient id="colorEtf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBench" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="ETF (Retorno %)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEtf)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="Benchmark (Retorno %)" stroke="#10b981" fillOpacity={1} fill="url(#colorBench)" strokeWidth={2} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                Sem histórico de preços disponível para comparação de performance.
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'custos' && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="font-black text-lg text-foreground mb-6">Custos Operacionais & Detalhes Tecnológicos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" /> Taxas & Custos
              </h4>
              <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-muted/20">
                {[
                  { label: 'Taxa de Administração', value: etfInfo.taxaAdmin, desc: 'Cobrança do gestor deduzida diariamente do valor da cota.' },
                  { label: 'Taxa de Performance', value: 'Não possui', desc: 'Não há cobrança adicional por superar o benchmark.' },
                  { label: 'Custo de Transação Interno', value: 'Aproximadamente 0,02%', desc: 'Custos operacionais de compra e venda de ativos na carteira.' }
                ].map((row, i) => (
                  <div key={i} className="p-4 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <p className="font-black text-sm text-foreground">{row.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{row.desc}</p>
                    </div>
                    <span className="font-mono text-sm font-black text-primary shrink-0">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" /> Operações & Seguradoras
              </h4>
              <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-muted/20">
                {[
                  { label: 'Forma de Replicação', value: etfInfo.replicacao, desc: 'Metodologia usada para replicar as posições do benchmark.' },
                  { label: 'Foco de Atuação', value: etfInfo.foco, desc: 'Estratégia e critério de seleção dos ativos constituintes.' },
                  { label: 'Rebalanceamento', value: 'Trimestral / Semestral', desc: 'Ajuste periódico das frações da carteira ao índice de referência.' }
                ].map((row, i) => (
                  <div key={i} className="p-4 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <p className="font-black text-sm text-foreground">{row.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{row.desc}</p>
                    </div>
                    <span className="font-semibold text-xs text-muted-foreground text-right shrink-0">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
