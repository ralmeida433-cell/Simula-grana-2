const fs = require('fs');

// Patch AlertMonitor
let code = fs.readFileSync('src/components/AlertMonitor.tsx', 'utf8');
code = code.replace("import { fetchFinanceData } from '../services/financeService';", "");
code = code.replace("const data = await fetchFinanceData(ticker);", `const response = await fetch(\`/api/fin/\${ticker}\`);\n            if (!response.ok) continue;\n            const { result, error } = await response.json();\n            if (error || !result || !result[0]) continue;\n            const data = result[0];`);
fs.writeFileSync('src/components/AlertMonitor.tsx', code);

// Patch Alerts
let alertsCode = fs.readFileSync('src/components/Alerts.tsx', 'utf8');
alertsCode = alertsCode.replace("import { fetchFinanceData } from '../services/financeService';", "");
alertsCode = alertsCode.replace("const data = await fetchFinanceData(ticker);", `const response = await fetch(\`/api/fin/\${ticker}\`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const { result, err } = await response.json();
      if (err || !result || !result[0]) {
        setError('Ativo não encontrado. Verifique o ticker (ex: PETR4.SA, AAPL).');
        setLoading(false);
        return;
      }
      const data = result[0];`);
alertsCode = alertsCode.replace("import { Bell, BellOff, Search, Plus, Trash2, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';", "import { Bell, BellOff, Search, Plus, Trash2, ArrowUpRight, ArrowDownRight, AlertTriangle, DollarSign } from 'lucide-react';");

fs.writeFileSync('src/components/Alerts.tsx', alertsCode);
