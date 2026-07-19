/**
 * Service for loading and caching company logos for both Brazilian (B3) and US (NYSE, NASDAQ, AMEX) markets.
 * It uses the secure server-side endpoint /api/fin/logo/:ticker to keep API keys hidden.
 */

// Simple local cache to prevent redundant fetch calls during the application session
const logoCache: Record<string, string> = {};

/**
 * Detects if a ticker belongs to the Brazilian market (B3) or US markets.
 * @param symbol The stock ticker/symbol (e.g., 'VALE3', 'AAPL', 'PETR4.SA')
 */
export function isBrazilianTicker(symbol: string): boolean {
  const clean = symbol.trim().toUpperCase();
  return clean.endsWith('.SA') || /^[A-Z]{4}[0-9]{1,2}$/.test(clean);
}

/**
 * Safely fetches a company logo URL asynchronously from the server proxy.
 * This function automatically supports caching and handles both Brazilian and US tickers.
 * 
 * @param symbol The stock ticker/symbol (e.g., 'AAPL', 'VALE3')
 * @returns A promise resolving to the logo URL
 */
export async function getCompanyLogo(symbol: string): Promise<string> {
  const cleanSymbol = symbol.trim().toUpperCase();
  
  if (!cleanSymbol) {
    return '';
  }

  // Check memory cache first
  if (logoCache[cleanSymbol]) {
    return logoCache[cleanSymbol];
  }

  try {
    const response = await fetch(`/api/fin/logo/${encodeURIComponent(cleanSymbol)}`);
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    const data = await response.json();
    if (data && data.logoUrl) {
      logoCache[cleanSymbol] = data.logoUrl;
      return data.logoUrl;
    }
  } catch (error) {
    console.warn(`Error fetching logo for ${cleanSymbol} from API, using default fallback:`, error);
  }

  // Final client-side fallback if backend call fails or is unavailable
  const fallbackUrl = isBrazilianTicker(cleanSymbol)
    ? `https://icons.brapi.dev/icons/${cleanSymbol.replace('.SA', '')}.svg`
    : `https://s3-symbol-logo.tradingview.com/${cleanSymbol.toLowerCase()}--big.svg`;

  logoCache[cleanSymbol] = fallbackUrl;
  return fallbackUrl;
}
