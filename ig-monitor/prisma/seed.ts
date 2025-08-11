import { prisma } from '../app/lib/db';
import { getHandles } from '../app/lib/env';

async function main() {
  const handles = getHandles();
  for (const handle of handles) {
    await prisma.igAccount.upsert({
      where: { handle },
      create: { handle, profileUrl: `https://www.instagram.com/${handle}/` },
      update: {},
    });
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });