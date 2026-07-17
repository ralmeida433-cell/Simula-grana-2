import React, { useState, useEffect } from 'react';
import { Bell, Check, X, AlertTriangle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { searchStockData } from '../../services/stockService';

interface PriceAlertButtonProps {
  ticker: string;
  currentPrice: number;
  suggestedTargetPrice?: number;
  alertLabel?: string; // e.g., "Preço Bazin", "Preço Justo Graham", etc.
  currency?: string;
}

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

export default function PriceAlertButton({
  ticker,
  currentPrice,
  suggestedTargetPrice,
  alertLabel = 'Preço Alvo',
  currency = 'BRL'
}: PriceAlertButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetPriceInput, setTargetPriceInput] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('below');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasExistingAlert, setHasExistingAlert] = useState(false);

  // Auto-detect if we already have an active alert for this ticker at this exact or similar target price
  useEffect(() => {
    const checkAlerts = () => {
      const saved = localStorage.getItem('simulagrana_alerts');
      if (saved) {
        try {
          const alerts: Alert[] = JSON.parse(saved);
          const found = alerts.some(
            (a) => a.ticker.toUpperCase() === ticker.toUpperCase() && a.active
          );
          setHasExistingAlert(found);
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkAlerts();

    window.addEventListener('storage', checkAlerts);
    return () => window.removeEventListener('storage', checkAlerts);
  }, [ticker, isOpen]);

  // Pre-fill target price and select condition
  useEffect(() => {
    if (isOpen) {
      const val = suggestedTargetPrice !== undefined ? suggestedTargetPrice : currentPrice;
      setTargetPriceInput(val > 0 ? val.toFixed(2) : '');
      // Auto condition: if target is below current, condition is 'below', otherwise 'above'
      if (val < currentPrice) {
        setCondition('below');
      } else {
        setCondition('above');
      }
      setSuccess(false);
      setError('');
    }
  }, [isOpen, suggestedTargetPrice, currentPrice]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const price = parseFloat(targetPriceInput);
    if (isNaN(price) || price <= 0) {
      setError('O preço deve ser maior que zero.');
      setLoading(false);
      return;
    }

    try {
      // Fetch long name / details for the alert
      const data = await searchStockData(ticker.toUpperCase());
      const saved = localStorage.getItem('simulagrana_alerts');
      let alerts: Alert[] = [];
      if (saved) {
        try {
          alerts = JSON.parse(saved);
        } catch (e) {
          alerts = [];
        }
      }

      const newAlert: Alert = {
        id: crypto.randomUUID(),
        ticker: ticker.toUpperCase(),
        targetPrice: price,
        condition,
        createdAt: Date.now(),
        active: true,
        name: data?.longName || data?.shortName || ticker.toUpperCase(),
        currency: data?.currency || currency
      };

      const updatedAlerts = [...alerts, newAlert];
      localStorage.setItem('simulagrana_alerts', JSON.stringify(updatedAlerts));
      window.dispatchEvent(new Event('storage'));

      setSuccess(true);
      setHasExistingAlert(true);

      // Request browser notification permission if not asked yet
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }

      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError('Erro ao salvar o alerta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const currSymbol = currency === 'USD' ? '$' : 'R$';

  return (
    <>
      {/* Shortcut trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer",
          hasExistingAlert
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
            : "bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent shadow-indigo-600/10"
        )}
        id={`alert-trigger-${ticker}`}
        title={hasExistingAlert ? "Você tem alertas ativos para este ativo" : "Criar alerta de preço"}
      >
        <Bell className={cn("w-3.5 h-3.5", hasExistingAlert ? "animate-swing fill-current" : "")} />
        {hasExistingAlert ? "Alerta Configurado" : "Criar Alerta"}
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Alerta de Preço rápido
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ticker.toUpperCase()} &bull; Preço atual: {currSymbol} {currentPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 flex flex-col items-center justify-center text-center space-y-3"
                >
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6" strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 dark:text-slate-50">Alerta Criado!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Você será notificado quando o preço atingir {currSymbol} {parseFloat(targetPriceInput).toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleCreateAlert} className="space-y-4">
                  {suggestedTargetPrice !== undefined && (
                    <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100/50 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Alvo sugerido ({alertLabel}):</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetPriceInput(suggestedTargetPrice.toFixed(2));
                          if (suggestedTargetPrice < currentPrice) {
                            setCondition('below');
                          } else {
                            setCondition('above');
                          }
                        }}
                        className="font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {currSymbol} {suggestedTargetPrice.toFixed(2)}
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Disparar o alerta quando o preço estiver:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCondition('above')}
                        className={cn(
                          "py-2.5 rounded-xl border text-xs font-bold transition-all",
                          condition === 'above'
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                            : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        Acima de (&ge;)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCondition('below')}
                        className={cn(
                          "py-2.5 rounded-xl border text-xs font-bold transition-all",
                          condition === 'below'
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                            : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        Abaixo de (&le;)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Preço Alvo ({currSymbol})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        {currSymbol}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={targetPriceInput}
                        onChange={(e) => setTargetPriceInput(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-3 bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm dark:text-white"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-500 flex items-center gap-1.5 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      {loading ? 'Salvando...' : 'Salvar Alerta'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
