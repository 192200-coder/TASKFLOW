// src/components/layout/ThemeProvider.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ 
  children, 
  ...props 
}: {
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem 
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}