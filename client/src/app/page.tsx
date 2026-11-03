import { Suspense } from 'react';
import { STRINGS } from '@/constants/strings.constant';
import DashboardScreen from '@/screens/dashboard/dashboard.screen';

// Cache Components: the screen reads cookies and the database, so it renders
// at request time inside a Suspense boundary.
export default function Home(): React.JSX.Element {
  return (
    <Suspense fallback={<p>{STRINGS.dashboard.loading}</p>}>
      <DashboardScreen />
    </Suspense>
  );
}
