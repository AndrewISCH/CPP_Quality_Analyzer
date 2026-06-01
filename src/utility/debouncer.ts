import { TRIGGER_ON_TYPE_DELAY_IN_MS } from '../constants/constants';

export const debouncer = <U extends unknown[]>(
  func: (...args: U) => unknown,
  delay: number = TRIGGER_ON_TYPE_DELAY_IN_MS
) => {
  let timeout: NodeJS.Timeout;
  return function (...args: U) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  };
};
