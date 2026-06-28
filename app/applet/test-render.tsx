import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../../src/App.tsx';
import { FinanceProvider } from '../../src/contexts/FinanceContext.tsx';
import { AuthProvider } from '../../src/contexts/AuthContext.tsx';

try {
  let oldError = console.error;
  console.error = (...args) => {
    if(typeof args[0] === 'string' && args[0].includes('Encountered two children with the same key')) {
      console.log('REACT ERROR INTERCEPTED:', args);
      try { throw new Error('trace'); } catch(e) { console.log(e.stack); }
    }
    oldError(...args);
  };
  const html = renderToString(
    <AuthProvider>
      <FinanceProvider initialData={{} as any} isLoading={false}>
        <App />
      </FinanceProvider>
    </AuthProvider>
  );
  console.log("Rendered successfully. Length:", html.length);
} catch (err) {
  console.error("Render error:", err);
}
