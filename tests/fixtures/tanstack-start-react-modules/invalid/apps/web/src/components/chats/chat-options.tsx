interface Options {
  text: string;
}

export function ChatOptions({ text }: Options) {
  return <p>{text}</p>;
}
