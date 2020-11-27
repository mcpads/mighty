import {
	card, player, board, playerId,
} from './game.d';

export type girudable = 'spade' | 'diamond' | 'heart' | 'club' | 'without';

export type gameStatus =
	| 'T_GS_IDLE'
	| 'T_GS_DISTRIBUTING'
	| 'T_GS_WAIT_CANDIDACY'
	| 'T_GS_WAIT_DISCARD'
	| 'T_GS_WAIT_FRIEND'
	| 'T_GS_WAIT_DEALER_ACTION'
	| 'T_GS_BEFORE_MAIN'
	| 'T_GS_MYTURN'
	| 'T_GS_OTHERTURN'
	| 'T_GS_CALCULATE_THROWED'
	| 'T_GS_CALCULATE_ALL_GAME'
	| 'T_GS_END'
	| 'T_GS_NAGARI';

export type throwAuxAction =
	| { type: 'T_THROW_JOKER'; auxSuit: 'spade' | 'diamond' | 'heart' | 'club' }
	| { type: 'T_THROW_JOKER_CALL' };

export interface gamePlayer extends player {
	scoreCards: card[];
	winCount: number;
	lossCount: number;
	isKnowFriend: boolean;
	isRevealed: boolean;
	isLord: boolean;
	isMe: boolean;
	isWithdraw: boolean;
	networkStatus?: 'T_PNS_OK' | 'T_PNS_DISCONN';
	dealmissAble: boolean;
}

export interface gameBoard extends board<gamePlayer, gameStatus> {
	giruda?: girudable;
	girudaBroken: boolean;
	throwed: { player: playerId; card: card; aux?: throwAuxAction }[];
	scoreTarget: number;
	lord?: playerId;
	friend?: playerId;
	friendType?: card | playerId;
	turn: number;
	step: number; // 몇번째 돌았는지
	nowRule?: throwAuxAction;
	readonly totalCard: number;
}

export type gameAction =
	| { type: 'T_GA_RESET' | 'T_GA_MAIN' | 'T_GA_EPILOG' }
	| {
			type: 'T_GA_ADD_PLAYER';
			target: playerId;
			name: string;
			position: number;
		}
	| { type: 'T_GA_REMOVE_PLAYER'; target: playerId }
	| { type: 'T_GA_START'; initializer: playerId }
	| {
			type: 'T_GA_CARD_DISTRIBUTE';
			cards?: card[];
			count: number;
			target: playerId;
		}
	| { type: 'T_GA_PROLOG' }
	| {
		type: 'T_GA_DEAL_MISS'
		cards: card[]
		type: 'DEAL_MISS'
		target: playerId;
	}
	| {
			type: 'T_GA_ADD_CANDIDACY';
			suit: girudable;
			count: number;
			type: 'CANDIDACY'
			target: playerId;
		}
	| { type: 'T_GA_WITHDRAW_CANDIDACY'; target: playerId }
	| { type: 'T_GA_ELECTED'; target: playerId }
	| {
			type: 'T_GA_ADD_LORD_CARDS';
			target: playerId;
			cards?: card[];
			count: number;
		}
	| {
			type: 'T_GA_CARD_DISCARD';
			cards?: card[];
			count: number;
			target: playerId;
		}
	| { type: 'T_GA_FRIEND_DECLARE'; target: card | playerId | undefined }
	| {
			type: 'T_GA_THROW_CARD';
			value: card;
			target: playerId;
			auxAction?: throwAuxAction;
		}
	| { type: 'T_GA_SWEEP_THROWED'; target: playerId }
	| { type: 'T_GA_DECLARE_WIN'; winnerType: 'T_WIN_LORD' | 'T_WIN_PEOPLE' };
