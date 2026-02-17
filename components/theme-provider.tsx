"use client";

import { useThemeColors } from '@/hooks/use-theme-colors';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { loading } = useThemeColors();

  // Colors are automatically applied by the hook
  if (loading) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
