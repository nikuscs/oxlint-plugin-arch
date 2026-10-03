
import {useMemo} from 'react';
function Component({propA}) {
  return useMemo(() => propA.x, [propA]);
}
