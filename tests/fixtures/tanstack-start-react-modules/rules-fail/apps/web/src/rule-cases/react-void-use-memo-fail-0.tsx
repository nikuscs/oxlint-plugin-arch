
import {useMemo} from 'react';
function Component() {
  const value = useMemo(() => {}, []);
  return <div>{value}</div>;
}