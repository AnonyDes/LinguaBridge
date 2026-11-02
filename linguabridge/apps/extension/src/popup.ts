import { LinguaBridgeClient } from '@linguabridge/sdk-js';

const client = new LinguaBridgeClient({ baseUrl: 'http://localhost:3001' });

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('api-status');
  const langCountEl = document.getElementById('lang-count');

  try {
    const health = await client.checkHealth();
    if (statusEl) {
      statusEl.textContent = `Online (${health.status})`;
      statusEl.style.color = '#059669';
    }
    const languages = await client.getLanguages();
    if (langCountEl) {
      langCountEl.textContent = `${languages.length} available (Production approved)`;
    }
  } catch (err: any) {
    if (statusEl) {
      statusEl.textContent = 'Offline (Check API connection)';
      statusEl.style.color = '#dc2626';
    }
    if (langCountEl) {
      langCountEl.textContent = 'None available';
    }
  }
});
