// Minimal mock backend for pinning note metadata
// Usage: node index.js
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(cors());
// allow larger payloads (images as base64 in JSON) — set to 10mb, adjust if needed
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// in-memory store for notes
const notes = new Map();

// create note helper (front already creates note locally; this is optional)
app.post('/api/notes', (req, res) => {
  const id = (Math.random() + 1).toString(36).substring(2, 10);
  const note = req.body;
  notes.set(id, note);
  res.json({ id });
});

// pin endpoint - return tokenURI and digest (simulate IPFS pin)
app.post('/api/notes/:id/pin', (req, res) => {
  const id = req.params.id;
  const note = req.body;
  if (!note || !note.title) return res.status(400).json({ error: 'invalid note' });

  const metadata = {
    name: note.title,
    description: note.content || '',
    image: note.images && note.images.length ? note.images[0] : undefined,
    attributes: [
      { trait_type: 'date', value: note.date },
      { trait_type: 'mood', value: note.mood || '' },
      { trait_type: 'location', value: note.location || '' }
    ].filter(a => a.value !== undefined && a.value !== ''),
  };

  const json = JSON.stringify(metadata);
  const cid = crypto.createHash('sha256').update(json).digest('hex').slice(0, 46);
  const tokenURI = `ipfs://${cid}`;
  // keccak256 digest using crypto (node's sha3 not available) — produce a hex prefixed value
  const digest = '0x' + crypto.createHash('sha256').update(json).digest('hex').slice(0, 64);

  notes.set(id, Object.assign({}, note, { tokenURI, digest }));

  res.json({ tokenURI, digest });
});

const port = process.env.PORT || 5175;
app.listen(port, () => console.log(`Mock pin server listening on http://localhost:${port}`));
