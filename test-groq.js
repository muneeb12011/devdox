require('dotenv').config({override:true});
const axios = require('axios');
axios.post('https://api.groq.com/openai/v1/chat/completions', {
  model: 'llama-3.1-8b-instant',
  max_tokens: 100,
  messages: [{role: 'user', content: 'Say hello'}]
}, {
  headers: {
    'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
    'content-type': 'application/json'
  }
}).then(r => console.log('OK:', r.data.choices[0].message.content)).catch(e => console.error('FAILED:', e.response?.status, JSON.stringify(e.response?.data)));
