// src/app/(auth)/login/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    await login(data);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Panel izquierdo (decorativo) ── */}
      <div
        className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'var(--ink)' }}
      >
        {/* Orbs */}
        <div className="absolute rounded-full pointer-events-none" style={{ width: 380, height: 380, top: -80, right: -80, background: 'radial-gradient(circle, rgba(232,145,58,.22) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float1 9s ease-in-out infinite' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ width: 300, height: 300, bottom: -60, left: -60, background: 'radial-gradient(circle, rgba(42,125,110,.18) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float2 12s ease-in-out infinite' }} />

        {/* Logo */}
        <div
          className="relative z-10 flex items-center gap-2"
          style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: 'white', letterSpacing: '-.02em' }}
        >
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--amber)', boxShadow: '0 0 10px var(--amber)' }} />
          TaskFlow
        </div>

        {/* Main copy */}
        <div className="relative z-10">
          <h2
            className="font-extrabold mb-4 leading-none"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: '2.5rem', letterSpacing: '-.04em', color: 'white' }}
          >
            Bienvenido<br />
            de <span style={{ color: 'var(--amber)' }}>vuelta.</span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(248,247,244,.45)', maxWidth: 320 }}>
            Tus proyectos te esperan. Inicia sesión y retoma el ritmo donde lo dejaste.
          </p>
        </div>

        {/* Mini kanban decorativo */}
        <div className="relative z-10 flex gap-2.5">
          {[
            { title: 'Pendiente', chips: ['rgba(232,145,58,.25)', 'rgba(255,255,255,.08)', 'rgba(255,255,255,.05)'] },
            { title: 'En progreso', chips: ['rgba(42,125,110,.3)', 'rgba(255,255,255,.08)'] },
            { title: 'Hecho', chips: ['rgba(40,200,64,.15)', 'rgba(40,200,64,.1)', 'rgba(40,200,64,.08)'] },
          ].map((col) => (
            <div
              key={col.title}
              className="flex-1 rounded-xl p-3 border"
              style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.09)' }}
            >
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,.25)' }}>{col.title}</div>
              {col.chips.map((bg, i) => (
                <div key={i} className="rounded-md mb-1.5 last:mb-0 h-7" style={{ background: bg, opacity: col.title === 'Hecho' ? .65 : 1, width: i === 2 ? '70%' : '100%' }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex flex-col items-center justify-center px-8 py-12" style={{ background: 'var(--paper)' }}>

        {/* Logo móvil */}
        <div
          className="md:hidden flex items-center gap-2 mb-10"
          style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: 'var(--ink)', letterSpacing: '-.02em' }}
        >
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--amber)', boxShadow: '0 0 10px var(--amber)' }} />
          TaskFlow
        </div>

        <div className="w-full" style={{ maxWidth: 380 }}>
          <div className="mb-8">
            <h1
              className="font-extrabold mb-1.5"
              style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.75rem', letterSpacing: '-.03em', color: 'var(--ink)' }}
            >
              Iniciar sesión
            </h1>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full"
              >
                Iniciar sesión →
              </Button>
            </div>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--ink-muted)' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-medium" style={{ color: 'var(--amber)' }}>
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>

      {/* Animaciones */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(20px, -30px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(-15px, 20px); }
        }
      `}</style>
    </div>
  );
}