import { gameBoard, gameAction } from '../../types/mighty.d';
import { MAX_SCORE_TARGET, MIN_SCORE_TARGET } from './constants';
import { findPlayerById } from './mighty-util';
import { isDealmiss } from './card';

export default function checkActionValid(
  state: gameBoard,
  action: gameAction,
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
      return (
        state.status === 'T_GS_WAIT_CANDIDACY'
				&& state.players[state.turn]?.id === action.target
				&& !state.players[state.turn]?.isWithdraw
				&& !!state.players[state.turn]?.dealmissAble
				&& isDealmiss(action.cards)
      );

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
