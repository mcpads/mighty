/* eslint-disable no-unused-vars */
import {
  useMemo, useState, useEffect, useRef, useCallback,
} from 'react';

import { useLocation } from 'react-router';
import * as Result from './result';
import * as Time from './time';

type validateFunc = (args: string) => boolean;
type settersType = (arg0: string) => void;

export const useBlocker = (init = false) => {
  const [status, setStatus] = useState(init);

  const block = () => setStatus(true);
  const unblock = () => setStatus(false);

  return [status, block, unblock];
};

export const useQuery = () => new URLSearchParams(useLocation().search);

export const useToggle = (init = false) => {
  const [status, setStatus] = useState(init);

  const toggle = () => setStatus((prev) => !prev);

  return [status, toggle];
};

type resultAction<T> = () => Promise<T>

export const useResult = <T>(action: resultAction<T>, reload: undefined | any[] = undefined) => {
  const [status, setStatus] = useState(Result.loading as Result.result<T, Error>);

  useEffect(() => {
    try {
      const result = action();
      result
        .then((res) => setStatus(Result.lift(res)))
        .catch((err) => setStatus(Result.fail(err.message)));
    } catch (e) {
      setStatus(Result.fail(e.message));
    }
  }, reload || []);

  return status;
};

export const useDelayedResult = <T>(action: resultAction<T>, sign: Result.result<T, Error>) => {
  const [status, setStatus] = useState(Result.noReq as Result.result<T, Error>);

  useEffect(() => {
    try {
      if (Result.isData(sign)) {
        const result = action();
        result
          .then((res) => setStatus(Result.lift(res)))
          .catch((err) => setStatus(Result.fail(err.message)));
      }
    } catch (e) {
      setStatus(Result.fail(e.message));
    }
  }, [sign]);

  return status;
};

export const useNowTime = () => {
  const [now, setNow] = useState(Time.getCurrentTime());
  useEffect(() => {
    const id = setInterval(() => setNow(Time.getCurrentTime()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
};

type basicValidateType = {
  readonly [key: string]: validateFunc
}

const basicSetterConds: basicValidateType = {
  password: (v: string) => v.length <= 20,
  email: (v: string) => v.length <= 200,
  confirmCode: (v: string) => v.length <= 10,
};

// eslint-disable-next-line no-unused-vars
type setStateType<U> = ((next: U | ((prev: U) => U)) => void)

// eslint-disable-next-line max-len
const getSetters = <U>(state: U, setState: setStateType<U>) => Object.keys(state).map((prop) => ((v: string) => {
  if (basicSetterConds[prop]) {
    if (basicSetterConds[prop](v)) {
      setState((prev) => ({ ...prev, [prop]: v }));
    }
  } else {
    setState((prev) => ({ ...prev, [prop]: v }));
  }
}) as settersType);

export const useSetters = <U>(state: U, setState: setStateType<U>) => {
  const setters = useMemo(() => getSetters(state, setState), []);
  return setters;
};

type useMoreInterface<T> = {
  loaded: T[],
  isLoading: boolean,
  now: number,
  forceVal: boolean,
  isFirst: boolean,
  blockForce: boolean
}

interface useMoreReturn<T> {
  data: {
    count: number,
    list: T[]
  }
}

export const useLoadmore = <T>(promisedApi: (ith: number) => useMoreReturn<T>,
  reload = undefined) => {
  const [
    {
      loaded, now, forceVal, isFirst, blockForce, isLoading,
    },
    setState,
  ] = useState({
    loaded: [],
    isLoading: false,
    now: 0,
    forceVal: true,
    isFirst: true,
    blockForce: false,
  } as useMoreInterface<T>);

  const forceUpdate = useCallback(() => setState((prev) => (
    { ...prev, forceVal: !prev.forceVal }
  )), [setState]);
  const setNotFirst = useCallback(() => setState((prev) => (
    { ...prev, isFirst: false }
  )), [setState]);
  const setBlock = useCallback((b: boolean) => setState(
    (prev) => ({ ...prev, blockForce: b }),
  ), [setState]);

  const setNowLoading = useCallback(() => setState((prev) => (
    { ...prev, blockForce: true, isLoading: true }
  )), [setState]);

  const level = useRef(0);

  const resolver = useCallback(async ([
    lev,
    {
      data: { list, count },
    },
  ]: [number, useMoreReturn<T>]) => {
    if (lev >= level.current) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        loaded: prev.loaded.concat(list),
        now: prev.now + 1,
        blockForce: prev.loaded.length + list.length >= count,
      }));
    }
    return Promise.resolve();
  }, [setState]);

  useEffect(() => {
    if (isFirst) {
      setNotFirst();
    } else {
      level.current += 1;
      setState((prev) => ({
        ...prev,
        blockForce: false,
        loaded: [],
        now: 0,
        forceVal: !prev.forceVal,
      }));
    }
  }, reload || []);

  useEffect(() => {
    if (!blockForce) {
      const lev = level.current;
      const snow = now;
      setNowLoading();
      Promise.all([Promise.resolve(lev), Promise.resolve(promisedApi(snow))])
        .then(resolver)
        .catch(() => Promise.resolve(setBlock(true)));
    }
  }, [forceVal, promisedApi]);

  return {
    loaded, isBlocked: blockForce, forceUpdate, isLoading,
  };
};
