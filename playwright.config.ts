import { defineConfig } from '@playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: 'e2e',
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // 이 맥에 깔린 Chrome을 쓴다. Chrome이 없으면 `npx playwright install chromium` 후 이 줄을 지운다.
    channel: 'chrome',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
