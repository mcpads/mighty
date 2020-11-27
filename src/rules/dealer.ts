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

export const isScoreCard = (c: card): boolean => ['T', 'J', 'Q', 'K', 'A'].includes(c.rank);

export const isDealmiss = (c: card[]): boolean => {
	const scores = c.map(isScoreCard).reduce((acc, v) => acc + (v ? 1 : 0), 0) - (c.some((v) => v.suit === 'joker') ? 1 : 0);
	return scores <= 1;
};
