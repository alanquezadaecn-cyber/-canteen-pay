import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Branding {
  name: string | null;
  logoUrl: string | null;
}

let cache: Branding | null = null;

export function useBranding() {
  const [branding, setBranding] = useState<Branding | null>(cache);

  useEffect(() => {
    if (cache) return;
    api.get('/branding')
      .then(({ data }) => { cache = data; setBranding(data); })
      .catch(() => {});
  }, []);

  return branding;
}
