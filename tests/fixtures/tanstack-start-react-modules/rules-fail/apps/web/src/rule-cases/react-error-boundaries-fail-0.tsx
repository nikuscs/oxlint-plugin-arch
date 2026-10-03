
function Component(props) {
  let el;
  try {
    el = <Child />;
  } catch {
    return null;
  }
  return el;
}
