import { getHandles } from '@/app/lib/env';
import ClientPage from '@/app/ui/ClientPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const handles = getHandles();
  return <ClientPage handles={handles} initialWindow="24h" />;
}