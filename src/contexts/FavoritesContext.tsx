import React, { createContext, useContext, useState, useEffect } from 'react';

export type AssetCategory = 'Ações BR' | 'Ações EUA' | 'ETFs' | 'FIIs' | 'REITs';

export interface FavoriteAsset {
  ticker: string;
  name: string;
  category: AssetCategory;
  favoritedAt: string; // ISO date string
  priceAtFavoritation: number;
  currency: 'BRL' | 'USD';
}

interface FavoritesContextType {
  favorites: FavoriteAsset[];
  addFavorite: (asset: Omit<FavoriteAsset, 'favoritedAt'>) => void;
  removeFavorite: (ticker: string) => void;
  isFavorite: (ticker: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteAsset[]>(() => {
    const saved = localStorage.getItem('simulagrana_favorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse favorites', e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('simulagrana_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (asset: Omit<FavoriteAsset, 'favoritedAt'>) => {
    setFavorites(prev => {
      if (prev.some(f => f.ticker === asset.ticker)) return prev;
      return [...prev, { ...asset, favoritedAt: new Date().toISOString() }];
    });
  };

  const removeFavorite = (ticker: string) => {
    setFavorites(prev => prev.filter(f => f.ticker !== ticker));
  };

  const isFavorite = (ticker: string) => {
    return favorites.some(f => f.ticker === ticker);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
