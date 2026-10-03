
import {useEffect, useState} from 'react';
function Component({onChange}) {
  const [state, setState] = useState(0);
  useEffect(() => {
    onChange(state);
  }, [onChange, state]);
  return <div onClick={() => setState(state + 1)}>{state}</div>;
}
