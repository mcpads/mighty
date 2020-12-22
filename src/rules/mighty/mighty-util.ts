import {
  playerId, gameId,
} from '../../types/game.d';

import {
  gamePlayer, gameBoard,
} from '../../types/mighty.d';
import { MAX_PLAYER_COUNT, MIN_PLAYER_COUNT } from './constants';

export const mightyBoard0 = (id: gameId, myId: playerId): gameBoard => ({
  dummy: [],
  gameId: id,
  maxPlayerCount: MAX_PLAYER_COUNT,
  minPlayerCount: MIN_PLAYER_COUNT,
  players: [],
  status: 'T_GS_IDLE',
  throwed: [],
  totalCard: 53,
  turn: 0,
  step: 0,
  myId,
  scoreTarget: 0,
  girudaBroken: false,
});

// eslint-disable-next-line no-unused-vars
type playerCheckPred = (arg0: gamePlayer) => boolean;

export const getPlayerPositionById = (state: gameBoard, id: number) => state.players.findIndex(
  (v) => v?.id === id,
);

export const getNextTurn = (state: gameBoard, pred: playerCheckPred) => {
  let i = (state.turn + 1) % state.players.length;

  while (i !== state.turn) {
    const p = state.players[i];
    if (p && pred(p)) {
      return i;
    }
    i += 1;
  }

  return i;
};

export const mightyPlayer0 = (
  name: string,
  id: playerId,
  myId: playerId,
): gamePlayer => ({
  dealmissAble: true,
  numCards: 0,
  scoreCards: [],
  id,
  isKnowFriend: false,
  isLord: false,
  isMe: myId === id,
  isRevealed: false,
  isWithdraw: false,
  lossCount: 0,
  winCount: 0,
  score: 0,
  name,
});

// eslint-disable-next-line no-unused-vars
type playerMapFunc = (arg0: gamePlayer) => gamePlayer;

export const mapPlayer = (
  state: gameBoard,
  action: playerMapFunc,
): gameBoard => {
  const wrapped = (arg: gamePlayer | undefined) => {
    if (arg) return action(arg);
    return undefined;
  };
  return { ...state, players: state.players.map(wrapped) };
};

export const mapPlayerById = (state: gameBoard, action: playerMapFunc, id: number): gameBoard => (
  { ...state, players: state.players.map((p) => (p?.id === id ? p : action(p!))) });

export const countPlayerByCond = (
  state: gameBoard,
  pred: playerCheckPred,
): number => {
  const wrapped = (arg: gamePlayer | undefined) => {
    if (arg) return pred(arg);
    return false;
  };
  return state.players.filter(wrapped).length;
};

export const findPlayerIdxById = (
  state: gameBoard,
  id: playerId | undefined,
): number => {
  const { players } = state;
  const p = players.findIndex((v) => v?.id === id);
  if (p === -1) {
    throw new Error('Failed to find id');
  }
  return p;
};

export const findPlayerById = (
  state: gameBoard,
  id: playerId | undefined,
): gamePlayer | null => {
  const { players } = state;
  const p = players.find((v) => v?.id === id);
  if (!p) {
    return null;
  }
  return p;
};

export const findMyPlayer = (state: gameBoard): gamePlayer => findPlayerById(state, state.myId)!;

export const resetPlayer = (p: gamePlayer | undefined): gamePlayer | undefined => p && {
  ...p,
  dealmissAble: true,
  cards: undefined,
  numCards: 0,
  scoreCards: [],
  isKnowFriend: false,
  isLord: false,
  isRevealed: false,
  isWithdraw: false,
};

export const resetBoard = (b: gameBoard): gameBoard => ({
  ...b,
  dummy: [],
  players: b.players.map(resetPlayer),
  throwed: [],
  giruda: undefined,
  girudaBroken: false,
  friend: undefined,
  friendType: undefined,
  lord: undefined,
  waitingFor: undefined,
  turn: b.friend !== undefined ? findPlayerIdxById(b, b.friend)
    : (b.lord || 0) && findPlayerIdxById(b, b.lord),
  step: 0,
  scoreTarget: 0,
  status: 'T_GS_IDLE',
});
