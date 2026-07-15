import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Compass, TrendingUp, AlertTriangle, 
  Layers, ChevronRight, HelpCircle, Activity 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { motion } from 'motion/react';

interface IndexDetailsProps {
  data: any;
  history: any[];
}

export function IndexDetails({ data, history }: IndexDetailsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'composicao' | 'performance' | 'risco'>('composicao');

  const symbol = data.symbol.toUpperCase().replace('.SA', '');

  // Index Database
  const indexDatabase: Record<string, any> = {
    '^BVSP': {
      name: 'Índice Bovespa (IBOVESPA)',
      desc: 'Principal indicador de desempenho das ações negociadas na B3.',
      volatility12m: 14.8,
      sharpeRatio: 0.45,
      maxDrawdown: -16.4,
      ytdReturn: 4.82,
      last12mReturn: 12.35,
      components: [
        { ticker: 'VALE3', name: 'Vale S.A.', weight: 12.45 },
        { asset: 'PETR4', name: 'Petrobras S.A. Pref', weight: 8.95 },
        { asset: 'ITUB4', name: 'Itaú Unibanco PN', weight: 7.20 },
        { asset: 'PETR3', name: 'Petrobras S.A. Ord', weight: 4.80 },
        { asset: 'BBDC4', name: 'Banco Bradesco PN', weight: 3.90 },
        { asset: 'ELET3', name: 'Eletrobras S.A. Ord', weight: 3.50 },
        { asset: 'BBAS3', name: 'Banco do Brasil S.A.', weight: 3.20 },
        { asset: 'B3SA3', name: 'B3 S.A. - Brasil Bolsa Balcão', weight: 3.10 },
      ],
      comparatives: [
        { label: 'IBOVESPA (Este)', value: 12.35 },
        { label: 'CDI Acumulado', value: 10.75 },
        { label: 'IPCA (Inflação)', value: 4.25 },
        { label: 'IFIX (FIIs)', value: 9.80 }
      ],
      monthlyMatrix: [
        { ano: '2025', jan: 1.2, fev: -0.5, mar: 2.1, abr: -1.8, mai: 0.8, jun: 3.1, jul: 1.5, ago: -0.9, set: 1.2, out: -2.3, nov: 1.8, dez: 2.5, total: 9.9 },
        { ano: '2024', jan: -4.8, fev: 0.9, mar: -0.7, abr: -1.7, mai: -3.0, jun: 2.2, jul: 3.0, ago: 6.5, set: -3.1, out: -1.6, nov: 1.1, dez: -1.2, total: -2.9 },
        { ano: '2023', jan: 3.4, fev: -7.5, mar: -2.9, abr: 2.5, mai: 3.7, jun: 9.0, jul: 3.3, ago: -5.1, set: 0.7, out: -2.9, nov: 12.5, dez: 4.5, total: 22.3 }
      ]
    },
    'IFIX': {
      name: 'Índice de Fundos Imobiliários B3',
      desc: 'Indicador do desempenho médio das cotas de FIIs negociadas na B3.',
      volatility12m: 5.2,
      sharpeRatio: 1.15,
      maxDrawdown: -4.8,
      ytdReturn: 3.10,
      last12mReturn: 9.80,
      components: [
        { asset: 'KNIP11', name: 'Kinea Índices de Preços FII', weight: 6.80 },
        { asset: 'KNCR11', name: 'Kinea Rendimentos Imobiliários', weight: 5.40 },
        { asset: 'HGLG11', name: 'CGHG Logística FII', weight: 4.30 },
        { asset: 'MXRF11', name: 'Maxi Renda FII', weight: 3.90 },
        { asset: 'XPML11', name: 'XP Malls FII', weight: 3.80 },
        { asset: 'BTLG11', name: 'BTG Pactual Logística FII', weight: 3.10 }
      ],
      comparatives: [
        { label: 'IFIX (Este)', value: 9.80 },
        { label: 'IBOVESPA', value: 12.35 },
        { label: 'CDI Acumulado', value: 10.75 },
        { label: 'IPCA + 6%', value: 10.25 }
      ],
      monthlyMatrix: [
        { ano: '2025', jan: 0.5, fev: 0.2, mar: 0.8, abr: -0.4, mai: 0.9, jun: 1.1, jul: 0.3, ago: 0.1, set: 0.4, out: -0.6, nov: 0.8, dez: 0.5, total: 4.7 },
        { ano: '2024', jan: 0.8, fev: 0.9, mar: 1.2, abr: -0.8, mai: 0.1, jun: -0.3, jul: 0.5, ago: 0.9, set: -0.2, out: -1.1, nov: 0.4, dez: 1.5, total: 4.1 },
        { ano: '2023', jan: -1.4, fev: -0.5, mar: -1.1, abr: 4.0, mai: 5.4, jun: 4.7, jul: 1.3, ago: 1.1, set: 0.2, out: -1.9, nov: 0.8, dez: 4.1, total: 15.5 }
      ]
    },
    '^GSPC': {
      name: 'S&P 500 Index (Estados Unidos)',
      desc: 'Mede o desempenho das 500 maiores empresas de capital aberto dos EUA.',
      volatility12m: 12.2,
      sharpeRatio: 1.25,
      maxDrawdown: -10.2,
      ytdReturn: 14.50,
      last12mReturn: 24.30,
      components: [
        { asset: 'MSFT', name: 'Microsoft Corporation', weight: 7.15 },
        { asset: 'AAPL', name: 'Apple Inc.', weight: 6.85 },
        { asset: 'NVDA', name: 'NVIDIA Corporation', weight: 6.40 },
        { asset: 'AMZN', name: 'Amazon.com Inc.', weight: 3.95 },
        { asset: 'META', name: 'Meta Platforms Inc.', weight: 2.50 }
      ],
      comparatives: [
        { label: 'S&P 500 (Este)', value: 24.30 },
        { label: 'NASDAQ Composite', value: 29.50 },
        { label: 'Global Equities', value: 18.20 },
        { label: 'US 10-Yr Treasury', value: 4.15 }
      ],
      monthlyMatrix: [
        { ano: '2025', jan: 2.5, fev: 1.8, mar: 3.1, abr: -1.2, mai: 4.2, jun: 2.9, jul: 1.5, ago: -2.1, set: 2.8, out: -0.9, nov: 3.4, dez: 2.1, total: 22.4 },
        { ano: '2024', jan: 1.6, fev: 5.2, mar: 3.1, abr: -4.1, mai: 4.8, jun: 3.5, jul: 1.1, ago: 2.3, set: 2.0, out: -1.0, nov: 5.7, dez: 4.4, total: 31.8 }
      ]
    }
  };

  // Coherent fallback dynamic index data
  const idxInfo = useMemo(() => {
    if (indexDatabase[symbol]) return indexDatabase[symbol];

    return {
      name: data.longName || `${symbol} - Índice de Mercado`,
      desc: 'Indicador ponderado pelo valor de mercado para acompanhamento de desempenho.',
      volatility12m: 13.5,
      sharpeRatio: 0.65,
      maxDrawdown: -12.4,
      ytdReturn: 5.4,
      last12mReturn: 11.20,
      components: [
        { asset: 'COMP_A', name: 'Ativo de Maior Peso', weight: 15.0 },
        { asset: 'COMP_B', name: 'Ativo de Segundo Peso', weight: 10.0 },
        { asset: 'COMP_C', name: 'Ativo de Terceiro Peso', weight: 8.5 }
      ],
      comparatives: [
        { label: 'Este Índice', value: 11.20 },
        { label: 'Índice de Mercado Geral', value: 10.50 },
        { label: 'Taxa Selic/CDI Equivalente', value: 10.75 }
      ],
      monthlyMatrix: [
        { ano: '2025', jan: 1.0, fev: 0.5, mar: 1.5, abr: -0.8, mai: 1.2, jun: 2.0, jul: 0.8, ago: -1.0, set: 1.1, out: -1.5, nov: 1.3, dez: 1.9, total: 7.2 }
      ]
    };
  }, [symbol, data]);

  // Performance simulation for charting index
  const chartPerformanceData = useMemo(() => {
    if (history && history.length > 0) {
      return history.map((p: any, i: number) => {
        return {
          date: p.date ? new Date(p.date).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' }) : String(i),
          'Index (Retorno %)': parseFloat(((p.close / history[0].close - 1) * 100).toFixed(2))
        };
      });
    }
    return [];
  }, [history]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Index Summary Text */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <h4 className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1 flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-primary" /> Perfil do Índice
        </h4>
        <h3 className="font-black text-lg text-foreground mb-2">{idxInfo.name}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{idxInfo.desc}</p>
      </div>

      {/* 4 Cards das Métricas de Risco/Retorno do Índice */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Retorno 12 Meses', value: `${idxInfo.last12mReturn.toFixed(2)}%`, icon: TrendingUp, color: 'text-emerald-500', desc: 'Retorno acumulado nominal' },
          { label: 'Volatilidade Anual (12M)', value: `${idxInfo.volatility12m.toFixed(1)}%`, icon: Activity, color: 'text-amber-500', desc: 'Desvio padrão dos retornos' },
          { label: 'Índice de Sharpe', value: idxInfo.sharpeRatio.toFixed(2), icon: BarChart3, color: 'text-blue-500', desc: 'Retorno ajustado ao risco' },
          { label: 'Queda Máxima (Drawdown)', value: `${idxInfo.maxDrawdown.toFixed(1)}%`, icon: AlertTriangle, color: 'text-red-500', desc: 'Pior perda desde o pico' }
        ].map((item, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/20 transition-all shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block max-w-[80%] leading-tight">{item.label}</span>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <p className="text-xl sm:text-2xl font-black text-foreground font-mono">{item.value}</p>
            <p className="text-[9px] text-muted-foreground mt-1.5">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs Internas para Índice */}
      <div className="flex border-b border-border/80">
        {[
          { id: 'composicao', label: 'Constituintes & Distribuição' },
          { id: 'performance', label: 'Rentabilidade Histórica' },
          { id: 'risco', label: 'Risco & Comparativos' }
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

      {/* Tab 1: Constituidores */}
      {activeSubTab === 'composicao' && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h4 className="text-xs text-muted-foreground uppercase font-black tracking-widest">Peso de Ações</h4>
            <h3 className="font-black text-lg text-foreground">Ações com Maior Peso no Índice</h3>
            <p className="text-xs text-muted-foreground mt-1">Demonstra quais empresas exercem maior influência sobre a oscilação diária do índice.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {idxInfo.components.map((comp: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-4 border border-border/50 bg-muted/10 rounded-2xl hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-muted text-foreground flex items-center justify-center font-black text-xs font-mono">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-black text-foreground font-mono">{comp.ticker || comp.asset}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">{comp.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Peso no Índice</span>
                  <span className="font-black text-foreground font-mono text-sm">{comp.weight.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Performance */}
      {activeSubTab === 'performance' && (
        <div className="space-y-6">
          
          {/* Performance AreaChart */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h4 className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Evolução Histórica</h4>
            <h3 className="font-black text-lg text-foreground mb-4">Retorno Percentual do Índice</h3>
            <div className="h-[250px] w-full">
              {chartPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartPerformanceData}>
                    <defs>
                      <linearGradient id="colorIndex" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="Index (Retorno %)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIndex)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                  Sem dados históricos disponíveis para evolução.
                </div>
              )}
            </div>
          </div>

          {/* Monthly Matrix Table */}
          {idxInfo.monthlyMatrix && (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
              <h4 className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Matriz de Retornos</h4>
              <h3 className="font-black text-lg text-foreground mb-4">Rentabilidade Histórica Mensal (%)</h3>
              
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="text-[10px] bg-muted text-muted-foreground uppercase font-black border-b border-border">
                      <th className="py-2.5 px-3 text-left">Ano</th>
                      {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m) => (
                        <th key={m} className="py-2.5 px-2">{m}</th>
                      ))}
                      <th className="py-2.5 px-3 bg-primary/10 text-primary">Anual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs font-semibold font-mono">
                    {idxInfo.monthlyMatrix.map((row: any) => (
                      <tr key={row.ano} className="hover:bg-muted/30">
                        <td className="py-3 px-3 text-left font-black text-foreground">{row.ano}</td>
                        {[row.jan, row.fev, row.mar, row.abr, row.mai, row.jun, row.jul, row.ago, row.set, row.out, row.nov, row.dez].map((v, mIdx) => (
                          <td 
                            key={mIdx} 
                            className={`py-3 px-2 ${v > 0 ? 'text-emerald-500' : v < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}
                          >
                            {v !== undefined ? `${v > 0 ? '+' : ''}${v.toFixed(1)}%` : '—'}
                          </td>
                        ))}
                        <td className={`py-3 px-3 font-black bg-primary/5 ${row.total > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {row.total > 0 ? '+' : ''}{row.total.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab 3: Risco & Comparativo */}
      {activeSubTab === 'risco' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Comparative returns bar chart */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Benchmark Concorrência</h4>
              <h3 className="font-black text-md text-foreground mb-4">Rentabilidade de 12M Comparada</h3>
            </div>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={idxInfo.comparatives} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                  <YAxis dataKey="label" type="category" stroke="#64748b" fontSize={9} tickLine={false} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volatility detail cards */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs text-muted-foreground uppercase font-black tracking-widest">Métricas Voláteis</h4>
            <h3 className="font-black text-md text-foreground mb-4">Entendimento de Risco do Índice</h3>
            
            <div className="space-y-3.5">
              {[
                { label: 'Desvio Padrão Mensal', value: `${(idxInfo.volatility12m / Math.sqrt(12)).toFixed(2)}%`, desc: 'Variação média esperada em uma base mensal padrão.' },
                { label: 'Relação Retorno/Risco', value: idxInfo.sharpeRatio >= 1 ? 'Excelente' : idxInfo.sharpeRatio >= 0.5 ? 'Moderado' : 'Baixo', desc: 'Classificação de eficiência de portfólio baseada no Índice Sharpe.' },
                { label: 'Máxima Queda Histórica', value: `${idxInfo.maxDrawdown.toFixed(2)}%`, desc: 'A maior oscilação negativa ocorrida do topo ao fundo.' }
              ].map((item, i) => (
                <div key={i} className="p-4 border border-border/60 rounded-2xl bg-muted/25">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-xs text-foreground uppercase">{item.label}</span>
                    <span className="font-mono text-xs font-black text-primary">{item.value}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
