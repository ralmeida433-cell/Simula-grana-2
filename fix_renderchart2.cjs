const fs = require('fs');
const content = fs.readFileSync('src/components/Pesquisa.tsx', 'utf-8');

const startMarker = 'const renderChart = useMemo(() => {';
const endMarker = '}, [history]);';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex === -1 || endIndex === -1) {
  console.log('Markers not found!');
  process.exit(1);
}

const newBlock = `const renderChart = useMemo(() => {
    if (history.length < 2) return null;
    const prices = history.map((h: any) => h.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return (
      <div className="w-full h-[180px] mt-4 relative bg-muted/30 rounded-xl border border-border p-2">
        <div className="absolute top-2 left-3 flex flex-col z-10">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Evolução 6 Meses</span>
        </div>
        <div className="w-full h-full pt-6 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                content={<CustomOHLCTooltip />} 
                cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke="var(--primary)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorClose)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] text-muted-foreground font-mono z-10 pointer-events-none">
          <span>Mín: <AssetPrice price={min} /></span>
          <span>Máx: <AssetPrice price={max} /></span>
        </div>
      </div>
    );
  }, [history]);`;

const newContent = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
fs.writeFileSync('src/components/Pesquisa.tsx', newContent);
console.log('Fixed renderChart block!');
