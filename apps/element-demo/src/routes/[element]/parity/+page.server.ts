import { error } from '@sveltejs/kit';
import { createHmac } from 'node:crypto';
import type { PageServerLoad } from './$types';

const CONSUMER_KEY = process.env.LEARNOSITY_CONSUMER_KEY;
const SECRET = process.env.LEARNOSITY_SECRET;
const DOMAIN = process.env.LEARNOSITY_DOMAIN ?? 'localhost';

function utcTimestamp(): string {
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

function signItemsInit(itemReference: string): Record<string, unknown> {
  const timestamp = utcTimestamp();
  const requestBody = {
    user_id: 'parity-test-user',
    rendering_type: 'inline',
    name: 'PIE parity test',
    state: 'initial',
    activity_id: 'parity-test',
    session_id: `parity-${Date.now()}`,
    type: 'submit_practice',
    items: [itemReference],
  };

  const securityPacket = {
    consumer_key: CONSUMER_KEY!,
    domain: DOMAIN,
    timestamp,
    user_id: requestBody.user_id,
  };

  const requestString = JSON.stringify(requestBody);
  const signatureArray = [
    securityPacket.consumer_key,
    securityPacket.domain,
    securityPacket.timestamp,
    securityPacket.user_id,
  ];

  const hmac = createHmac('sha256', SECRET!);
  hmac.update(signatureArray.join('_'));
  (securityPacket as any).signature = '$02$' + hmac.digest('hex');

  return { security: securityPacket, request: requestBody };
}

export const load: PageServerLoad = async ({ params, url }) => {
  if (!CONSUMER_KEY || !SECRET) {
    throw error(503, 'Learnosity credentials not configured. Set LEARNOSITY_CONSUMER_KEY and LEARNOSITY_SECRET env vars.');
  }

  const demoId = url.searchParams.get('demo');
  if (!demoId) {
    throw error(400, 'Missing required query param: demo');
  }

  // Dynamically import the sample file — server-side only
  let demos: Array<{ id: string; model?: { source?: { learnosityItemReference?: string } } }>;
  try {
    const elementName = params.element;
    const mod = await import(`$lib/samples/${elementName}.json`);
    demos = mod.default?.demos ?? [];
  } catch {
    throw error(404, `No sample file found for element: ${params.element}`);
  }

  const demo = demos.find((d) => d.id === demoId);
  if (!demo) {
    throw error(404, `Demo not found: ${demoId}`);
  }

  const itemReference = demo.model?.source?.learnosityItemReference;
  if (!itemReference) {
    throw error(400, `Demo "${demoId}" has no learnosityItemReference in model.source`);
  }

  const initPayload = signItemsInit(itemReference);

  return { demoId, itemReference, initPayload };
};
