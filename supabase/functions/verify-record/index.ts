// Supabase Edge Function: verify-record
// Deploy: supabase functions deploy verify-record
// Env vars needed: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

// @ts-ignore — Deno runtime import, not resolved by the Node TS compiler
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
// @ts-ignore — Deno runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Deno global type shim (satisfies IDE when running outside Deno)
declare const Deno: {
  env: { get(key: string): string | undefined };
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

// ── Category → expected document keywords ──────────────────────────────────
const CATEGORY_HINTS: Record<string, string> = {
  'Certifications': 'certificate, certification, credential, awarded, completion, course',
  'Competitions': 'winner, finalist, rank, hackathon, contest, competition, award, prize',
  'Academic Excellence': 'grade, GPA, honour, merit, dean, distinction, scholarship',
  'Internships': 'internship, intern, offer letter, appointment, joining, company, duration',
  'Conferences & Workshops': 'conference, workshop, seminar, symposium, attendee, speaker, participation',
  'Club Activities': 'club, society, member, activity, event, position',
  'Community Service': 'volunteer, service, community, outreach, NGO, social',
  'Leadership Roles': 'president, secretary, lead, head, captain, coordinator, officer',
};

// ── Supported MIME types ────────────────────────────────────────────────────
const SUPPORTED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;
type SupportedMediaType = typeof SUPPORTED_MEDIA_TYPES[number];

// ── Safe base64 encoding (handles large files without stack overflow) ──────
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

// ── Max image size (4 MB after download — keeps Claude API happy) ──────────
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

// ── Main handler ────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Parsed outside the try so the catch block can reference it for recovery
  let record_id: string | undefined;

  try {
    ({ record_id } = await req.json());
    if (!record_id) return json({ error: 'record_id is required' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch record + student name
    const { data: record, error: fetchErr } = await supabase
      .from('student_records')
      .select('*, profiles(full_name)')
      .eq('id', record_id)
      .single();

    if (fetchErr || !record) return json({ error: 'Record not found' }, 404);

    // No image — mark unverified and return
    if (!record.image_url) {
      await supabase
        .from('student_records')
        .update({
          verification_status: 'unverified',
          verification_notes: 'No evidence document provided.',
          verification_confidence: null,
          verified_at: new Date().toISOString(),
        })
        .eq('id', record_id);
      return json({ status: 'unverified' });
    }

    // Mark pending while AI processes
    await supabase
      .from('student_records')
      .update({
        verification_status: 'pending',
        verification_notes: 'AI is analysing the uploaded document…',
        verification_confidence: null,
      })
      .eq('id', record_id);

    // Download image
    const imgRes = await fetch(record.image_url);
    if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);

    // Validate content type
    const rawContentType = (imgRes.headers.get('content-type') ?? 'image/jpeg')
      .split(';')[0]
      .trim();

    if (!SUPPORTED_MEDIA_TYPES.includes(rawContentType as SupportedMediaType)) {
      // Unsupported file type — flag for manual review instead of crashing
      await supabase
        .from('student_records')
        .update({
          verification_status: 'needs_review',
          verification_notes: `Unsupported file type: ${rawContentType}. Manual review required.`,
          verification_confidence: null,
          verified_at: new Date().toISOString(),
        })
        .eq('id', record_id);
      return json({ status: 'needs_review', reason: `Unsupported file type: ${rawContentType}` });
    }

    const mediaType = rawContentType as SupportedMediaType;

    // Validate file size
    const imgBuffer = await imgRes.arrayBuffer();
    if (imgBuffer.byteLength > MAX_IMAGE_BYTES) {
      await supabase
        .from('student_records')
        .update({
          verification_status: 'needs_review',
          verification_notes: `Image too large (${(imgBuffer.byteLength / 1024 / 1024).toFixed(1)} MB). Manual review required.`,
          verification_confidence: null,
          verified_at: new Date().toISOString(),
        })
        .eq('id', record_id);
      return json({ status: 'needs_review', reason: 'Image exceeds 4 MB limit for AI analysis' });
    }

    // Safe base64 encode (no stack overflow for large files)
    const base64 = uint8ArrayToBase64(new Uint8Array(imgBuffer));

    const studentName = (record.profiles as { full_name: string | null })?.full_name ?? '';
    const categoryHints = CATEGORY_HINTS[record.category] ?? record.category;

    // Call Claude Vision
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              {
                type: 'text',
                text: `You are a document verification engine for an academic achievement platform called AcademiX.

Analyse this uploaded image against the student's claimed submission and return a verification result.

Claimed submission details:
- Student name   : "${studentName}"
- Category       : "${record.category}" (expected keywords: ${categoryHints})
- Achievement    : "${record.title}"
- Claimed date   : "${record.date}"
${record.institution_name ? `- Organisation   : "${record.institution_name}"` : ''}

Evaluate each of the following:
1. Is this a real, legible document / official screenshot / certificate (not a blank image, random photo, or obviously fabricated)?
2. Does the document type match the claimed category "${record.category}"?
3. Is the student's name "${studentName}" visible anywhere in the document? (set to null if text is not readable)
4. Is a date near "${record.date}" (within ±60 days) present? (set to null if no date found)
5. Does the document content relate to the claimed achievement "${record.title}"?
6. If the document appears cropped, blurry, or partially visible, lower your confidence accordingly.

Scoring guidelines:
- 90-100: Strong match on 4-5 criteria, document is clearly genuine
- 75-89:  Good match on 3-4 criteria with minor uncertainties
- 50-74:  Partial match, some criteria unverifiable or mismatched
- 25-49:  Weak match, major inconsistencies detected
- 0-24:   Document appears unrelated, fabricated, or blank

Respond ONLY with valid JSON — no markdown fences, no prose, no explanation outside the JSON:
{
  "is_genuine": true/false,
  "category_match": true/false/null,
  "name_match": true/false/null,
  "date_match": true/false/null,
  "title_match": true/false/null,
  "document_type": "certificate|screenshot|letter|photo|id_card|transcript|unclear",
  "issuer": "string or null",
  "confidence": 0-100,
  "reason": "one concise sentence explaining the verification decision"
}`,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      throw new Error(`Claude API error ${claudeRes.status}: ${errText}`);
    }

    const claudeData = await claudeRes.json();
    const rawText: string = claudeData.content?.[0]?.text ?? '';

    // Parse JSON — strip any markdown fences if present
    let analysis: {
      is_genuine: boolean;
      category_match: boolean | null;
      name_match: boolean | null;
      date_match: boolean | null;
      title_match: boolean | null;
      document_type: string;
      issuer: string | null;
      confidence: number;
      reason: string;
    };

    try {
      const jsonStr = rawText.replace(/```json|```/g, '').trim();
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON object found');
      analysis = JSON.parse(match[0]);
    } catch {
      throw new Error(`Could not parse Claude response: ${rawText.slice(0, 300)}`);
    }

    // Clamp confidence to valid range
    analysis.confidence = Math.max(0, Math.min(100, Math.round(analysis.confidence)));

    // Determine final status
    let status: string;
    if (!analysis.is_genuine) {
      status = 'rejected';
    } else if (analysis.confidence >= 85) {
      status = 'auto_verified';
    } else if (analysis.confidence >= 50) {
      status = 'needs_review';
    } else {
      status = 'rejected';
    }

    // Build detailed notes
    const matchDetails = [
      analysis.name_match === true ? '✓ Name' : analysis.name_match === false ? '✗ Name' : '? Name',
      analysis.date_match === true ? '✓ Date' : analysis.date_match === false ? '✗ Date' : '? Date',
      analysis.category_match === true ? '✓ Category' : analysis.category_match === false ? '✗ Category' : '? Category',
      analysis.title_match === true ? '✓ Title' : analysis.title_match === false ? '✗ Title' : '? Title',
    ].join(', ');

    const notes = [
      analysis.reason,
      `Matches: ${matchDetails}`,
      analysis.issuer ? `Issuer: ${analysis.issuer}` : null,
      `Type: ${analysis.document_type}`,
      `Confidence: ${analysis.confidence}%`,
    ]
      .filter(Boolean)
      .join(' · ');

    await supabase
      .from('student_records')
      .update({
        verification_status: status,
        verification_confidence: analysis.confidence,
        verification_notes: notes,
        verified_at: new Date().toISOString(),
      })
      .eq('id', record_id);

    return json({ status, confidence: analysis.confidence, notes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // Best-effort: flip stuck 'pending' record to needs_review so it isn't
    // invisible to teachers. record_id is in scope from the outer declaration.
    if (record_id) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );
        await supabase
          .from('student_records')
          .update({
            verification_status: 'needs_review',
            verification_notes: `AI verification error — manual review required. Error: ${message.slice(0, 200)}`,
            verified_at: new Date().toISOString(),
          })
          .eq('id', record_id)
          .eq('verification_status', 'pending'); // only touch it if still pending
      } catch {
        // swallow — best-effort only
      }
    }

    return json({ error: message }, 500);
  }
});
