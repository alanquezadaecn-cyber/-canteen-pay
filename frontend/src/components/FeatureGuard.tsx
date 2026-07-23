import React from 'react';
import { Navigate } from 'react-router-dom';
import { useBranding, Features } from '../hooks/useBranding';
import { usePanelBase } from '../hooks/usePanelBase';

interface Props {
  feature: keyof Features;
  children: React.ReactNode;
}

// Bloquea el acceso directo por URL a una sección que el master admin deshabilitó para la empresa.
export const FeatureGuard: React.FC<Props> = ({ feature, children }) => {
  const branding = useBranding();
  const base = usePanelBase();

  if (branding?.features && branding.features[feature] === false) {
    return <Navigate to={base} replace />;
  }
  return <>{children}</>;
};
