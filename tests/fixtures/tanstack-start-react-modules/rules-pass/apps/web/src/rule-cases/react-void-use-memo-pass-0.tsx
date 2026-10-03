
import {useMemo} from 'react';
function Component({a}) {
  const x = useMemo(() => a + 1, [a]);
  return <div>{x}</div>;
}
