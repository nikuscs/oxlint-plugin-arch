
import {useState} from 'react';
function Component(props) {
  const [state, setState] = useState({a: 0});
  return <div onClick={() => setState({a: state.a + 1})}>{props.foo}</div>;
}
