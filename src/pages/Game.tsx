import React, { useState, useEffect, useReducer } from 'react';

import gameBoardReducer from '../rules/mighty/mighty';
import { mightyBoard0 } from '../rules/mighty/mighty-util';

const useBoard = () => {
  useEffect(() => {

  });
};

const GameBoard = (props) => {
  const [state, dispatch] = useReducer(gameBoardReducer, mightyBoard0);
  useEffect;
  return <div />;
};
