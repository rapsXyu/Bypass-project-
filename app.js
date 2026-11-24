#!/usr/bin/env node
/**
 * app.js - Web Version CLEAN
 * Creator: xDonzCode
 * Base: https://xdonzcode.my.id
 */

const express = require('express');
const https = require('https');
const path = require('path');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;


const API_BASE = 'https://api.izzxd.my.id';
const ENDPOINT = '/api/tools/bypass';
const API_KEY = 'izzxd-ich99f8';
const TIMEOUT = 120000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  etag: true,
}));

function request(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: opts.method || 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
        ...(opts.headers || {}),
      },
      timeout: TIMEOUT,
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.on('error', reject);
    req.end();
  });
}

async function bypass(url) {
  if (!url) throw new Error('URL required');
  if (!url.startsWith('http')) throw new Error('URL tidak valid');

  const api = `${API_BASE}${ENDPOINT}?url=${encodeURIComponent(url)}&apikey=${encodeURIComponent(API_KEY)}`;

  const res = await request(api);

  if (res.status !== 200) {
    throw new Error(`API error: HTTP ${res.status}`);
  }

  let json;

  try {
    json = JSON.parse(res.body);
  } catch {
    throw new Error('Invalid JSON response');
  }

  if (!json.status) {
    throw new Error(json.error || 'Bypass gagal');
  }

  return {
    success: true,
    url: url,
    result: json.result?.destination_url || json.result?.short_url,
    data: json.result
  };
}

app.post('/api/bypass', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL wajib diisi'
      });
    }

    const result = await bypass(url);
    res.json(result);
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server Running http://localhost:${PORT}`);
});

module.exports = { request, bypass, app };
