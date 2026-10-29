import AppTitle from '@/components/common/app-title/app-title.component';
import { STRINGS } from '@/constants/strings.constant';

export default function Home(): React.JSX.Element {
  return (
    <main>
      <AppTitle text={STRINGS.home.title} />
    </main>
  );
}
