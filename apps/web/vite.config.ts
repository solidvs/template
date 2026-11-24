import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { thirdPartyNotices } from './build/third-party-notices';

export default defineConfig({
  plugins: [react(), thirdPartyNotices()],
  // Never inline assets as data: URLs, so the strict CSP (font-src 'self') holds for small fonts too.
  build: { assetsInlineLimit: 0 },
  server: {
    port: 5173,
    strictPort: true,
    // Same origin in development too: the API session cookie and CSRF rules apply unchanged.
    proxy: { '/api': 'http://localhost:3000' },
  },
});
