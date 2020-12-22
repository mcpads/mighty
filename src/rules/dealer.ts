import {
  card, suitArr, rankArr,
} from '../types/game.d';

export const makeDeck = () => {
  const deck: card[] = [];
  for (let i = 0; i < suitArr.length; i += 1) {
    for (let j = 0; j < rankArr.length; j += 1) {
      deck.push({ suit: suitArr[i], rank: rankArr[j] });
    }
  }
  deck.push({ suit: 'joker', rank: 'JO' });
  deck.sort(() => Math.random() - 0.5);
  return deck;
};

export const popDeckMany = (deck: card[], num: number): card[] => [...new Array(num)].map(() => {
  const c = deck.pop();
  if (!c) throw new Error('Deck error');
  return c;
});
