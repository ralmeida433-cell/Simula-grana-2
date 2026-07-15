const fs = require('fs');
let code = fs.readFileSync('src/components/Alerts.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\n    const saved = localStorage.getItem\('simulagrana_alerts'\);\n    if \(saved\) \{\n      try \{\n        setAlerts\(JSON.parse\(saved\)\);\n      \} catch \(e\) \{\n        console.error\('Failed to parse alerts', e\);\n      \}\n    \}\n  \}, \[\]\);/

const newEffect = `useEffect(() => {
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
  }, []);`;

code = code.replace(regex, newEffect);
fs.writeFileSync('src/components/Alerts.tsx', code);
