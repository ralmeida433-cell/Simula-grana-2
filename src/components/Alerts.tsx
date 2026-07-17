import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Search, Plus, Trash2, ArrowUpRight, ArrowDownRight, AlertTriangle, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { searchStockData } from '../services/stockService';

interface Alert {
  id: string;
  ticker: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
  active: boolean;
  name?: string;
  currency?: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tickerInput, setTickerInput] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAlerts = () => {
      const saved = localStorage.getItem('simulagrana_alerts');
      if (saved) {
        try {
          setAlerts(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse alerts', e);
        }
      }
    };
    
    loadAlerts();
    
    const handleStorageChange = () => {
      loadAlerts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveAlerts = (newAlerts: Alert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem('simulagrana_alerts', JSON.stringify(newAlerts));
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!tickerInput || !targetPrice) {
      setError('Preencha o ticker e o preço alvo.');
      return;
    }

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setError('O preço alvo deve ser um número positivo.');
      return;
    }

    setLoading(true);
    try {
      const ticker = tickerInput.toUpperCase();
      const data = await searchStockData(ticker);
      
      if (!data) {
        setError('Ativo não encontrado. Verifique o ticker (ex: PETR4.SA, AAPL).');
        setLoading(false);
        return;
      }

      const newAlert: Alert = {
        id: crypto.randomUUID(),
        ticker,
        targetPrice: price,
        condition,
        createdAt: Date.now(),
        active: true,
        name: data.longName || data.shortName || ticker,
        currency: data.currency || 'BRL'
      };

      saveAlerts([...alerts, newAlert]);
      setTickerInput('');
      setTargetPrice('');
      
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    } catch (err) {
      setError('Erro ao validar o ativo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = (id: string) => {
    saveAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const removeAlert = (id: string) => {
    saveAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Central de Alertas
          </h2>
          <p className="text-muted-foreground mt-2">
            Configure alertas de preços e seja notificado quando um ativo atingir seu alvo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">Novo Alerta</h3>
            
            <form onSubmit={handleAddAlert} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ticker do Ativo</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                    placeholder="Ex: PETR4.SA, AAPL"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Condição</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCondition('above')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all",
                      condition === 'above' 
                        ? "bg-green-500/10 text-green-500 border border-green-500/30" 
                        : "bg-background border border-input text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Acima de
                  </button>
                  <button
                    type="button"
                    onClick={() => setCondition('below')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all",
                      condition === 'below' 
                        ? "bg-red-500/10 text-red-500 border border-red-500/30" 
                        : "bg-background border border-input text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    Abaixo de
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Preço Alvo</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Criar Alerta
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Meus Alertas ({alerts.length})</h3>
          
          {alerts.length === 0 ? (
            <div className="bg-card border border-border/50 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium mb-1">Nenhum alerta configurado</p>
              <p className="text-muted-foreground text-sm">Crie seu primeiro alerta para ser notificado sobre movimentos de preço.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "bg-card border rounded-2xl p-5 shadow-sm transition-all relative overflow-hidden group",
                      alert.active ? "border-border/50" : "border-border/50 opacity-60 grayscale"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                          {alert.ticker}
                          {!alert.active && <span className="text-[10px] uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">Inativo</span>}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1" title={alert.name}>{alert.name}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleAlert(alert.id)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          title={alert.active ? "Desativar alerta" : "Ativar alerta"}
                        >
                          {alert.active ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => removeAlert(alert.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Remover alerta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
                      <div className="flex items-center gap-2">
                        {alert.condition === 'above' ? (
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            {alert.condition === 'above' ? 'Acima de' : 'Abaixo de'}
                          </p>
                          <p className="font-mono font-bold text-foreground">
                            {alert.currency === 'USD' ? '$' : 'R$'} {alert.targetPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
