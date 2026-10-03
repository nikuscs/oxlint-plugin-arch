
        import { useState } from 'react';
        function Component(props) {
          // typescript syntax that hermes-parser doesn't understand yet
          const x: `foo${1}` = 'foo1';
          const [state, setState] = useState({a: 0});
          state.a = 1;
          return <div>{props.foo}</div>;
        }
      