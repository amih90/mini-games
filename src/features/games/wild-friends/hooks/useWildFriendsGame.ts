import { useState, useCallback } from 'react';
import { GamePhase, Difficulty } from '../types';

export interface WildFriendsState {
  phase: GamePhase;
  difficulty: Difficulty;
  currentSceneId: string | null;
  currentAnimalId: string | null;
  sceneAnimalIndex: number;
}

const INITIAL_STATE: WildFriendsState = {
  phase: 'menu',
  difficulty: 'medium',
  currentSceneId: null,
  currentAnimalId: null,
  sceneAnimalIndex: 0,
};

export function useWildFriendsGame() {
  const [state, setState] = useState<WildFriendsState>(INITIAL_STATE);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setState((prev) => ({ ...prev, difficulty }));
  }, []);

  const startGame = useCallback((difficulty: Difficulty) => {
    setState((prev) => ({
      ...prev,
      phase: 'hub',
      difficulty,
    }));
  }, []);

  const enterScene = useCallback((sceneId: string) => {
    setState((prev) => ({
      ...prev,
      phase: 'scene_intro',
      currentSceneId: sceneId,
      currentAnimalId: null,
      sceneAnimalIndex: 0,
    }));
  }, []);

  const startExploring = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'exploring' }));
  }, []);

  const encounterAnimal = useCallback((animalId: string) => {
    setState((prev) => ({
      ...prev,
      phase: 'animal_encounter',
      currentAnimalId: animalId,
    }));
  }, []);

  const showFactCard = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'fact_card' }));
  }, []);

  const startChallenge = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'challenge' }));
  }, []);

  const completeChallenge = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'reward' }));
  }, []);

  const nextAnimal = useCallback((totalAnimals: number) => {
    setState((prev) => {
      const nextIndex = prev.sceneAnimalIndex + 1;
      if (nextIndex >= totalAnimals) {
        return { ...prev, phase: 'scene_complete', currentAnimalId: null };
      }
      return {
        ...prev,
        phase: 'exploring',
        currentAnimalId: null,
        sceneAnimalIndex: nextIndex,
      };
    });
  }, []);

  const returnToHub = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'hub',
      currentSceneId: null,
      currentAnimalId: null,
      sceneAnimalIndex: 0,
    }));
  }, []);

  const triggerFinale = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'grand_finale' }));
  }, []);

  const resetGame = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    setDifficulty,
    startGame,
    enterScene,
    startExploring,
    encounterAnimal,
    showFactCard,
    startChallenge,
    completeChallenge,
    nextAnimal,
    returnToHub,
    triggerFinale,
    resetGame,
  };
}
