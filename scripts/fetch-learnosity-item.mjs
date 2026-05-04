#!/usr/bin/env node
/**
 * Fetches a Learnosity item + its questions via the Data API and prints
 * the raw JSON to stdout (or writes it to a file with --out <path>).
 *
 * Usage:
 *   node scripts/fetch-learnosity-item.mjs --item <reference>
 *   node scripts/fetch-learnosity-item.mjs --item <reference> --out ./item.json
 *
 * Credentials (in priority order):
 *   1. Environment variables: LEARNOSITY_CONSUMER_KEY, LEARNOSITY_SECRET, LEARNOSITY_DOMAIN
 *   2. Hardcoded defaults (Learnosity public sandbox creds — won't reach production item banks)
 *
 * For production item banks, set the env vars to the credentials from pie-api-aws/.env.
 */

import { createHmac } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------
const CONSUMER_KEY = process.env.LEARNOSITY_CONSUMER_KEY ?? '1JQLtMp0itQcxfSQ';
const SECRET = process.env.LEARNOSITY_SECRET ?? 'jnBfNnhw9zLcYUx6iaLycpZnUGgHdYVTVrEvPPxE';
const DOMAIN = process.env.LEARNOSITY_DOMAIN ?? 'localhost';
const DATA_API_BASE = process.env.LEARNOSITY_DATA_API_BASE ?? 'https://data.learnosity.com';

// ---------------------------------------------------------------------------
// Learnosity SDK signing (translated from the PHP/Node SDK)
// ---------------------------------------------------------------------------
function utcTimestamp() {
  const iso = new Date().toISOString();
  return (
    iso.slice(0, 4) +
    iso.slice(5, 7) +
    iso.slice(8, 10) +
    '-' +
    iso.slice(11, 13) +
    iso.slice(14, 16)
  );
}

function sign(requestBody) {
  const timestamp = utcTimestamp();
  const securityPacket = {
    consumer_key: CONSUMER_KEY,
    domain: DOMAIN,
    timestamp,
  };

  const requestString = JSON.stringify(requestBody);
  const signatureArray = [
    securityPacket.consumer_key,
    securityPacket.domain,
    securityPacket.timestamp,
    requestString,
    'get',
  ];

  const hmac = createHmac('sha256', SECRET);
  hmac.update(signatureArray.join('_'));
  securityPacket.signature = '$02$' + hmac.digest('hex');

  return { security: JSON.stringify(securityPacket), request: requestString, action: 'get' };
}

async function dataGet(entity, requestBody) {
  const signed = sign(requestBody);
  const form = new URLSearchParams();
  form.set('security', signed.security);
  form.set('request', signed.request);
  form.set('action', signed.action);

  const url = `${DATA_API_BASE.replace(/\/$/, '')}/v1/itembank/${entity}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Data API ${entity} returned ${res.status}:\n${text}`);
  }

  const json = JSON.parse(text);
  if (!json.meta?.status) {
    throw new Error(`Data API ${entity} error:\n${JSON.stringify(json.meta, null, 2)}`);
  }

  return json;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const itemRef = args[args.indexOf('--item') + 1];
const outPath = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;

if (!itemRef) {
  console.error('Usage: node scripts/fetch-learnosity-item.mjs --item <reference> [--out <path>]');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Fetch item + questions
// ---------------------------------------------------------------------------
console.error(`Fetching item: ${itemRef}`);

const itemsResp = await dataGet('items', { references: [itemRef], status: ['published'] });
const items = itemsResp.data;

if (!items || items.length === 0) {
  throw new Error(`Item not found: ${itemRef}`);
}

const item = items[0];
console.error(`Found item: ${item.reference} (${item.questions?.length ?? 0} questions)`);

// Collect all question references from the item
const questionRefs = (item.questions ?? []).map((q) => q.reference);

let questions = [];
if (questionRefs.length > 0) {
  console.error(`Fetching ${questionRefs.length} question(s): ${questionRefs.join(', ')}`);
  const questionsResp = await dataGet('questions', { references: questionRefs });
  questions = questionsResp.data ?? [];
}

const result = { item, questions };

const output = JSON.stringify(result, null, 2);

if (outPath) {
  writeFileSync(outPath, output, 'utf-8');
  console.error(`Written to ${outPath}`);
} else {
  process.stdout.write(output + '\n');
}
