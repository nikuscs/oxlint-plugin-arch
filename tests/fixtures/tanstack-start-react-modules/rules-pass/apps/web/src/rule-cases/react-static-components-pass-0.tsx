
function Inner(props) {
  return <div>{props.text}</div>;
}
function Outer() {
  return <Inner text='hello' />;
}
