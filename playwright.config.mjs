import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./e2e',
  timeout:30000,
  retries:1,
  reporter:'list',
  webServer:process.env.CONECTA_EXTERNAL_PREVIEW?undefined:{command:'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 43173 --strictPort',url:'http://127.0.0.1:43173',reuseExistingServer:false},
  use:{baseURL:'http://127.0.0.1:43173',trace:'retain-on-failure',serviceWorkers:'block'},
  projects:[
    {name:'chromium-desktop',use:{...devices['Desktop Chrome']}},
    {name:'chromium-mobile',use:{...devices['iPhone 13'],browserName:'chromium'}},
  ],
});
