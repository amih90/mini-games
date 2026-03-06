'use client';

import { useState, useCallback, useEffect } from 'react';

export interface Card {
  id: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ['🐶', '🐱', '🐰'];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createCards(): Card[] {
  const pairs = EMOJIS.flatMap((emoji, index) => [
    { id: `${index}-a`, emoji, isFlipped: false, isMatched: false },
    { id: `${index}-b`, emoji, isFlipped: false, isMatched: false },
  ]);
  return shuffleArray(pairs);
}

interface UseMemoryGameReturn {
  cards: Card[];
  moves: number;
  pairsFound: number;
  isWin: boolean;
  isChecking: boolean;
  flipCard: (id: string) => void;
  resetGame: () => void;
}

export function useMemoryGame(): UseMemoryGameReturn {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const resetGame = useCallback(() => {
    setCards(createCards());
    setFlippedCards([]);
    setMoves(0);
    setPairsFound(0);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const flipCard = useCallback(
    (id: string) => {
      if (isChecking) return;

      const card = cards.find((c) => c.id === id);
      if (!card || card.isFlipped || card.isMatched) return;

      // Flip the card
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
      );

      const newFlipped = [...flippedCards, id];
      setFlippedCards(newFlipped);

      // Check for match when 2 cards are flipped
      if (newFlipped.length === 2) {
        setMoves((prev) => prev + 1);
        setIsChecking(true);

        const [firstId, secondId] = newFlipped;
        const firstCard = cards.find((c) => c.id === firstId);
        const secondCard = cards.find((c) => c.id === secondId);

        if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
          // Match found!
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isMatched: true }
                  : c
              )
            );
            setPairsFound((prev) => prev + 1);
            setFlippedCards([]);
            setIsChecking(false);
          }, 500);
        } else {
          // No match, flip back
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isFlipped: false }
                  : c
              )
            );
            setFlippedCards([]);
            setIsChecking(false);
          }, 1000);
        }
      }
    },
    [cards, flippedCards, isChecking]
  );

  const isWin = pairsFound === EMOJIS.length && pairsFound > 0;

  return {
    cards,
    moves,
    pairsFound,
    isWin,
    isChecking,
    flipCard,
    resetGame,
  };
}
