import { useEffect, useState } from 'react';
import { associationAPI } from '@/lib/api/association-api';

interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
}

const hexToHSL = (hex: string) => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lValue = Math.round(l * 100);
  
  return `${h} ${s}% ${lValue}%`;
};

export const useThemeColors = () => {
  const [colors, setColors] = useState<ThemeColors>({
    primaryColor: '#1E3A8A',
    secondaryColor: '#FFFFFF',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    try {
      const settings = await associationAPI.getSettings();
      const newColors = {
        primaryColor: settings.primaryColor || '#1E3A8A',
        secondaryColor: settings.secondaryColor || '#FFFFFF',
      };
      setColors(newColors);
      applyColorsToDocument(newColors);
    } catch (error) {
      console.error('Error loading theme colors:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyColorsToDocument = (themeColors: ThemeColors) => {
    const root = document.documentElement;
    
    // Convert primary color to HSL for CSS variables
    const primaryHSL = hexToHSL(themeColors.primaryColor);
    const secondaryHSL = hexToHSL(themeColors.secondaryColor);
    
    // Apply primary color
    root.style.setProperty('--primary', primaryHSL);
    
    // Create variations for different UI elements
    // Slightly lighter for hover states
    const primaryHex = themeColors.primaryColor;
    const r = parseInt(primaryHex.slice(1, 3), 16);
    const g = parseInt(primaryHex.slice(3, 5), 16);
    const b = parseInt(primaryHex.slice(5, 7), 16);
    
    // Calculate relative luminance to determine if we need light or dark text
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // If background is light (luminance > 0.5), use dark text, otherwise use light text
    const foregroundColor = luminance > 0.5 ? '0 0% 10%' : '0 0% 98%';
    root.style.setProperty('--primary-foreground', foregroundColor);
    
    // Lighter version for accent
    const lighterR = Math.min(255, r + 30);
    const lighterG = Math.min(255, g + 30);
    const lighterB = Math.min(255, b + 30);
    const lighterHex = `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
    const accentHSL = hexToHSL(lighterHex);
    
    root.style.setProperty('--accent', accentHSL);
    
    // Apply to sidebar
    root.style.setProperty('--sidebar-primary', primaryHSL);
    root.style.setProperty('--sidebar-accent', accentHSL);
  };

  const updateColors = async (newColors: ThemeColors) => {
    setColors(newColors);
    applyColorsToDocument(newColors);
  };

  return {
    colors,
    loading,
    updateColors,
    reloadColors: loadColors,
  };
};
