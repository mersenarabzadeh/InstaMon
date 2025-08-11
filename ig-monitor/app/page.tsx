import { getHandles } from './lib/env';
import ClientPage from './ui/ClientPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const handles = getHandles();
  return <ClientPage handles={handles} initialWindow="trending" />;
}
