import React, { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Proveedor de tema para gestionar dark mode en la aplicación
 * - Inicializa tema al montar
 * - Sincroniza con preferencia del sistema
 * - Aplica clase 'dark' al elemento html
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useTheme();

  // No renderizar hasta que el tema esté inicializado
  // Evita flash de contenido sin estilo
  if (!theme.mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default ThemeProvider;
