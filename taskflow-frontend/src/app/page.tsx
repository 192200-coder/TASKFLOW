// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="outline">Iniciar sesión</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary">Registrarse</Button>
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Gestiona tus proyectos de forma ágil y colaborativa
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            TaskFlow te ayuda a organizar tareas, colaborar con tu equipo y 
            mantener el control de tus proyectos con metodologías ágiles.
          </p>
          <Link href="/register">
            <Button variant="primary" size="lg">
              Comenzar gratis
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Tableros Kanban</h3>
            <p className="text-gray-600">
              Visualiza tu flujo de trabajo con tableros personalizables y arrastra y suelta tareas.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Colaboración en equipo</h3>
            <p className="text-gray-600">
              Invita miembros, asigna tareas y comenta en tiempo real.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Seguimiento completo</h3>
            <p className="text-gray-600">
              Historial de cambios, prioridades y fechas límite para cada tarea.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}