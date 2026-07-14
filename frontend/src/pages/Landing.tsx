import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Landing recreada pixel-perfect del diseño "CashFood Landing" (Claude Design).
// Fuentes: Poppins (títulos) + Manrope (cuerpo). Verde marca #0F9D64 / #0C2A20.

const WA = '5218112683542'; // WhatsApp de contacto

const PLANS = [
  {
    name: 'Básico', price: '$3,000', strikePrice: null as string | null, period: 'MXN /mes', popular: false,
    bg: 'white', border: '1px solid #ECE9E2', shadow: '0 2px 8px rgba(15,40,30,0.04)',
    accent: '#0F9D64', textColor: '#0C2A20', subTextColor: '#4B5F58', btnBg: '#0F9D64', btnText: 'white',
    items: ['1 comedor', 'Empresa con un solo comedor', 'Panel admin + cajero + comensal', 'Reportes básicos', 'Soporte WhatsApp']
  },
  {
    name: 'Pro', price: '$6,000', strikePrice: null, period: 'MXN /mes', popular: true,
    bg: '#0C2A20', border: '1px solid #0C2A20', shadow: '0 24px 48px rgba(12,42,32,0.30)',
    accent: '#5EE6A8', textColor: 'white', subTextColor: 'rgba(255,255,255,0.82)', btnBg: 'white', btnText: '#0C2A20',
    items: ['Hasta 3 sucursales', 'Multi-planta / crecimiento', 'Comensales ilimitados', 'Todos los paneles', 'Reportes avanzados']
  },
  {
    name: 'Licencia anual', price: '$30,000', strikePrice: '$50,000 MXN', period: 'MXN /año', popular: false,
    bg: 'white', border: '1px solid #ECE9E2', shadow: '0 2px 8px rgba(15,40,30,0.04)',
    accent: '#0F9D64', textColor: '#0C2A20', subTextColor: '#4B5F58', btnBg: '#0F9D64', btnText: 'white',
    items: ['Hasta 10 sucursales', 'Ahorro pagando anual', 'Comensales ilimitados', 'Todos los paneles', 'Soporte 3 meses gratis']
  },
  {
    name: 'Enterprise', price: 'Cotización', strikePrice: null, period: '', popular: false,
    bg: 'white', border: '1px solid #ECE9E2', shadow: '0 2px 8px rgba(15,40,30,0.04)',
    accent: '#0F9D64', textColor: '#0C2A20', subTextColor: '#4B5F58', btnBg: '#0F9D64', btnText: 'white',
    items: ['Sucursales ilimitadas', 'Corporativo grande', 'Comensales ilimitados', 'Todos los paneles', 'Soporte prioritario 24/7']
  }
];

const FEATURES = [
  { title: 'App para el comensal', desc: 'Consulta saldo, QR, menú del día y su historial de consumo desde el celular.',
    icon: <><rect x="2" y="6" width="20" height="14" rx="3" stroke="#0F9D64" strokeWidth="2" /><circle cx="16" cy="13" r="2" fill="#0F9D64" /></> },
  { title: 'Reportes y corte de caja', desc: 'Cada cajero saca su corte del día; el admin ve consumo por sucursal en tiempo real.',
    icon: <path d="M4 20V10M12 20V4M20 20v-7" stroke="#0F9D64" strokeWidth="2" strokeLinecap="round" /> },
  { title: 'Funciona sin internet', desc: 'Si se cae la conexión, la caja sigue cobrando y sincroniza automáticamente al volver.',
    icon: <><path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0" stroke="#0F9D64" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="19" r="1.4" fill="#0F9D64" /></> },
  { title: 'Multi-sucursal', desc: 'Administra varios comedores desde un solo panel, cada uno con su propia caja.',
    icon: <><rect x="4" y="3" width="16" height="18" rx="1" stroke="#0F9D64" strokeWidth="2" /><path d="M8 8h1M8 12h1M8 16h1M15 8h1M15 12h1M15 16h1" stroke="#0F9D64" strokeWidth="2" strokeLinecap="round" /></> },
  { title: 'Seguro y sin efectivo', desc: 'Menos manejo de efectivo, cada movimiento queda registrado y auditable.',
    icon: <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" stroke="#0F9D64" strokeWidth="2" strokeLinejoin="round" /> },
  { title: 'Filas más rápidas', desc: 'Cobro en segundos por QR: menos tiempo en fila, más rotación en el comedor.',
    icon: <><circle cx="12" cy="12" r="9" stroke="#0F9D64" strokeWidth="2" /><path d="M12 7v5l3 3" stroke="#0F9D64" strokeWidth="2" strokeLinecap="round" /></> },
];

const STEPS = [
  { n: '1', dark: false, title: 'Recarga saldo', desc: 'El comensal recarga en caja (efectivo) o desde la app. Su saldo queda listo para usar.' },
  { n: '2', dark: false, title: 'Muestra su QR', desc: 'En el comedor, el comensal muestra su código QR o da su número de empleado.' },
  { n: '3', dark: true, title: 'Cobra al instante', desc: 'El cajero escanea, selecciona el platillo y cobra. El saldo se descuenta al momento.' },
];

const Logo: React.FC<{ size?: number }> = ({ size = 42 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: 'linear-gradient(150deg,#14B583 0%,#0B7C56 65%,#0A6E4C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: '0 4px 12px rgba(11,124,86,0.35), inset 0 1px 0 rgba(255,255,255,0.18)' }}>
    <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none">
      <path d="M16.5 7.2a6 6 0 1 0 0 9.6" stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <rect x="14.6" y="10.6" width="3.1" height="3.1" rx="0.7" fill="#8FF0C4" />
    </svg>
  </div>
);

const Wordmark: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: size, letterSpacing: '-0.02em' }}>
    <span style={{ color: '#0C2A20' }}>Cash</span><span style={{ color: '#0F9D64' }}>Food</span>
  </span>
);

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ empresa: '', nombre: '', correo: '', telefono: '' });
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = () => {
    const msg = `Hola, solicito una demo de CashFood.%0A%0AEmpresa: ${form.empresa}%0AContacto: ${form.nombre}%0ACorreo: ${form.correo}%0ATeléfono: ${form.telefono}`;
    window.open(`https://wa.me/${WA}?text=${msg}`, '_blank');
    setSubmitted(true);
  };

  const bg = `#FBFAF7
    radial-gradient(1100px 700px at 88% 2%, rgba(15,157,100,0.17), transparent 60%)
    ,radial-gradient(900px 600px at -5% 12%, rgba(46,217,150,0.13), transparent 55%)
    ,radial-gradient(900px 650px at 96% 38%, rgba(15,157,100,0.12), transparent 58%)
    ,radial-gradient(1000px 700px at 4% 58%, rgba(94,230,168,0.11), transparent 55%)
    ,radial-gradient(1100px 750px at 90% 78%, rgba(11,124,86,0.10), transparent 58%)
    ,radial-gradient(900px 600px at 15% 96%, rgba(12,42,32,0.07), transparent 55%)`;

  return (
    <div style={{ fontFamily: "'Manrope',sans-serif", color: '#10241C', width: '100%', overflowX: 'hidden', position: 'relative', background: bg }}>
      <style>{`
        .cf-btn { transition: transform .15s ease, box-shadow .15s ease, background .15s ease; cursor:pointer; }
        .cf-btn:hover { transform: translateY(-2px); }
        .cf-card { transition: transform .2s ease, box-shadow .2s ease; }
        .cf-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(12,42,32,0.10); }
        .cf-in:focus { outline: 2px solid #34C98D; outline-offset: 1px; }
        @media (max-width: 860px) { .cf-split { grid-template-columns: 1fr !important; } .cf-nav-link { display: none !important; } }
      `}</style>

      {/* Formas decorativas */}
      <div style={{ position: 'absolute', top: 64, right: '6%', width: 230, height: 230, border: '2px solid rgba(15,157,100,0.16)', borderRadius: 32, transform: 'rotate(18deg)', pointerEvents: 'none', zIndex: -1 }} />
      <div style={{ position: 'absolute', top: 340, left: '2%', width: 150, height: 150, border: '2px solid rgba(15,157,100,0.14)', borderRadius: '50%', pointerEvents: 'none', zIndex: -1 }} />

      {/* NAV */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(251,250,247,0.88)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(16,36,28,0.07)' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo /><Wordmark />
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
            <a href="#como-funciona" className="cf-nav-link" style={{ fontSize: 14.5, fontWeight: 600, color: '#3A4F47', whiteSpace: 'nowrap' }}>Cómo funciona</a>
            <a href="#incluye" className="cf-nav-link" style={{ fontSize: 14.5, fontWeight: 600, color: '#3A4F47', whiteSpace: 'nowrap' }}>Incluye</a>
            <a href="#planes" className="cf-nav-link" style={{ fontSize: 14.5, fontWeight: 600, color: '#3A4F47', whiteSpace: 'nowrap' }}>Planes</a>
            <button onClick={() => navigate('/login')} className="cf-btn" style={{ background: '#0F9D64', color: 'white', fontWeight: 700, fontSize: 14.5, padding: '11px 22px', borderRadius: 999, border: 'none', boxShadow: '0 6px 16px rgba(15,157,100,0.28)', whiteSpace: 'nowrap' }}>Iniciar sesión</button>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{ position: 'relative', padding: '76px 28px 40px', maxWidth: 1220, margin: '0 auto' }}>
        <div className="cf-split" style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 56, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 'fit-content' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0F9D64', flex: 'none' }} />
              <span style={{ color: '#0A7A52', fontWeight: 700, fontSize: 13.5, letterSpacing: '0.03em' }}>Monedero digital para comedores empresariales</span>
            </div>
            <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 'clamp(36px,4.6vw,54px)', lineHeight: 1.08, letterSpacing: '-0.02em', color: '#0C2A20', margin: 0 }}>El comedor de tu empresa, pagado con un QR en segundos</h1>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: '#4B5F58', maxWidth: 520, margin: 0 }}>CashFood digitaliza el pago en comedores industriales: los empleados recargan saldo y pagan su comida con un código QR. Rápido, seguro y con reportes en tiempo real.</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
              <a href="#contacto" className="cf-btn" style={{ background: '#0F9D64', color: 'white', fontWeight: 700, fontSize: 16, padding: '16px 28px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 12px 26px rgba(15,157,100,0.3)' }}>Solicitar demo <span>→</span></a>
              <button onClick={() => navigate('/login')} className="cf-btn" style={{ background: 'white', border: '1.5px solid #DCE7E1', color: '#0C2A20', fontWeight: 700, fontSize: 16, padding: '16px 28px', borderRadius: 999 }}>Ya soy cliente</button>
            </div>
            <div style={{ display: 'flex', gap: 32, marginTop: 18, flexWrap: 'wrap' }}>
              {[['70%', 'menos tiempo en fila'], ['100%', 'trazabilidad de cobros'], ['< 1 sem', 'para implementar']].map(([a, b]) => (
                <div key={b}><div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 26, color: '#0C2A20' }}>{a}</div><div style={{ fontSize: 13.5, color: '#6B7C75' }}>{b}</div></div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -18, background: 'linear-gradient(155deg,#0F9D64,#2ED996)', borderRadius: 32, opacity: 0.14, filter: 'blur(2px)' }} />
            <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', boxShadow: '0 30px 60px rgba(12,42,32,0.18)', aspectRatio: '4/5' }}>
              <img src="/landing/hero-qr-pago.jpg" alt="Empleado pagando con QR" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ position: 'absolute', bottom: -22, left: -22, background: 'white', borderRadius: 16, padding: '16px 20px', boxShadow: '0 18px 34px rgba(12,42,32,0.18)', display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0F9D64', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="white" strokeWidth="2" /><rect x="14" y="3" width="7" height="7" stroke="white" strokeWidth="2" /><rect x="3" y="14" width="7" height="7" stroke="white" strokeWidth="2" /></svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, whiteSpace: 'nowrap' }}>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14.5, color: '#0C2A20', lineHeight: 1.3 }}>Pago confirmado</div>
                <div style={{ fontSize: 12.5, color: '#6B7C75', lineHeight: 1.3 }}>Saldo: $185.00</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{ maxWidth: 1220, margin: '0 auto', padding: '140px 28px 40px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto 60px', textAlign: 'center' }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '0.08em', color: '#0F9D64', textTransform: 'uppercase', margin: '0 0 10px' }}>Proceso</p>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 'clamp(28px,3.6vw,38px)', color: '#0C2A20', margin: '0 0 12px', letterSpacing: '-0.01em' }}>¿Cómo funciona?</h2>
          <p style={{ fontSize: 17, color: '#4B5F58', margin: 0 }}>Tres pasos y el comensal ya está comiendo.</p>
        </div>
        <div className="cf-split" style={{ display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 56, alignItems: 'center' }}>
          <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', aspectRatio: '4/3' }}>
            <img src="/landing/servir-comida.webp" alt="Sirviendo comida en el comedor" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 18, alignItems: 'flex-start', background: s.dark ? '#0F9D64' : 'white', border: s.dark ? '1px solid #0F9D64' : '1px solid #ECE9E2', borderRadius: 18, padding: '22px 24px' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: s.dark ? 'white' : '#0C2A20', color: s.dark ? '#0F9D64' : 'white', fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{s.n}</div>
                <div>
                  <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 18, color: s.dark ? 'white' : '#0C2A20', margin: '0 0 6px' }}>{s.title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: s.dark ? 'rgba(255,255,255,0.92)' : '#4B5F58', margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TODO LO QUE INCLUYE */}
      <section id="incluye" style={{ position: 'relative', margin: '120px 0 0', padding: '120px 28px 100px', background: 'linear-gradient(180deg, rgba(230,247,238,0.7) 0%, rgba(230,247,238,0.35) 100%)' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto' }}>
          <div style={{ maxWidth: 640, margin: '0 auto 56px', textAlign: 'center' }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '0.08em', color: '#0F9D64', textTransform: 'uppercase', margin: '0 0 10px' }}>Plataforma</p>
            <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 'clamp(28px,3.6vw,38px)', color: '#0C2A20', margin: '0 0 12px', letterSpacing: '-0.01em' }}>Todo lo que incluye</h2>
            <p style={{ fontSize: 17, color: '#4B5F58', margin: 0 }}>Una plataforma completa para administrar tu comedor.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 22 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="cf-card" style={{ background: 'white', border: '1px solid #ECE9E2', borderRadius: 18, padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: '#E6F7EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">{f.icon}</svg>
                </div>
                <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 17, color: '#0C2A20', margin: 0 }}>{f.title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#4B5F58', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMAGEN FULL BLEED */}
      <section style={{ maxWidth: 1220, margin: '140px auto 0', padding: '0 28px' }}>
        <div style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', aspectRatio: '21/9' }}>
          <img src="/landing/comedor-industrial.webp" alt="Comedor industrial a la hora de comida" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.45), rgba(0,0,0,0) 45%)' }} />
          <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[['+40,000', 'comensales al día'], ['−90%', 'menor pérdida o faltante en caja']].map(([a, b]) => (
              <div key={b} style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px)', borderRadius: 14, padding: '16px 20px', minWidth: 160 }}>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 22, color: '#0C2A20' }}>{a}</div>
                <div style={{ fontSize: 12.5, color: '#4B5F58' }}>{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" style={{ maxWidth: 1220, margin: '0 auto', padding: '140px 28px 40px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto 56px', textAlign: 'center' }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '0.08em', color: '#0F9D64', textTransform: 'uppercase', margin: '0 0 10px' }}>Precios</p>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 'clamp(28px,3.6vw,38px)', color: '#0C2A20', margin: '0 0 12px', letterSpacing: '-0.01em' }}>Planes</h2>
          <p style={{ fontSize: 17, color: '#4B5F58', margin: 0 }}>Elige el plan según el tamaño de tu operación.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 22, alignItems: 'stretch' }}>
          {PLANS.map(p => (
            <div key={p.name} className="cf-card" style={{ position: 'relative', background: p.bg, border: p.border, borderRadius: 22, padding: '36px 30px', display: 'flex', flexDirection: 'column', gap: 20, boxShadow: p.shadow }}>
              {p.popular && (
                <span style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#0C2A20', color: 'white', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>Más popular</span>
              )}
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: p.accent, margin: '0 0 8px', textTransform: 'uppercase' }}>{p.name}</p>
                {p.strikePrice && (
                  <span style={{ fontSize: 15, color: p.subTextColor, textDecoration: 'line-through', display: 'block', marginBottom: 2 }}>{p.strikePrice}</span>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 36, color: p.textColor, whiteSpace: 'nowrap' }}>{p.price}</span>
                  <span style={{ fontSize: 14, color: p.subTextColor, whiteSpace: 'nowrap' }}>{p.period}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
                {p.items.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 14.5, color: p.subTextColor, lineHeight: 1.5 }}>
                    <span style={{ color: p.accent, fontWeight: 700, flex: 'none' }}>✓</span><span style={{ flex: 1 }}>{item}</span>
                  </div>
                ))}
              </div>
              <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hola, me interesa el plan ${p.name} de CashFood`)}`} target="_blank" rel="noopener noreferrer" className="cf-btn" style={{ textAlign: 'center', background: p.btnBg, color: p.btnText, fontWeight: 700, fontSize: 15.5, padding: '15px 20px', borderRadius: 12, marginTop: 6 }}>Contratar</a>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACTO / DEMO */}
      <section id="contacto" style={{ maxWidth: 1220, margin: '120px auto 0', padding: '0 28px 140px' }}>
        <div style={{ position: 'relative', borderRadius: 30, overflow: 'hidden', padding: '60px 44px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,#0B7C56,#0B7C56 16px,#0A6E4C 16px,#0A6E4C 32px)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(155deg, rgba(10,110,76,0.88), rgba(10,80,56,0.94))' }} />
          <div className="cf-split" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 'clamp(26px,3.2vw,34px)', color: 'white', margin: '0 0 14px', letterSpacing: '-0.01em' }}>Solicita una demo</h2>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', margin: '0 0 20px', maxWidth: 420 }}>Cuéntanos sobre tu comedor y te contactamos para mostrarte CashFood en acción.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14.5, color: 'rgba(255,255,255,0.85)' }}>
                <span>Implementación en cualquier planta industrial</span>
                <span>Configuración lista en menos de una semana</span>
              </div>
            </div>
            {submitted ? (
              <div style={{ background: 'white', borderRadius: 18, padding: '40px 28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E6F7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#0F9D64' }}>✓</div>
                <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 19, color: '#0C2A20', margin: 0 }}>¡Listo!</h3>
                <p style={{ fontSize: 14.5, color: '#4B5F58', margin: 0 }}>Recibimos tu solicitud, te contactaremos pronto.</p>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 18, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {([['empresa', 'Nombre de la empresa', 'text'], ['nombre', 'Nombre y puesto', 'text'], ['correo', 'Correo', 'email'], ['telefono', 'Teléfono', 'tel']] as const).map(([name, ph, type]) => (
                  <input key={name} className="cf-in" type={type} placeholder={ph} value={(form as any)[name]}
                    onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                    style={{ border: '1px solid #DDE7E1', borderRadius: 10, padding: '13px 14px', fontSize: 14.5, fontFamily: "'Manrope',sans-serif" }} />
                ))}
                <button onClick={onSubmit} className="cf-btn" style={{ background: '#0C2A20', color: 'white', border: 'none', fontWeight: 700, fontSize: 15.5, padding: 14, borderRadius: 10, cursor: 'pointer' }}>Enviar solicitud</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #ECE9E2', padding: '36px 28px' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Logo size={30} /><Wordmark size={15} />
          </div>
          <p style={{ fontSize: 13.5, color: '#7C8B85', margin: 0 }}>© {new Date().getFullYear()} CashFood · by th3seo.com. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
