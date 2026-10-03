
let someGlobal = false;
function Component() {
  const setGlobal = () => {
    someGlobal = true;
  };
  setGlobal();
  return <div>{String(someGlobal)}</div>;
}
