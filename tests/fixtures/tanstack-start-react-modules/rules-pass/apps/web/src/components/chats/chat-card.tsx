export interface ChatCardProps {
  title: string;
}

export function ChatCard({ title }: ChatCardProps) {
  return <h2>{title}</h2>;
}
