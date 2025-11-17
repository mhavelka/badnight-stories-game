import React, { useState, useEffect, useMemo } from 'react';

const PARTY_TASKS = [
    "Dej někomu francouzský polibek, koho jsi dnes večer ještě nelíbal/a.",
    "Vyber si někoho a dej mu smyslnou masáž ramen po dobu jedné minuty.",
    "Zašeptej někomu do ucha tu největší prasárničku, která tě napadne.",
    "Nech někoho, ať si z tvého těla dá panáka (bodyshot).",
    "Sveď osobu po tvé levici. Máš dvě minuty na to, aby se začervenala.",
    "Plácni někoho dle tvého výběru po zadku.",
    "Jemně kousni někoho do ušního lalůčku.",
    "Svěř se někomu se svým největším tajemstvím nebo pikantní historkou.",
    "Vyber si partnera a dejte si eskymácký polibek.",
    "Nech někoho, ať ti napíše fixou krátký vzkaz na ruku nebo kotník.",
    "Pohlaď někomu vnitřní stranu stehna po dobu deseti sekund.",
    "Slož někomu originální a dvojsmyslný kompliment."
];

type GameState = 'idle' | 'running' | 'finished';
const UNLOCK_INTERVAL_MINUTES = 20;
const UNLOCK_INTERVAL_SECONDS = UNLOCK_INTERVAL_MINUTES * 60;

interface CardProps {
  task: string;
  isRevealed: boolean;
  isCompleted: boolean;
  isClickable: boolean;
  onClick: () => void;
  onComplete: () => void;
  index: number;
}

const Card: React.FC<CardProps> = ({ task, isRevealed, isCompleted, isClickable, onClick, onComplete, index }) => {
  const cardClasses = `card relative w-full h-full cursor-pointer rounded-lg shadow-lg ${isClickable ? '' : 'cursor-not-allowed'}`;

  return (
    <div className="aspect-[3/4] [perspective:1000px]" onClick={isClickable ? onClick : undefined}>
      <div className={`${cardClasses} ${isRevealed ? 'is-flipped' : ''}`}>
        {/* Card Front */}
        <div
          className="card-face rounded-lg flex items-center justify-center bg-cover bg-center"
          style={{ backgroundImage: `url('/assets/card_blue.png')` }}
        >
           <span className="font-monument text-5xl text-white" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)' }}>
             {index + 1}
           </span>
        </div>
        {/* Card Back */}
        <div className="card-face card-back bg-white rounded-lg flex flex-col items-center justify-between p-4 border-2 border-rose-300">
          <p className="text-center text-slate-700 font-medium text-sm sm:text-base">{task}</p>
          {!isCompleted ? (
              <button
                onClick={(e) => { e.stopPropagation(); onComplete(); }}
                className="mt-4 px-4 py-1.5 bg-emerald-500 text-white text-sm font-semibold rounded-md hover:bg-emerald-600 transition-colors"
                aria-label={`Splnit úkol ${index + 1}`}
              >
                Splněno
              </button>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-sm">Hotovo</span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};


const TimerDisplay: React.FC<{ timeLeft: number; isRunning: boolean }> = ({ timeLeft, isRunning }) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!isRunning || timeLeft <= 0) {
    return (
      <div className="text-center">
        <p className="text-lg font-medium text-emerald-600">Další karta je připravena k odemčení!</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-sm text-slate-500">Další karta se odemkne za:</p>
      <p className="text-4xl font-bold tracking-tighter text-slate-700">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </p>
    </div>
  );
};


export default function App() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [revealed, setRevealed] = useState<boolean[]>(Array(12).fill(false));
  const [completed, setCompleted] = useState<boolean[]>(Array(12).fill(false));
  const [unlockedAll, setUnlockedAll] = useState<boolean>(false);
  const [nextUnlockTime, setNextUnlockTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(UNLOCK_INTERVAL_SECONDS);

  const revealedCount = useMemo(() => revealed.filter(Boolean).length, [revealed]);
  const canRevealNext = useMemo(() => timeLeft <= 0 || unlockedAll, [timeLeft, unlockedAll]);

  useEffect(() => {
    try {
        const savedData = localStorage.getItem('badNightGame');
        if (savedData) {
            const {
                gameState: savedGameState,
                revealed: savedRevealed,
                completed: savedCompleted,
                unlockedAll: savedUnlockedAll,
                nextUnlockTime: savedNextUnlockTime,
            } = JSON.parse(savedData);

            setGameState(savedGameState ?? 'idle');
            setRevealed(savedRevealed ?? Array(12).fill(false));
            setCompleted(savedCompleted ?? Array(12).fill(false));
            setUnlockedAll(savedUnlockedAll ?? false);
            setNextUnlockTime(savedNextUnlockTime ?? null);
        }
    } catch (e) {
        console.error("Failed to load state from localStorage", e);
    }
  }, []);

  useEffect(() => {
    const stateToSave = {
        gameState,
        revealed,
        completed,
        unlockedAll,
        nextUnlockTime,
    };
    localStorage.setItem('badNightGame', JSON.stringify(stateToSave));
  }, [gameState, revealed, completed, unlockedAll, nextUnlockTime]);
  
  useEffect(() => {
    if (gameState !== 'running' || unlockedAll || !nextUnlockTime) {
        setTimeLeft(0);
        return;
    }

    const calculateTimeLeft = () => {
        const now = Date.now();
        const remaining = Math.round((nextUnlockTime - now) / 1000);
        setTimeLeft(remaining > 0 ? remaining : 0);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [gameState, unlockedAll, nextUnlockTime]);
  
  useEffect(() => {
    if (revealedCount === 12 && gameState === 'running') {
        setGameState('finished');
    }
  }, [revealedCount, gameState]);

  const handleStart = () => {
    setGameState('running');
    setNextUnlockTime(Date.now());
  };

  const handleUnlockAll = () => {
    setUnlockedAll(true);
    if(gameState === 'idle') {
      setGameState('running');
    }
  };

  const handleCardClick = (index: number) => {
    if (gameState !== 'running' || revealed[index] || !canRevealNext || revealedCount >= 12) {
      return;
    }

    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    if (!unlockedAll && (revealedCount + 1 < 12) ) {
        setNextUnlockTime(Date.now() + UNLOCK_INTERVAL_SECONDS * 1000);
    }
  };
  
  const handleCompleteTask = (index: number) => {
    const newCompleted = [...completed];
    newCompleted[index] = true;
    setCompleted(newCompleted);
  };

  const renderContent = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
        {PARTY_TASKS.map((task, index) => (
          <Card
            key={index}
            index={index}
            task={task}
            isRevealed={revealed[index]}
            isCompleted={completed[index]}
            isClickable={gameState === 'running' && !revealed[index] && canRevealNext}
            onClick={() => handleCardClick(index)}
            onComplete={() => handleCompleteTask(index)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <main className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-6 md:mb-8">
          <h1 className="font-monument uppercase text-5xl sm:text-6xl md:text-7xl text-rose-500">BadNight Stories</h1>
          <p className="text-slate-500 mt-2">Odvážíš se otočit další kartu?</p>
        </header>

        <div className="mb-6 md:mb-8">
            {renderContent()}
        </div>
        
        <footer className="mt-6 md:mt-8 p-6 bg-white/60 backdrop-blur-sm rounded-xl shadow-md sticky bottom-4">
          {gameState === 'idle' && (
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={handleStart} className="w-full sm:w-auto px-8 py-3 bg-rose-500 text-white font-bold rounded-lg shadow-md hover:bg-rose-600 transition-all transform hover:scale-105">
                    Začít hrát
                </button>
                 <button onClick={handleUnlockAll} className="w-full sm:w-auto px-6 py-2 bg-transparent text-slate-500 font-medium rounded-lg hover:bg-slate-200 transition-colors">
                    Odemknout všechny karty
                </button>
             </div>
          )}
          {gameState === 'running' && revealedCount < 12 && (
             <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-around w-full">
                {unlockedAll ? (
                     <div className="text-center">
                        <p className="text-lg font-medium text-emerald-600">Všechny karty jsou odemčeny! Odhalujte je vlastním tempem.</p>
                    </div>
                ) : (
                    <>
                        <TimerDisplay timeLeft={timeLeft} isRunning={!canRevealNext}/>
                        <button onClick={handleUnlockAll} className="w-full sm:w-auto px-6 py-2 bg-transparent text-slate-500 font-medium rounded-lg hover:bg-slate-200 transition-colors">
                            Odemknout všechny karty
                        </button>
                    </>
                )}
             </div>
          )}
          {gameState === 'finished' && (
             <div className="text-center">
                <p className="text-2xl font-bold text-rose-500">Noc je u konce!</p>
                <p className="text-slate-600 mt-1">Doufáme, že jste si příběhy užili.</p>
             </div>
          )}
        </footer>
      </main>
    </div>
  );
}
