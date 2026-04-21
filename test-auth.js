require('dotenv').config({override:true});
const {createAppAuth} = require('@octokit/auth-app');
const rawKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"/, '').replace(/"$/, '').trim();
const auth = createAppAuth({appId: Number(process.env.APP_ID), privateKey: rawKey, installationId: 125606758});
auth({type: 'installation'}).then(r => console.log('Token first 20:', r.token.substring(0, 20))).catch(e => console.error('Error:', e.message));
