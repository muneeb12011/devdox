require('dotenv').config({override:true});
const axios = require('axios');
axios.post('https://api.anthropic.com/v1/messages', {
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 100,
  messages: [{role: 'user', content: 'Say hello'}]
}, {
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  }
}).then(r => console.log('OK:', r.data.content[0].text)).catch(e => console.error('FAILED:', e.response?.status, e.response?.data));
