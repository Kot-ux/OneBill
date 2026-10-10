const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fileUri = typeof body.file_uri === 'string' ? body.file_uri : '';
    if (!fileUri || fileUri.length > 400 || !fileUri.includes('private')) {
      return Response.json({ error: 'A private bill file is required' }, { status: 400 });
    }

    const signed = await db.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: fileUri,
      expires_in: 300,
    });
    if (!signed || !signed.signed_url) {
      return Response.json({ error: 'Could not open that file' }, { status: 400 });
    }

    const extracted = await db.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are reading one phone or telecom bill (Canadian carrier). Extract the total amount due as a plain number without currency symbols, the payment due date in YYYY-MM-DD format, the carrier or operator name, the single best fitting category from [plan, data, calls, add_ons, roaming, device, taxes, other], and a short description of at most 12 words. Omit any field you cannot read confidently. Never invent a value.',
      file_urls: [signed.signed_url],
      response_json_schema: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          due_date: { type: 'string' },
          carrier: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' },
        },
      },
    });

    const data = extracted && typeof extracted === 'object' ? extracted : {};
    return Response.json({
      amount: typeof data.amount === 'number' ? data.amount : null,
      due_date: typeof data.due_date === 'string' ? data.due_date.slice(0, 10) : '',
      carrier: typeof data.carrier === 'string' ? data.carrier.slice(0, 60) : '',
      category: typeof data.category === 'string' ? data.category.slice(0, 20) : '',
      description: typeof data.description === 'string' ? data.description.slice(0, 120) : '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}