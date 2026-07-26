"use client";

// Kompaniya valyutasini client komponentlarга yetkazuvchi kontekst.
// Server (dashboard/layout.tsx) org.currency ni o'qib, Provider bilan uzatadi.
// Konvertatsiya yo'q — faqat ko'rsatiladigan belgi (so'm / $) o'zgaradi.

import { createContext, useContext } from "react";

const CurrencyContext = createContext<string>("UZS");

export function CurrencyProvider({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): string {
  return useContext(CurrencyContext);
}
