import {
	playerId, gameId,
} from '../types/game.d';

import {
	gamePlayer, gameBoard, gameAction, gameStatus,
} from '../types/mighty.d';
import { isDealmiss, isScoreCard } from './dealer';
import { checkThrowable, getWinner } from './mighty/throw';

const MAX_PLAYER_COUNT = 5;
const MIN_PLAYER_COUNT = 5;
const MIN_SCORE_TARGET = 13;
const MAX_SCORE_TARGET = 20;

// 서버 또는 자체 reducer에서 검증 후, 가능하면 서버에 쏘고 accpet/deny를 받는 형태로

// START -> DISTRIBUTE -> PROLOG -> CANDIDACY ->
// ELECTED -> DISTRIBUTE -> DISCARD -> FRIEND -> MAIN ->
// (TURN -> THROW -> SWEEP) -> EPILOG -> DECLARE_WIN -> RESET
// Friend가 없거나 지 자신인 주군의 경우, 처리를 해줘야함

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

const getPlayerPositionById = (state: gameBoard, id: number) => state.players.findIndex(
	(v) => v?.id === id,
);

const getNextTurn = (state: gameBoard, pred: playerCheckPred) => {
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

const resetPlayer = (p: gamePlayer | undefined): gamePlayer | undefined => p && {
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

const resetBoard = (b: gameBoard): gameBoard => ({
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

export function checkActionValid(
	action: gameAction,
	state: gameBoard,
): boolean {
	switch (action.type) {
	case 'T_GA_RESET':
		return state.status === 'T_GS_END' || state.status === 'T_GS_NAGARI';
	case 'T_GA_START':
		return (
			state.status === 'T_GS_IDLE'
				&& state.players.length >= state.minPlayerCount
				&& state.players.length <= state.maxPlayerCount
		);
	case 'T_GA_CARD_DISTRIBUTE':
		return (
			state.status === 'T_GS_DISTRIBUTING'
				|| state.status === 'T_GS_WAIT_DEALER_ACTION'
		);
	case 'T_GA_PROLOG':
		return state.status === 'T_GS_DISTRIBUTING';
	case 'T_GA_ADD_CANDIDACY':
		return (
			state.status === 'T_GS_WAIT_CANDIDACY'
				&& state.players[state.turn]?.id === action.target
				&& action.count >= MIN_SCORE_TARGET
				&& action.count > state.scoreTarget
				&& action.count <= MAX_SCORE_TARGET
				&& !state.players[state.turn]?.isWithdraw
		);

	case 'T_GA_DEAL_MISS':
		return state.status === 'T_GS_WAIT_CANDIDACY'
		&& state.players[state.turn]?.id === action.target
		&& !state.players[state.turn]?.isWithdraw
		&& !!state.players[state.turn]?.dealmissAble
		&& isDealmiss(action.cards);

	case 'T_GA_WITHDRAW_CANDIDACY':
		return (
			state.status === 'T_GS_WAIT_CANDIDACY'
				&& state.players[state.turn]?.id === action.target
				&& !state.players[action.target]?.isWithdraw
		);
	case 'T_GA_ELECTED':
		return (
			state.status === 'T_GS_WAIT_DEALER_ACTION'
				&& state.players.filter((v) => v?.isWithdraw).length === 1
				&& !!findPlayerById(state, action.target)
		);
	case 'T_GA_ADD_LORD_CARDS':
		return (
			state.lord === action.target
      && state.status === 'T_GS_WAIT_DEALER_ACTION'
		);
	case 'T_GA_CARD_DISCARD': {
		const targetPlayer = findPlayerById(state, action.target)!;

		let cardCond = true;
		if (action.target === state.myId) {
			if (action.cards) {
				cardCond = action.cards.every((c) => targetPlayer.cards!.includes(c));
			} else {
				cardCond = false;
			}
		}
		return state.status === 'T_GS_WAIT_DISCARD' && !!targetPlayer && cardCond;
	}
	case 'T_GA_FRIEND_DECLARE':
		return state.status === 'T_GS_WAIT_FRIEND';
	case 'T_GA_MAIN':
		return state.status === 'T_GS_BEFORE_MAIN';
	case 'T_GA_THROW_CARD':
		return (
			(state.status === 'T_GS_MYTURN' || state.status === 'T_GS_OTHERTURN')
				&& state.players[state.turn]?.id === action.target
		);
	case 'T_GA_SWEEP_THROWED':
		return (
			state.status === 'T_GS_CALCULATE_THROWED'
				&& state.throwed.length === state.players.length
		);
	case 'T_GA_DECLARE_WIN':
		return (
			state.status === 'T_GS_CALCULATE_ALL_GAME'
				&& state.players.every((p) => !p?.numCards)
		);
	case 'T_GA_REMOVE_PLAYER':
		return !!findPlayerById(state, action.target);
	case 'T_GA_ADD_PLAYER':
		return (
			!state.players[action.position] && !findPlayerById(state, action.target)
		);
	default:
		return false;
	}
}

export function gameReducer(action: gameAction, state: gameBoard): gameBoard {
	if (!state) throw new Error('Failed to get state');
	if (!checkActionValid(action, state)) {
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
