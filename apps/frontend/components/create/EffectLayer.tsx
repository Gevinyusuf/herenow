'use client';

interface EffectLayerProps {
  effect: string | null;
}

export default function EffectLayer({ effect }: EffectLayerProps) {
  if (!effect || effect === 'none') return null;
  
  const getIcon = () => { 
    const map: Record<string, string> = { 
      confetti: '🎉', sparkles: '✨', hearts: '💖', snow: '❄️', 
      fire: '🔥', balloons: '🎈', music: '🎵', flowers: '🌸', 
      stars: '⭐', ghosts: '👻', mesh: '🌈' 
    }; 
    return map[effect] || '✨'; 
  };

  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i, 
    left: `${Math.random() * 100}%`, 
    delay: `${Math.random() * 5}s`, 
    duration: `${6 + Math.random() * 6}s`, 
    scale: 0.5 + Math.random() * 1 
  }));

  return (
    <>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
        {particles.map(p => (
          <div 
            key={p.id} 
            className="absolute text-2xl opacity-0 animate-float" 
            style={{ 
              left: p.left, 
              bottom: '-10%', 
              fontSize: `${p.scale}rem`, 
              animation: `floatUp ${p.duration} linear infinite`, 
              animationDelay: p.delay 
            }}
          >
            {getIcon()}
          </div>
        ))}
      </div>
    </>
  );
}

