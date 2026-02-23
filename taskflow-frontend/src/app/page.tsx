// src/app/page.tsx
'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Noise overlay ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.4, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")" }}
      />

      {/* ── NAV ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-4 border-b"
        style={{
          backdropFilter: 'blur(16px)',
          background: 'rgba(248,247,244,.88)',
          borderColor: 'rgba(13,15,20,.07)',
        }}
      >
        <div className="flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-.02em', color: 'var(--ink)' }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--amber)', boxShadow: '0 0 10px var(--amber)' }} />
          TaskFlow
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ color: 'var(--ink-soft)' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(13,15,20,.06)')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'var(--ink)', color: 'var(--paper)', fontFamily: "'Syne', sans-serif", letterSpacing: '-.01em' }}
          >
            Registrarse
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-screen px-6" style={{ paddingTop: '100px' }}>

        {/* Orbs */}
        <div className="absolute rounded-full pointer-events-none" style={{ width: 420, height: 420, top: '8%', left: '3%', background: 'radial-gradient(circle, rgba(232,145,58,.18) 0%, transparent 70%)', filter: 'blur(72px)', animation: 'float1 9s ease-in-out infinite' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ width: 360, height: 360, top: '15%', right: '5%', background: 'radial-gradient(circle, rgba(42,125,110,.13) 0%, transparent 70%)', filter: 'blur(72px)', animation: 'float2 11s ease-in-out infinite' }} />

        {/* Badge */}
        <div
          className="relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-7 border"
          style={{ background: 'white', borderColor: 'rgba(232,145,58,.35)', color: 'var(--amber)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--amber)', animation: 'pulse 2s infinite' }} />
          Metodologías ágiles para equipos modernos
        </div>

        {/* Title */}
        <h1
          className="relative z-10 font-extrabold leading-none mb-5"
          style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2.8rem, 7vw, 5.2rem)', letterSpacing: '-.04em', color: 'var(--ink)', maxWidth: 820 }}
        >
          Organiza tu equipo.{' '}
          <span style={{ color: 'transparent', background: 'linear-gradient(135deg, var(--amber) 0%, #c2642a 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
            Entrega sin caos.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="relative z-10 mb-9" style={{ fontSize: '1.1rem', color: 'var(--ink-muted)', maxWidth: 500, lineHeight: 1.65 }}>
          TaskFlow te da tableros kanban, colaboración en tiempo real y seguimiento completo para que tu equipo trabaje en sincronía.
        </p>

        {/* CTA */}
        <div className="relative z-10 flex items-center gap-3">
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-xl font-medium transition-all text-base"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: 'var(--amber)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(232,145,58,.35)',
              letterSpacing: '-.01em',
            }}
          >
            Comenzar gratis
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl font-medium transition-all text-base"
            style={{ color: 'var(--ink-soft)' }}
          >
            Ver demo →
          </Link>
        </div>

        {/* Kanban preview */}
        <div className="relative z-10 mt-16 w-full" style={{ maxWidth: 840, perspective: 1200 }}>
          <div
            className="rounded-2xl border mx-auto overflow-hidden"
            style={{
              background: 'white',
              borderColor: 'rgba(13,15,20,.08)',
              boxShadow: '0 24px 80px rgba(13,15,20,.11), 0 4px 12px rgba(13,15,20,.05)',
              transform: 'rotateX(4deg) rotateY(-2deg)',
              transition: 'transform .4s ease',
            }}
            onMouseOver={e => (e.currentTarget.style.transform = 'rotateX(0) rotateY(0)')}
            onMouseOut={e => (e.currentTarget.style.transform = 'rotateX(4deg) rotateY(-2deg)')}
          >
            {/* Window bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: 'rgba(13,15,20,.06)' }}>
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-xs" style={{ color: '#aaa', fontFamily: "'Syne', sans-serif" }}>Sprint 3 — Tablero principal</span>
            </div>

            {/* Columns */}
            <div className="grid grid-cols-3 gap-3 p-4" style={{ background: 'var(--paper)' }}>
              {/* Col 1 */}
              <div className="rounded-xl p-3" style={{ background: 'white' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Pendiente</span>
                  <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'rgba(13,15,20,.07)', color: 'var(--ink-soft)' }}>3</span>
                </div>
                <KanbanCardPreview tag="Alta" tagColor="#fde8e8" tagText="#c0392b" title="Rediseño módulo de pagos" avatar="M" avatarBg="var(--amber)" date="28 Feb" />
                <KanbanCardPreview tag="Media" tagColor="#fef3cd" tagText="#b7771d" title="Configurar CI/CD pipeline" avatar="L" avatarBg="var(--teal)" date="05 Mar" />
              </div>

              {/* Col 2 */}
              <div className="rounded-xl p-3" style={{ background: 'white' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>En progreso</span>
                  <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'rgba(13,15,20,.07)', color: 'var(--ink-soft)' }}>2</span>
                </div>
                <KanbanCardPreview tag="Alta" tagColor="#fde8e8" tagText="#c0392b" title="Integración con Stripe" avatar="A" avatarBg="var(--amber)" date="25 Feb" accent="var(--amber)" />
                <KanbanCardPreview tag="Media" tagColor="#fef3cd" tagText="#b7771d" title="Panel de analíticas" avatar="S" avatarBg="var(--teal)" date="01 Mar" accent="var(--teal)" />
              </div>

              {/* Col 3 */}
              <div className="rounded-xl p-3" style={{ background: 'white' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Completado</span>
                  <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'rgba(13,15,20,.07)', color: 'var(--ink-soft)' }}>4</span>
                </div>
                <KanbanCardPreview tag="Baja" tagColor="#d4edda" tagText="#1e7e34" title="Notificaciones por email ✓" avatar="J" avatarBg="#27ae60" date="20 Feb" dim />
                <KanbanCardPreview tag="Media" tagColor="#fef3cd" tagText="#b7771d" title="Autenticación JWT ✓" avatar="M" avatarBg="var(--amber)" date="18 Feb" dim />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 px-12 py-24">
        <p className="text-center text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--amber)' }}>¿Por qué TaskFlow?</p>
        <h2
          className="text-center font-extrabold mb-14"
          style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', letterSpacing: '-.03em', color: 'var(--ink)', maxWidth: 500, margin: '0 auto 56px' }}
        >
          Todo lo que necesita tu equipo
        </h2>

        <div className="grid gap-5 mx-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', maxWidth: 980 }}>
          {[
            { icon: '🗂️', bg: 'rgba(232,145,58,.1)', title: 'Tableros Kanban', desc: 'Visualiza tu flujo de trabajo con columnas personalizables. Arrastra y suelta tareas entre etapas con total fluidez.' },
            { icon: '👥', bg: 'rgba(42,125,110,.08)', title: 'Colaboración en equipo', desc: 'Invita miembros, asigna responsables y comenta en cada tarea. Todos en la misma página, siempre.' },
            { icon: '🔔', bg: 'rgba(13,15,20,.06)', title: 'Notificaciones', desc: 'Recibe alertas cuando te asignan una tarea, alguien comenta o se acercan las fechas límite.' },
            { icon: '📋', bg: 'rgba(232,145,58,.1)', title: 'Prioridades y fechas', desc: 'Marca tareas como Alta, Media o Baja. Nunca pierdas un deadline con fechas límite visibles al instante.' },
            { icon: '📜', bg: 'rgba(42,125,110,.08)', title: 'Historial de cambios', desc: 'Cada acción queda registrada. Sabe quién cambió qué y cuándo, con trazabilidad completa.' },
            { icon: '⚡', bg: 'rgba(13,15,20,.06)', title: 'Rápido y confiable', desc: 'Construido con Next.js para cargas instantáneas. Tu equipo trabaja sin fricciones ni tiempos de espera.' },
          ].map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <div
        className="relative z-10 grid py-16 px-12 text-center gap-10"
        style={{
          background: 'var(--ink)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        }}
      >
        {[
          { value: '100%', label: 'Sin publicidad' },
          { value: '∞', label: 'Tareas sin límite' },
          { value: '24/7', label: 'Disponibilidad' },
          { value: '0€', label: 'Para empezar' },
        ].map((s) => (
          <div key={s.label}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '2.8rem', fontWeight: 800, color: 'var(--amber)', letterSpacing: '-.04em', lineHeight: 1 }}>{s.value}</div>
            <div className="mt-1 text-sm" style={{ color: 'rgba(248,247,244,.45)', letterSpacing: '.02em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <section className="relative z-10 px-6 py-24 text-center">
        <div
          className="relative mx-auto rounded-3xl px-12 py-16 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--ink) 0%, #1e2330 100%)', maxWidth: 680 }}
        >
          {/* Glow accents */}
          <div className="absolute rounded-full pointer-events-none" style={{ width: 240, height: 240, top: -60, right: -60, background: 'radial-gradient(circle, rgba(232,145,58,.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div className="absolute rounded-full pointer-events-none" style={{ width: 180, height: 180, bottom: -40, left: -40, background: 'radial-gradient(circle, rgba(42,125,110,.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />

          <h2
            className="relative z-10 font-extrabold mb-3"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', letterSpacing: '-.03em', color: 'var(--paper)' }}
          >
            Empieza a organizar<br />tu equipo hoy
          </h2>
          <p className="relative z-10 mb-8 text-base" style={{ color: 'rgba(248,247,244,.5)' }}>
            Crea tu cuenta gratis y ten tu primer tablero listo en minutos.
          </p>
          <Link
            href="/register"
            className="relative z-10 inline-block px-8 py-3.5 rounded-xl font-medium transition-all"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: 'var(--amber)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(232,145,58,.35)',
              letterSpacing: '-.01em',
              fontWeight: 700,
            }}
          >
            Crear cuenta gratis →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 flex items-center justify-between px-12 py-8 border-t"
        style={{ borderColor: 'rgba(13,15,20,.08)' }}
      >
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: 'var(--ink-muted)', fontSize: '.9rem' }}>TaskFlow ✦</span>
        <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>Gestión ágil de proyectos · 2025</span>
      </footer>

      {/* ── Animations ── */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          33%       { transform: translate(30px, -20px); }
          66%       { transform: translate(-15px, 25px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          33%       { transform: translate(-25px, 15px); }
          66%       { transform: translate(20px, -30px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .5; transform: scale(.8); }
        }
      `}</style>
    </div>
  );
}

/* ── Mini componentes internos (solo para esta página) ── */

function KanbanCardPreview({
  tag, tagColor, tagText, title, avatar, avatarBg, date, accent, dim
}: {
  tag: string; tagColor: string; tagText: string;
  title: string; avatar: string; avatarBg: string;
  date: string; accent?: string; dim?: boolean;
}) {
  return (
    <div
      className="rounded-lg p-2.5 mb-2 last:mb-0 border"
      style={{
        background: 'var(--paper)',
        borderColor: 'rgba(13,15,20,.06)',
        borderLeft: accent ? `3px solid ${accent}` : undefined,
        opacity: dim ? 0.65 : 1,
        boxShadow: '0 1px 3px rgba(13,15,20,.04)',
      }}
    >
      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5" style={{ background: tagColor, color: tagText }}>{tag}</span>
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--ink)', lineHeight: 1.4 }}>{title}</p>
      <div className="flex items-center justify-between">
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold" style={{ background: avatarBg, fontSize: '.5rem' }}>{avatar}</div>
        <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{date}</span>
      </div>
    </div>
  );
}

function FeatureCard({ icon, bg, title, desc }: { icon: string; bg: string; title: string; desc: string }) {
  return (
    <div
      className="rounded-2xl p-8 border transition-all group relative overflow-hidden"
      style={{ background: 'white', borderColor: 'rgba(13,15,20,.07)' }}
      onMouseOver={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(13,15,20,.09)';
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5" style={{ background: bg }}>{icon}</div>
      <h3 className="font-bold mb-2" style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', letterSpacing: '-.02em', color: 'var(--ink)' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{desc}</p>
    </div>
  );
}