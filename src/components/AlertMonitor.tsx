import React, { useEffect, useRef } from 'react';
import { fetchFinanceData } from '../services/financeService';

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

export default function AlertMonitor() {
  const lastCheck = useRef<number>(0);

  useEffect(() => {
    // Request permission on mount
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const checkAlerts = async () => {
      const now = Date.now();
      // Only check every 1 minute to avoid rate limits
      if (now - lastCheck.current < 60000) return;
      
      const saved = localStorage.getItem('simulagrana_alerts');
      if (!saved) return;

      try {
        const alerts: Alert[] = JSON.parse(saved);
        const activeAlerts = alerts.filter(a => a.active);
        
        if (activeAlerts.length === 0) return;
        lastCheck.current = now;

        // Group by ticker to avoid fetching same ticker multiple times
        const tickersToFetch = [...new Set(activeAlerts.map(a => a.ticker))];
        
        for (const ticker of tickersToFetch) {
          try {
            const data = await fetchFinanceData(ticker);
            if (!data) continue;

            const currentPrice = data.regularMarketPrice;
            if (typeof currentPrice !== 'number') continue;

            // Check alerts for this ticker
            const tickerAlerts = activeAlerts.filter(a => a.ticker === ticker);
            let updatedAlerts = false;
            let currentAlertsList = JSON.parse(localStorage.getItem('simulagrana_alerts') || '[]');

            for (const alert of tickerAlerts) {
              let triggered = false;
              if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
                triggered = true;
              } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
                triggered = true;
              }

              if (triggered) {
                // Show notification
                if (Notification.permission === 'granted') {
                  const currStr = alert.currency === 'USD' ? '$' : 'R$';
                  new Notification(`Alerta: ${alert.ticker}`, {
                    body: `O ativo ${alert.ticker} atingiu ${currStr} ${currentPrice.toFixed(2)} (Seu alvo: ${currStr} ${alert.targetPrice.toFixed(2)})`,
                    icon: '/icon.png',
                    tag: `alert-${alert.id}-${Date.now()}`
                  });
                }
                
                // Deactivate the alert so it doesn't trigger again immediately
                currentAlertsList = currentAlertsList.map((a: Alert) => 
                  a.id === alert.id ? { ...a, active: false } : a
                );
                updatedAlerts = true;
              }
            }

            if (updatedAlerts) {
              localStorage.setItem('simulagrana_alerts', JSON.stringify(currentAlertsList));
              // Dispatch event so Alerts UI updates if open
              window.dispatchEvent(new Event('storage'));
            }

          } catch (e) {
            console.error(`Failed to fetch data for ${ticker} in alert monitor`, e);
          }
        }
      } catch (e) {
        console.error('Failed to parse alerts in monitor', e);
      }
    };

    // Check immediately and then every minute
    checkAlerts();
    const intervalId = setInterval(checkAlerts, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return null; // This is a background component
}
