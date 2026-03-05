import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function RedirectApp() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') ?? '';
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  if (isIOS) {
    redirect('https://apps.apple.com/us/app/redi-love/id6754899018');
  }
  else {
    redirect('https://redi.love/');
  }

}
