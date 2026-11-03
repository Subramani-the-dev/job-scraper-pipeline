import { cx } from '@/utils/functions.utils';
import styles from './stat-card.component.module.scss';

interface StatCardProps {
  text: string;
  className?: string;
}

export default function StatCard({ text, className }: StatCardProps): React.JSX.Element {
  return <p className={cx(styles.card, className)}>{text}</p>;
}
