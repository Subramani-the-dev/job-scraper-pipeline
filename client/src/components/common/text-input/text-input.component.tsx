import { cx } from '@/utils/functions.utils';
import styles from './text-input.component.module.scss';

interface TextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password';
  autoComplete?: string;
  className?: string;
}

export default function TextInput({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  className,
}: TextInputProps): React.JSX.Element {
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={styles.input}
      />
    </div>
  );
}
