import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode, Wallet, ShoppingCart, Check, ArrowRight,
  Smartphone, ShieldCheck, BarChart3, WifiOff, Building2, Clock
} from 'lucide-react';

const PLANS = [
  {
    name: 'PRO',
    price: '$3,000',
    period: '/mes',
    highlight: false,
    features: ['Hasta 2 sucursales', 'Comensales ilimitados', 'Panel admin + cajero + comensal', 'Reportes básicos', 'Soporte WhatsApp']
  },
  {
    name: 'LICENCIA ANUAL',
    price: '$30,000',
    period: '/año',
    highlight: true,
    badge: 'Más popular',
    features: ['Hasta 10 sucursales', 'Comensales ilimitados', 'Todos los paneles', 'Reportes avanzados', 'Soporte 3 meses gratis', 'Ahorro de $6,000 vs mensual']
  },
  {
    name: 'ENTERPRISE',
    price: '$5,500',
    period: '/mes',
    highlight: false,
    features: ['Hasta 5 sucursales', 'Comensales ilimitados', 'Todos los paneles', 'Reportes avanzados', 'Soporte prioritario 24/7']
  }
];

const STEPS = [
  { icon: Wallet, title: '1. Recarga saldo', desc: 'El comensal recarga en caja (efectivo) o desde la app. Su saldo queda listo para usar.' },
  { icon: QrCode, title: '2. Muestra su QR', desc: 'En el comedor, el comensal muestra su código QR o da su número de empleado.' },
  { icon: ShoppingCart, title: '3. Cobra al instante', desc: 'El cajero escanea, selecciona el platillo y cobra. El saldo se descuenta al momento.' }
];

const FEATURES = [
  { icon: Smartphone, title: 'App para el comensal', desc: 'Consulta saldo, QR, menú del día y su historial de consumo desde el celular.' },
  { icon: BarChart3, title: 'Reportes y corte de caja', desc: 'Cada cajero saca su corte del día; el admin ve consumo por sucursal en tiempo real.' },
  { icon: WifiOff, title: 'Funciona sin internet', desc: 'Si se cae la conexión, la caja sigue cobrando y sincroniza automáticamente al volver.' },
  { icon: Building2, title: 'Multi-sucursal', desc: 'Administra varios comedores desde un solo panel, cada uno con su propia caja.' },
  { icon: ShieldCheck, title: 'Seguro y sin efectivo', desc: 'Menos manejo de efectivo, cada movimiento queda registrado y auditable.' },
  { icon: Clock, title: 'Filas más rápidas', desc: 'Cobro en segundos por QR: menos tiempo en fila, más rotación en el comedor.' }
];

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>CashFood</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="h-10 px-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            Iniciar sesión
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-400">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 py-20 md:py-28 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-6">
            Monedero digital para comedores empresariales
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight max-w-3xl mx-auto" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
            El comedor de tu empresa, sin efectivo y sin filas
          </h1>
          <p className="text-emerald-50 text-lg mt-6 max-w-2xl mx-auto">
            CashFood digitaliza el pago en comedores industriales: los empleados recargan saldo y pagan su comida con un código QR. Rápido, seguro y con reportes en tiempo real.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">
            <a
              href="https://wa.me/528112683542?text=Hola,%20quiero%20información%20de%20CashFood%20para%20mi%20comedor"
              target="_blank" rel="noopener noreferrer"
              className="h-12 px-7 rounded-full bg-white text-emerald-700 font-bold text-sm flex items-center gap-2 hover:bg-emerald-50 transition-colors shadow-lg"
            >
              Solicitar demo <ArrowRight className="w-4 h-4" />
            </a>
            <button
              onClick={() => navigate('/login')}
              className="h-12 px-7 rounded-full bg-white/20 backdrop-blur text-white font-semibold text-sm hover:bg-white/30 transition-colors cursor-pointer"
            >
              Ya soy cliente
            </button>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>¿Cómo funciona?</h2>
          <p className="text-slate-500 mt-3">Tres pasos y el comensal ya está comiendo.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-slate-50 rounded-3xl p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-5">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>Todo lo que incluye</h2>
            <p className="text-slate-500 mt-3">Una plataforma completa para administrar tu comedor.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-3xl p-7 border border-slate-100">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>Planes</h2>
          <p className="text-slate-500 mt-3">Elige el que se ajuste al tamaño de tu operación.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 flex flex-col ${
                plan.highlight
                  ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30 md:-mt-4 md:mb-4'
                  : 'bg-white border border-slate-200'
              }`}
            >
              {plan.badge && (
                <span className="self-start px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-4">{plan.badge}</span>
              )}
              <h3 className={`text-sm font-bold uppercase tracking-wider ${plan.highlight ? 'text-emerald-100' : 'text-slate-500'}`}>{plan.name}</h3>
              <div className="mt-3 mb-6 flex items-end gap-1">
                <span className="text-4xl font-extrabold" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>{plan.price}</span>
                <span className={`text-sm mb-1 ${plan.highlight ? 'text-emerald-100' : 'text-slate-400'}`}>{plan.period}</span>
              </div>
              <ul className="space-y-3 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-white' : 'text-emerald-600'}`} />
                    <span className={plan.highlight ? 'text-emerald-50' : 'text-slate-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`https://wa.me/528112683542?text=Hola,%20me%20interesa%20el%20plan%20${encodeURIComponent(plan.name)}%20de%20CashFood`}
                target="_blank" rel="noopener noreferrer"
                className={`mt-7 h-11 rounded-full font-bold text-sm flex items-center justify-center transition-colors ${
                  plan.highlight
                    ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                Contratar
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
            ¿Listo para modernizar tu comedor?
          </h2>
          <p className="text-slate-400 mt-4">Agenda una demo sin costo y te mostramos cómo funciona con tu operación.</p>
          <a
            href="https://wa.me/528112683542?text=Hola,%20quiero%20agendar%20una%20demo%20de%20CashFood"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-8 h-12 px-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors"
          >
            Agendar demo <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">CashFood</span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} CashFood · by <span className="text-slate-300 font-semibold">th3seo.com</span>
          </p>
        </div>
      </footer>
    </div>
  );
};
