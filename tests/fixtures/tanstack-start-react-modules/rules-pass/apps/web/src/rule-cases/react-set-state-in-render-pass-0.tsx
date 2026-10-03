
import {useState} from 'react';
function Component(props) {
  const [state, setState] = useState(0);
  return <div onClick={() => setState(state + 1)}>{state}</div>;
}
