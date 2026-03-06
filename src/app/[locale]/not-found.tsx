import { Link } from '@/i18n/navigation';
import { KidButton } from '@/components/ui/KidButton';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-candy-pink-light via-white to-sky-bubble-light flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-6">😢</div>
        <h1 className="text-4xl font-bold text-slate-800 mb-4">Oops!</h1>
        <p className="text-xl text-slate-600 mb-8">
          We couldn&apos;t find that game.
        </p>
        <Link href="/games">
          <KidButton variant="primary" size="lg">
            Back to Games 🎮
          </KidButton>
        </Link>
      </div>
    </div>
  );
}
