import { cx } from '@/utils/functions.utils';
import styles from './button.component.module.scss';

interface ButtonProps {
  label: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function Button({ label, type = 'button', disabled, onClick, className }: ButtonProps): React.JSX.Element {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cx(styles.button, className)}>
      {label}
    </button>
  );
}
