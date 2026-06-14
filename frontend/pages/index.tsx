import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ensureAuthenticated } from '../lib/auth';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    let mounted = true;
    ensureAuthenticated().then((ok) => {
      if (!mounted) return;
      router.replace(ok ? '/dashboard' : '/signup');
    });
    return () => { mounted = false; };
  }, [router]);
  return null;
}
