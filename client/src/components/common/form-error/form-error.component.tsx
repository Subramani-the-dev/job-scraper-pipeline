import { cx } from '@/utils/functions.utils';
import styles from './form-error.component.module.scss';

interface FormErrorProps {
  message: string;
  className?: string;
}

export default function FormError({ message, className }: FormErrorProps): React.JSX.Element {
  return (
    <p role="alert" className={cx(styles.error, className)}>
      {message}
    </p>
  );
}
