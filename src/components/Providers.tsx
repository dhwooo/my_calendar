"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <SWRConfig
          value={{
            fetcher: (url: string) =>
              fetch(url).then((r) => {
                if (!r.ok) throw new Error(`${r.status}`);
                return r.json();
              }),
            revalidateOnFocus: false,
          }}
        >
          {children}
        </SWRConfig>
      </ThemeProvider>
    </SessionProvider>
  );
}
