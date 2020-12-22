import {
  gamePlayer, gameBoard, gameAction, gameStatus,
} from '../../types/mighty.d';
import checkActionValid from './act-validate';
import { MAX_SCORE_TARGET } from './constants';
import {
  countPlayerByCond, findPlayerIdxById, getNextTurn,
  getPlayerPositionById, mapPlayer, mapPlayerById, mightyPlayer0, resetBoard,
} from './mighty-util';
import { isScoreCard } from './card';
import { checkThrowable, getWinner } from './throw';

// 서버 또는 자체 reducer에서 검증 후, 가능하면 서버에 쏘고 accpet/deny를 받는 형태로

// START -> DISTRIBUTE -> PROLOG -> CANDIDACY ->
// ELECTED -> DISTRIBUTE -> DISCARD -> FRIEND -> MAIN ->
// (TURN -> THROW -> SWEEP) -> DECLARE_WIN -> RESET
// Friend가 없거나 지 자신인 주군의 경우, 처리를 해줘야함

export default function gameBoardReducer(state: gameBoard, action: gameAction): gameBoard {
  if (!checkActionValid(state, action)) {
    throw new Error('Invalid action');
  }
  switch (action.type) {
    case 'T_GA_RESET':
      return resetBoard(state);

    case 'T_GA_ADD_PLAYER': {
      const newState = { ...state };
      newState.players[action.position] = mightyPlayer0(
        action.name,
        action.target,
        state.myId,
      );
      return newState;
    }

    case 'T_GA_REMOVE_PLAYER': {
      const newState = { ...state };
      newState.players[findPlayerIdxById(state, action.target)] = undefined;
      return newState;
    }

    case 'T_GA_START':
      return {
        ...state,
        status: 'T_GS_DISTRIBUTING',
        turn: action.initializer,
      };

    case 'T_GA_CARD_DISTRIBUTE': {
      const newState = { ...state };
      const p = newState.players[findPlayerIdxById(state, action.target)];
      if (!p) {
        throw Error('Failed to get player');
      }
      p.numCards = action.count;
      if (action.cards) {
        if (p.cards && p.cards.length) {
          p.cards = [...p.cards, ...action.cards];
        } else {
          p.cards = action.cards;
        }
      }
      return newState;
    }

    case 'T_GA_PROLOG':
      return { ...state, status: 'T_GS_WAIT_CANDIDACY' };

    case 'T_GA_ADD_CANDIDACY': {
      const turn = getNextTurn(state, (pl) => !pl.isWithdraw);
      if (action.target === MAX_SCORE_TARGET) {
        const newState: gameBoard = {
          ...state,
          scoreTarget: action.count,
          lord: action.target,
          giruda: action.suit,
          status: 'T_GS_WAIT_DEALER_ACTION',
        };
        return mapPlayer(newState, (p: gamePlayer) => (
          p.id === action.target ? p : { ...p, isWithdraw: true }
        ));
      }

      return mapPlayerById({
        ...state,
        turn,
        scoreTarget: action.count,
        lord: action.target,
        giruda: action.suit,
      }, (p) => ({ ...p, dealmissAble: false }), action.target);
    }

    case 'T_GA_DEAL_MISS': {
      return { ...state, status: 'T_GS_NAGARI' };
    }

    case 'T_GA_WITHDRAW_CANDIDACY': {
      const turn = getNextTurn(state, (pl) => !pl.isWithdraw);
      const newState = mapPlayerById(state, (p: gamePlayer) => (
        { ...p, isWithdraw: true }
      ), action.target);

      const withdrawn = countPlayerByCond(
        newState,
        (p: gamePlayer) => p.isWithdraw,
      );

      if (withdrawn === 1 && state.lord !== undefined) {
        return { ...newState, turn, status: 'T_GS_WAIT_DEALER_ACTION' };
      }

      if (withdrawn === 0) {
        return { ...newState, status: 'T_GS_NAGARI' };
      }
      return { ...newState, turn };
    }

    case 'T_GA_ELECTED':
      return mapPlayerById({
        ...state,
        status: 'T_GS_WAIT_DEALER_ACTION',
        turn: action.target,
      }, (p) => ({ ...p, isLord: true }), action.target);

    case 'T_GA_ADD_LORD_CARDS':
      if (action.target === state.myId) {
        if (!action.cards) {
          throw new Error('Failed to get state');
        }
        const cards = [...action.cards];
        return mapPlayerById(
          { ...state, status: 'T_GS_WAIT_DISCARD' },
          (p) => ({
            ...p, cards: [...cards, ...p.cards!], numCards: cards.length + p.numCards,
          }),
          action.target,
        );
      }

      return mapPlayerById({ ...state, status: 'T_GS_WAIT_DISCARD' }, (p) => ({
        ...p, numCards: p.numCards + action.count,
      }), action.target);

    case 'T_GA_CARD_DISCARD':
      if (action.target === state.myId) {
        if (!action.cards) {
          throw new Error('Failed to get state');
        }
        const cards = [...action.cards];

        return mapPlayerById(
          { ...state, status: 'T_GS_WAIT_FRIEND' },
          (p) => (
            { ...p, cards: p.cards!.filter((c) => !cards.includes(c)) }
          ),
          action.target,
        );
      }

      return mapPlayerById({ ...state, status: 'T_GS_WAIT_FRIEND' }, (p) => ({
        ...p, numCards: p.numCards - action.count,
      }), action.target);

    case 'T_GA_FRIEND_DECLARE':
      if (typeof action.target === 'number') {
        return mapPlayerById(
          {
            ...state, friendType: action.target, friend: action.target, status: 'T_GS_BEFORE_MAIN',
          },
          (p) => ({
            ...p, isKnowFriend: true,
          }),
          action.target,
        );
      }
      return { ...state, friendType: action.target, status: 'T_GS_BEFORE_MAIN' };

    case 'T_GA_MAIN':
      return {
        ...state,
        turn: getPlayerPositionById(state, state.lord!),
        status: state.myId === state.lord ? 'T_GS_MYTURN' : 'T_GS_OTHERTURN',
      };

    case 'T_GA_THROW_CARD':
      if (checkThrowable(state, action.value, action.auxAction)) {
        const next = getNextTurn(state, () => true);

        let status: gameStatus;
        if (state.throwed.length === state.players.length) {
          status = 'T_GS_CALCULATE_THROWED';
        } else if (state.myId === state.players[next]?.id) {
          status = 'T_GS_MYTURN';
        } else {
          status = 'T_GS_OTHERTURN';
        }

        const newState = mapPlayerById(state, (p) => ({
          ...p,
          cards: p.cards?.filter((c) => c !== action.value),
          numCards: p.numCards - 1,
          isKnowFriend: action.value === state.friendType || p.isKnowFriend,
        }), action.target);

        return {
          ...newState,
          turn: next,
          throwed: [...state.throwed, {
            aux: action.auxAction, player: action.target, card: action.value,
          }],
          status,
          girudaBroken: state.girudaBroken || action.value.suit === state.giruda,
          friend: action.value === state.friendType ? action.target : state.friend,
        };
      }
      throw new Error('Unacceptable card');

    case 'T_GA_SWEEP_THROWED': {
      const winnerId = getWinner(state);
      const newState = mapPlayerById(state, (p) => {
        const newPlayer = { ...p };
        newPlayer.scoreCards = [...newPlayer.scoreCards,
          ...state.throwed.map((v) => v.card).filter(isScoreCard),
        ];
        return newPlayer;
      }, winnerId);

      let status: gameStatus;
      if (!state.players[0]?.numCards) {
        status = 'T_GS_CALCULATE_ALL_GAME';
      } else if (state.myId === winnerId) {
        status = 'T_GS_MYTURN';
      } else {
        status = 'T_GS_OTHERTURN';
      }

      const nextTurn = getPlayerPositionById(state, winnerId);

      return {
        ...newState,
        throwed: [],
        dummy: [
          ...newState.dummy,
          ...newState.throwed.map((v) => v.card).filter((v) => !isScoreCard(v)),
        ],
        turn: nextTurn,
        status,
        nowRule: undefined,
      };
    }

    case 'T_GA_DECLARE_WIN': {
      mapPlayer(state, (p) => {
        if (
          (action.winnerType === 'T_WIN_LORD' && (p.isLord || p.isKnowFriend))
				|| (!p.isLord && !p.isKnowFriend)
        ) {
          return { ...p, winCount: p.winCount + 1 };
        }
        return { ...p, lossCount: p.lossCount + 1 };
      });
      return {
        ...state,
        status: 'T_GS_END',
      };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
