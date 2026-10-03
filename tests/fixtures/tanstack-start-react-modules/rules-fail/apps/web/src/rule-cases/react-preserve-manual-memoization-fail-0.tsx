
import {useCallback} from 'react';
function useFoo(props) {
  const x = [];
  useHook();
  x.push(props);
  return useCallback(() => {
    doSomething();
    doSomethingElse();
    return [x];
  }, [x]);
}
