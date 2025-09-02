import { Button } from '@comuniapp/ui';
import { formatDate } from '@comuniapp/utils';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Bienvenido a Comuniapp
        </h1>
        <p className="text-center mb-8">
          Aplicación de comunidades construida con Next.js, React Native y NestJS
        </p>
        <div className="flex justify-center">
          <Button
            label={`Botón compartido - ${formatDate(new Date())}`}
            onPress={() => alert('¡Hola desde la web!')}
          />
        </div>
      </div>
    </main>
  );
}
