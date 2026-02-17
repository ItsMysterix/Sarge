'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

      if (apiKey) {
        posthog.init(apiKey, {
          api_host: host,
          person_profiles: 'always', // or 'identified_only'
          capture_pageview: false, // We'll handle this manually or via router-integration if needed
          autocapture: true,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id && typeof window !== 'undefined') {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      });
    }
  }, [session]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
