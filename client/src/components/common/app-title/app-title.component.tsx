interface AppTitleProps {
  text: string;
}

export default function AppTitle({ text }: AppTitleProps): React.JSX.Element {
  return <h1>{text}</h1>;
}
