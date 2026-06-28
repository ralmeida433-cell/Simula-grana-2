const { type, sector, minPL, maxPL, minDY, maxDY, minPVP, maxPVP, minMarketCap, maxMarketCap, minChange, maxChange, maxVacancia, minROE } = { type: 'all', sector: 'all', minPL: -50, maxPL: 50, minDY: 0, maxDY: 20, minPVP: 0, maxPVP: 5, minMarketCap: 0, maxMarketCap: 500000000000, minChange: -10, maxChange: 10, maxVacancia: 100, minROE: -50 };
const filters = { minPL, maxPL, minDY, maxDY, minPVP, maxPVP, minMarketCap, maxMarketCap, minChange, maxChange, maxVacancia, minROE };
const stocks = [
  { isFii: false, priceEarnings: 10, dividendYield: 5, priceToBook: 2, market_cap: 1000, change: 1, vacancia: null, roe: 10 },
  { isFii: true, priceEarnings: null, dividendYield: 10, priceToBook: 1, market_cap: 1000, change: 1, vacancia: 10, roe: null }
];

const checkMin = (val, minLimit, defaultMin) => minLimit === defaultMin || val >= minLimit;
const checkMax = (val, maxLimit, defaultMax) => maxLimit === defaultMax || val <= maxLimit;

const isMissingAndRequired = (val, min, max, defaultMin, defaultMax) => {
  if (min === defaultMin && max === defaultMax) return false;
  return val === null;
};

const result = stocks.filter(a => {
  const isFii = a.isFii;
  const pe = a.priceEarnings ?? null;
  const dy = a.dividendYield ?? null;
  const pvp = a.priceToBook ?? null;
  const mc = a.market_cap ?? 0;
  const ch = a.change ?? 0;
  const vacancia = a.vacancia ?? null;
  const roe = a.roe ?? null;

  if (isMissingAndRequired(dy, filters.minDY, filters.maxDY, 0, 20)) return console.log('dy missing', a), false;
  if (dy !== null && (!checkMin(dy, filters.minDY, 0) || !checkMax(dy, filters.maxDY, 20))) return console.log('dy err', a), false;

  if (isMissingAndRequired(pvp, filters.minPVP, filters.maxPVP, 0, 5)) return console.log('pvp missing', a), false;
  if (pvp !== null && (!checkMin(pvp, filters.minPVP, 0) || !checkMax(pvp, filters.maxPVP, 5))) return console.log('pvp err', a), false;

  if (!checkMin(mc, filters.minMarketCap, 0) || !checkMax(mc, filters.maxMarketCap, 500000000000)) return console.log('mc err', a), false;
  if (!checkMin(ch, filters.minChange, -10) || !checkMax(ch, filters.maxChange, 10)) return console.log('ch err', a), false;

  if (isFii) {
    if (isMissingAndRequired(vacancia, 0, filters.maxVacancia, 0, 100)) return console.log('vac missing', a), false;
    if (vacancia !== null && !checkMax(vacancia, filters.maxVacancia, 100)) return console.log('vac err', a), false;
    return true;
  }

  if (isMissingAndRequired(pe, filters.minPL, filters.maxPL, -50, 50)) return console.log('pe missing', a), false;
  if (pe !== null && (!checkMin(pe, filters.minPL, -50) || !checkMax(pe, filters.maxPL, 50))) return console.log('pe err', a), false;

  if (isMissingAndRequired(roe, filters.minROE, 100, -50, 100)) return console.log('roe missing', a), false;
  if (roe !== null && !checkMin(roe, filters.minROE, -50)) return console.log('roe err', a), false;

  return true;
});
console.log(result.length);
