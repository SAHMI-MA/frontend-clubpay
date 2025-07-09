"use client"

import { LanguageProvider } from './language-context'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Simple provider without complex initialization logic to prevent loops
  return <LanguageProvider>{children}</LanguageProvider>
}
