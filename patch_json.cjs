const fs = require('fs');
const glob = require('glob');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // We can look for specific files
}

// For Pesquisa.tsx
let pesquisa = fs.readFileSync('src/components/Pesquisa.tsx', 'utf-8');
pesquisa = pesquisa.replace(
  /const res = await fetch\(`\/api\/fin\/search\/\$\{encodeURIComponent\(query\)\}`\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);/g,
  `const res = await fetch(\`/api/fin/search/\${encodeURIComponent(query)}\`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (!contentType || contentType.indexOf("application/json") === -1) return;
          const data = await res.json();`
);

pesquisa = pesquisa.replace(
  /const response = await fetch\(`\/api\/companies\/\$\{ticker\}\/announcements`\);\s*if \(\!response\.ok\) \{/g,
  `const response = await fetch(\`/api/companies/\${ticker}/announcements\`);
      const contentType = response.headers.get("content-type");
      if (response.ok && (!contentType || contentType.indexOf("application/json") === -1)) throw new Error("Server returned HTML");
      if (!response.ok) {`
);

fs.writeFileSync('src/components/Pesquisa.tsx', pesquisa);

// For FundamentalAnalysis.tsx
let funda = fs.readFileSync('src/components/FundamentalAnalysis.tsx', 'utf-8');
funda = funda.replace(
  /const response = await fetch\(`\/api\/companies\/\$\{cleanTicker\}\/announcements`\);\s*if \(\!response\.ok\) \{/g,
  `const response = await fetch(\`/api/companies/\${cleanTicker}/announcements\`);
      const contentType = response.headers.get("content-type");
      if (response.ok && (!contentType || contentType.indexOf("application/json") === -1)) throw new Error("Server returned HTML");
      if (!response.ok) {`
);
funda = funda.replace(
  /const res = await fetch\(`\/api\/fin\/search\/\$\{encodeURIComponent\(ticker\)\}`\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);/g,
  `const res = await fetch(\`/api/fin/search/\${encodeURIComponent(ticker)}\`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (!contentType || contentType.indexOf("application/json") === -1) return;
          const data = await res.json();`
);
fs.writeFileSync('src/components/FundamentalAnalysis.tsx', funda);

// For FiiAnalysis.tsx
let fii = fs.readFileSync('src/components/FiiAnalysis.tsx', 'utf-8');
fii = fii.replace(
  /const response = await fetch\(`\/api\/companies\/\$\{cleanTicker\}\/announcements`\);\s*if \(\!response\.ok\) \{/g,
  `const response = await fetch(\`/api/companies/\${cleanTicker}/announcements\`);
      const contentType = response.headers.get("content-type");
      if (response.ok && (!contentType || contentType.indexOf("application/json") === -1)) throw new Error("Server returned HTML");
      if (!response.ok) {`
);
fii = fii.replace(
  /const res = await fetch\(`\/api\/fin\/search\/\$\{encodeURIComponent\(ticker\)\}`\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);/g,
  `const res = await fetch(\`/api/fin/search/\${encodeURIComponent(ticker)}\`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (!contentType || contentType.indexOf("application/json") === -1) return;
          const data = await res.json();`
);
fs.writeFileSync('src/components/FiiAnalysis.tsx', fii);



// BarsiCalculator.tsx
let barsi = fs.readFileSync('src/components/calculators/BarsiCalculator.tsx', 'utf-8');
barsi = barsi.replace(
  /const res = await fetch\(`\/api\/fin\/search\/\$\{encodeURIComponent\(ticker\)\}`\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);/g,
  `const res = await fetch(\`/api/fin/search/\${encodeURIComponent(ticker)}\`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (!contentType || contentType.indexOf("application/json") === -1) return;
          const data = await res.json();`
);
fs.writeFileSync('src/components/calculators/BarsiCalculator.tsx', barsi);

// BazinCalculator.tsx
let bazin = fs.readFileSync('src/components/calculators/BazinCalculator.tsx', 'utf-8');
bazin = bazin.replace(
  /const res = await fetch\(`\/api\/fin\/search\/\$\{encodeURIComponent\(ticker\)\}`\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);/g,
  `const res = await fetch(\`/api/fin/search/\${encodeURIComponent(ticker)}\`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (!contentType || contentType.indexOf("application/json") === -1) return;
          const data = await res.json();`
);
fs.writeFileSync('src/components/calculators/BazinCalculator.tsx', bazin);

// GrahamCalculator.tsx
let graham = fs.readFileSync('src/components/calculators/GrahamCalculator.tsx', 'utf-8');
graham = graham.replace(
  /const res = await fetch\(`\/api\/fin\/search\/\$\{encodeURIComponent\(ticker\)\}`\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);/g,
  `const res = await fetch(\`/api/fin/search/\${encodeURIComponent(ticker)}\`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (!contentType || contentType.indexOf("application/json") === -1) return;
          const data = await res.json();`
);
fs.writeFileSync('src/components/calculators/GrahamCalculator.tsx', graham);

