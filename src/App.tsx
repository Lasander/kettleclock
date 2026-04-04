import { useState } from 'react';
import type { Screen, Workout } from './types';
import { WorkoutBuilder } from './components/WorkoutBuilder';
import { Timer } from './components/Timer';
import { Summary } from './components/Summary';
import { ExerciseLibrary } from './components/ExerciseLibrary';

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [exerciseElapsed, setExerciseElapsed] = useState(0);
  const [restElapsed, setRestElapsed] = useState(0);

  const handleStart = (w: Workout) => {
    setWorkout(w);
    setScreen('workout');
  };

  const handleDone = (elapsedSec: number, exerciseSec: number, restSec: number) => {
    setElapsed(elapsedSec);
    setExerciseElapsed(exerciseSec);
    setRestElapsed(restSec);
    setScreen('summary');
  };

  const handleAbort = () => {
    setScreen('setup');
  };

  const handleAgain = () => {
    setScreen('workout');
  };

  const handleBack = () => {
    setScreen('setup');
  };

  if (screen === 'exerciseLibrary') {
    return <ExerciseLibrary onBack={() => setScreen('setup')} />;
  }

  if (screen === 'workout' && workout) {
    return <Timer key={Date.now()} workout={workout} onDone={handleDone} onAbort={handleAbort} />;
  }

  if (screen === 'summary' && workout) {
    return (
      <Summary workout={workout} elapsed={elapsed} exerciseElapsed={exerciseElapsed} restElapsed={restElapsed} onAgain={handleAgain} onBack={handleBack} />
    );
  }

  return <WorkoutBuilder onStart={handleStart} onEditExercises={() => setScreen('exerciseLibrary')} initialWorkout={workout ?? undefined} />;
}
