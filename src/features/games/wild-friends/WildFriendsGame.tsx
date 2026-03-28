'use client';

interface WildFriendsGameProps {
  locale?: string;
}

export default function WildFriendsGame({ locale = 'en' }: WildFriendsGameProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🦜</div>
        <h1 className="text-3xl font-bold text-green-700">Wild Friends</h1>
        <p className="text-lg text-green-600 mt-2">Coming soon...</p>
      </div>
    </div>
  );
}
