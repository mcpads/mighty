import { gameBoard, throwAuxAction } from '../../types/mighty.d';
import {
  card, suit, playerId, rankArr, rank,
} from '../../types/game.d';
import { isMigthy } from './card';

const jokerCallable = (state: gameBoard, c: card): boolean => c.rank === '3'
    && ((state.giruda === 'club' && c.suit === 'spade')
      || (state.giruda !== 'club' && c.suit === 'club'))
		&& !state.throwed.length
		&& state.dummy.every((dum) => dum.suit !== 'joker');

// eslint-disable-next-line no-unused-vars
type predFunc = (arg0: card) => boolean

// eslint-disable-next-line max-len
const checkPlayerCards = (state: gameBoard, pred: predFunc): boolean => state.players[state.turn]!.cards!.every((c) => pred(c));

const thisPlayerHasSuit = (state: gameBoard, s: suit): boolean => {
  const playerCards = state.players[state.turn]?.cards!;
  return playerCards.some((v) => v.suit === s);
};

// eslint-disable-next-line max-len
const isCardAcceptable = 	(state: gameBoard, c: card): boolean => c.suit === state.throwed[0]?.card.suit
	|| isMigthy(state, c)
	|| !thisPlayerHasSuit(state, state.throwed[0]!.card.suit)
	|| c.suit === 'joker'
	|| state.throwed[0]!.card.suit === 'joker';

export const checkThrowable = (state: gameBoard, c: card, aux?: throwAuxAction): boolean => {
  const { throwed } = state;
  // 시작이 아닌 사람은 액션 불가능
  if (throwed.length && aux) return false;
  // 첫턴 시작에 조커내는 경우는 불가능
  if (!state.step && !throwed.length && c.suit === 'joker') {
    return false;
  }
  // 자신이 첫턴 시작이면서 조건 제시를 하는 경우
  if (aux) {
    // 조커콜
    if (aux.type === 'T_THROW_JOKER_CALL') return jokerCallable(state, c);
    // 조커
    if (aux.type === 'T_THROW_JOKER') {
      return c.suit === 'joker';
    }
    throw new Error('Unknown throwing action');
  }
  // 나머지 시작인 경우
  if (!throwed.length) {
    // 기루다가 깨졌거나
    return state.girudaBroken
		// 기루다밖에 없거나
		|| checkPlayerCards(state, (c2) => c2.suit === state.giruda)
		// 기루다 아닌거를 내거나
		|| c.suit !== state.giruda;
  }

  // 첫턴 효과 사용
  if (state.nowRule) {
    switch (state.nowRule.type) {
      // 첫턴 조커 효과 나왔을때
      case 'T_THROW_JOKER':
        // 선언 무늬랑 같은거 내거나
        return state.nowRule.auxSuit === c.suit
			// 마이티 내거나
			|| isMigthy(state, c)
			// 선언 무늬랑 같은게 없을때
			|| !thisPlayerHasSuit(state, state.nowRule.auxSuit);
        // 첫턴 조커콜일때
      case 'T_THROW_JOKER_CALL':
        // 조커가 없어서 다른걸 내거나
        return (!thisPlayerHasSuit(state, 'joker') && isCardAcceptable(state, c))
			// 조커를 낼때
			|| c.suit === 'joker';
      default:
        throw new Error('Unknown Action');
    }
  }

  return isCardAcceptable(state, c);
};

const compareRank = (r1: rank, r2: rank): -1 | 1 => {
  if (r1 === 'JO') return 1;
  if (r2 === 'JO') return -1;
  return rankArr.indexOf(r1) < rankArr.indexOf(r2) ? 1 : -1;
};

const compareStrength = (state: gameBoard, c1: card, c2: card): -1 | 0 | 1 => {
  if (isMigthy(state, c1)) return -1;
  if (isMigthy(state, c2)) return 1;

  if (c1.suit === 'joker' && state.nowRule?.type !== 'T_THROW_JOKER_CALL') return -1;
  if (c2.suit === 'joker' && state.nowRule?.type !== 'T_THROW_JOKER_CALL') return 1;

  // giruda vs giruda
  if (c1.suit === state.giruda && c2.suit === state.giruda) {
    return compareRank(c1.rank, c2.rank);
  }
  // only giruda
  if (c1.suit === state.giruda) return -1;
  if (c2.suit === state.giruda) return 1;

  // value vs value
  const throwedSuit = state.throwed[0]!.card.suit;
  if (c1.suit === throwedSuit && c2.suit === throwedSuit) {
    return compareRank(c1.rank, c2.rank);
  }
  // not same
  if (c1.suit === throwedSuit) {
    return -1;
  }
  if (c2.suit === throwedSuit) {
    return 1;
  }
  return 0;
};

export const getWinner = (state: gameBoard): playerId => {
  const { throwed } = state;
  return throwed.reduce((x, y) => {
    if (x) return compareStrength(state, x.card, y.card) === -1 ? x : y;
    return y;
  }).player;
};
