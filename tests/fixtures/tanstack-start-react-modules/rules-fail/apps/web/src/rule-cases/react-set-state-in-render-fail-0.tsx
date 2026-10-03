
import {useState} from 'react';
function Component() {
  const [state, setState] = useState(0);
  setState(1);
  return state;
}