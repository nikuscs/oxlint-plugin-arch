
function Button(props) {
  const scrollview = React.useRef<ScrollView>(null);
  return <Button thing={scrollview} />;
}
