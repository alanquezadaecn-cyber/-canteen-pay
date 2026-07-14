import React from 'react';

interface State { hasError: boolean; message: string }

// Evita la pantalla en blanco: si algún componente lanza un error no capturado,
// muestra un fallback con opción de recargar en vez de dejar la página vacía.
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Error inesperado' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary capturó:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-1">Algo salió mal</h1>
            <p className="text-sm text-slate-500 mb-6">La página tuvo un problema. Recárgala para continuar.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
