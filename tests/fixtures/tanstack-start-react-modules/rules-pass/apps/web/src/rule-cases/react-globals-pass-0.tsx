
import {useEffect} from 'react';
let someGlobal = false;
function Component() {
  useEffect(() => {
    someGlobal = true;
  }, []);
  return <div />;
}
