'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30 * 1000 },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  )
}
