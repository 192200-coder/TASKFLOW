// src/app/(auth)/register/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const registerSchema = z.object({
  name:            z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email:           z.string().email('Email inválido'),
  password:        z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

// Componente reutilizable del logo con link al home
const LogoLink = ({ dark = false }: { dark?: boolean }) => (
  <Link
    href="/"
    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    style={{
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: '1.25rem',
      color: dark ? 'white' : 'var(--ink)',
      letterSpacing: '-.02em',
      textDecoration: 'none',
    }}
  >
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: 'var(--teal-dim)', boxShadow: '0 0 10px rgba(91,184,168,.8)' }}
    />
    TaskFlow
  </Link>
);

export default function RegisterPage() {
  const { register: registerUser, loading } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    await registerUser({
      name:     data.name,
      email:    data.email,
      password: data.password,
    });
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Panel izquierdo (decorativo) ── */}
      <div
        className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f4a41 0%, #0d0f14 100%)' }}
      >
        {/* Orbs */}
        <div className="absolute rounded-full pointer-events-none" style={{ width: 400, height: 400, top: -100, right: -100, background: 'radial-gradient(circle, rgba(42,125,110,.28) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float1 9s ease-in-out infinite' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, bottom: -40, left: -40, background: 'radial-gradient(circle, rgba(232,145,58,.18) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float2 11s ease-in-out infinite' }} />

        {/* Logo con link al home */}
        <div className="relative z-10">
          <LogoLink dark />
        </div>

        {/* Main copy */}
        <div className="relative z-10">
          <h2
            className="font-extrabold mb-4 leading-none"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: '2.5rem', letterSpacing: '-.04em', color: 'white' }}
          >
            Tu equipo.<br />
            Tus <span style={{ color: '#5bb8a8' }}>proyectos.</span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,.4)', maxWidth: 320 }}>
            Regístrate en segundos y empieza a gestionar tareas con tu equipo de forma ágil y sin fricción.
          </p>
        </div>

        {/* Checklist decorativa */}
        <div className="relative z-10 flex flex-col gap-2.5">
          {[
            { icon: '✓', color: 'rgba(42,125,110,.35)', iconColor: '#5bb8a8', label: 'Tableros kanban ilimitados' },
            { icon: '✓', color: 'rgba(232,145,58,.2)',  iconColor: 'var(--amber)', label: 'Colaboración en tiempo real' },
            { icon: '✓', color: 'rgba(42,125,110,.35)', iconColor: '#5bb8a8', label: 'Historial completo de cambios' },
            { icon: '★', color: 'rgba(255,255,255,.08)', iconColor: 'rgba(255,255,255,.4)', label: '100% gratis para empezar' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl px-4 py-3 border"
              style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.08)' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: item.color, color: item.iconColor }}
              >
                {item.icon}
              </div>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,.55)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex flex-col items-center justify-center px-8 py-12" style={{ background: 'var(--paper)' }}>

        {/* Logo móvil con link al home */}
        <div className="md:hidden mb-10">
          <LogoLink />
        </div>

        <div className="w-full" style={{ maxWidth: 380 }}>
          <div className="mb-7">
            <h1
              className="font-extrabold mb-1.5"
              style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.75rem', letterSpacing: '-.03em', color: 'var(--ink)' }}
            >
              Crea tu cuenta
            </h1>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
              Empieza gratis, sin tarjeta de crédito
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nombre completo"
              type="text"
              placeholder="Juan Pérez"
              autoComplete="name"
              {...register('name')}
              error={errors.name?.message}
            />

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
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              {...register('password')}
              error={errors.password?.message}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            <div className="pt-1">
              <Button
                type="submit"
                variant="amber"
                size="lg"
                isLoading={loading}
                className="w-full"
              >
                Crear cuenta →
              </Button>
            </div>
          </form>

          <p className="text-center text-xs mt-4 leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
            Al registrarte aceptas nuestros{' '}
            <a href="#" className="underline" style={{ color: 'var(--teal)' }}>Términos de uso</a>
            {' '}y{' '}
            <a href="#" className="underline" style={{ color: 'var(--teal)' }}>Política de privacidad</a>
          </p>

          <p className="text-center text-sm mt-5" style={{ color: 'var(--ink-muted)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-medium" style={{ color: 'var(--teal)' }}>
              Iniciar sesión
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