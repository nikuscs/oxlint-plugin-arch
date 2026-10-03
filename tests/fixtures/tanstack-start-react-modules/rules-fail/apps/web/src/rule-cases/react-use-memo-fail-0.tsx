
import {useMemo} from 'react';
function Component({a}) {
  const x = useMemo(async () => {
    await a;
  }, [a]);
  return <div>{x}</div>;
}
