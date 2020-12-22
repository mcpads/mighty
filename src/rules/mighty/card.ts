// rule check function

import { card } from '../../types/game.d';
import { gameBoard } from '../../types/mighty.d';

export const isScoreCard = (c: card): boolean => ['T', 'J', 'Q', 'K', 'A'].includes(c.rank);

export const isDealmiss = (c: card[]): boolean => {
  const scores = c.map(isScoreCard).reduce((acc, v) => acc + (v ? 1 : 0), 0) - (c.some((v) => v.suit === 'joker') ? 1 : 0);
  return scores <= 1;
};

export const isMigthy = (state: gameBoard, c: card): boolean => c.rank === 'A' && (state.giruda === 'spade' ? c.suit === 'diamond' : c.suit === 'spade');
