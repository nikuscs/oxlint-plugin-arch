interface ButtonProps {
  className?: string;
}

export function Button({ className }: ButtonProps) {
  return <button className={className} type='button'>Save</button>;
}
