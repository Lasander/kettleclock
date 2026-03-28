import { useState } from 'react';
import type { Screen, Workout } from './types';
import { WorkoutBuilder } from './components/WorkoutBuilder';
import { Timer } from './components/Timer';
import { Summary } from './components/Summary';

export default function App() {
  const [screen, setScreen] = useState<Screen>('builder');
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const handleStart = (w: Workout) => {
    setWorkout(w);
    setScreen('timer');
  };

  const handleDone = (elapsedSec: number) => {
    setElapsed(elapsedSec);
    setScreen('summary');
  };

  const handleAbort = () => {
    setScreen('builder');
  };

  const handleAgain = () => {
    setScreen('timer');
  };

  const handleBack = () => {
    setScreen('builder');
  };

  if (screen === 'timer' && workout) {
    return <Timer key={Date.now()} workout={workout} onDone={handleDone} onAbort={handleAbort} />;
  }

  if (screen === 'summary' && workout) {
    return (
      <Summary workout={workout} elapsed={elapsed} onAgain={handleAgain} onBack={handleBack} />
    );
  }

  return <WorkoutBuilder onStart={handleStart} />;
}
