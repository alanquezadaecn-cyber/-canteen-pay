import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const Impersonate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const t = searchParams.get('t');
    const to = searchParams.get('to') || '/admin/dashboard';

    if (!t) { navigate('/login', { replace: true }); return; }

    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      setAuth(
        {
          id: payload.sub,
          name: payload.email,
          email: payload.email,
          role: payload.role,
          balance: '0',
          qrCode: '',
          branchId: payload.branchId || '',
          companyId: payload.companyId
        },
        t,
        t
      );
      navigate(to, { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
    </div>
  );
};
