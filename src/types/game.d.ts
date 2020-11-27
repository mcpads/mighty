export type suit = 'spade' | 'diamond' | 'heart' | 'club' | 'joker'
export type rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'JO'

export type card = {
  suit: suit,
  rank: rank,
}

export type playerId = number;
export type gameId = string;

export interface player {
  readonly id: playerId,
  name: string,
  score: number,
  cards?: card[],
  numCards: number,
}

export interface board<P extends player, State> {
  dummy: card[],
  players: (P | undefined)[],
  status: State,
  myId: playerId,
  waitingFor?: playerId,
  prevWin?: playerId,
  readonly gameId: gameId,
  readonly maxPlayerCount: number,
  readonly minPlayerCount: number,
}

export const suitArr: ['spade', 'diamond', 'heart', 'club'] = ['spade', 'diamond', 'heart', 'club'];
export const rankArr: ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
