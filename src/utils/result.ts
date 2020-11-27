export const RESULT_DATA = 0;
export const RESULT_ERROR = 1;
export const RESULT_LOADING = 2;
export const RESULT_NOREQUEST = 3;

export type result<D, E> =
  { status: 0, result?: D, error?: undefined }
  | { status: 1, result?: undefined, error?: E }
  | { status: 2, result?: undefined, error?: undefined }
  | { status: 3, result?: undefined, error?: undefined }

export const data = <D, E>(d: D): result<D, E> => (
  { status: RESULT_DATA, result: d, error: undefined }
);
export const error = <D, E>(e: E): result<D, E> => ({
  status: RESULT_ERROR,
  result: undefined,
  error: e,
});
export const loading = ({
  status: RESULT_LOADING,
  result: undefined,
  error: undefined,
});
export const noReq = ({
  status: RESULT_NOREQUEST,
  result: undefined,
  error: undefined,
});

// eslint-disable-next-line no-unused-vars
type SingleFunc<A, B> = (arg0: A | undefined) => B;

export const isData = <D, E>(d: result<D, E>) => d.status === RESULT_DATA;
export const isError = <D, E>(d: result<D, E>) => d.status === RESULT_ERROR;
export const isLoading = <D, E>(d: result<D, E>) => d.status === RESULT_LOADING;
export const isNoReq = <D, E>(d: result<D, E>) => d.status === RESULT_NOREQUEST;

export const getData = <D, E>(d: result<D, E>) => d.result;
export const getError = <D, E>(d: result<D, E>) => d.error;

export const fmap = <D, E, U>(d: result<D, E>, f: SingleFunc<D, U>): result<U, E> => (
  d.status === RESULT_DATA ? data(f(d.result)) : d
);
export const lift = data;
export const fail = error;

export const bind = <D, E, U>(d: result<D, E>, f: SingleFunc<D, result<U, E>>) => (
  isData(d) ? f(d.result) : d
);

export const result2code = (d: result<any, any>) => d.status;
