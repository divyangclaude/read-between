import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 45;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const imageDataUrl = body?.imageDataUrl;
    const profile = body?.profile ?? {};
    if (typeof imageDataUrl !== 'string' || !/^data:image\/(png|jpeg|jpg|webp);base64,/.test(imageDataUrl)) {
      return NextResponse.json({ error: 'Upload a supported product image first.' }, { status: 400 });
    }
    if (imageDataUrl.length > 16_000_000) {
      return NextResponse.json({ error: 'This image is too large. Please upload a smaller photo.' }, { status: 413 });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        productName: 'Product label needs a live AI provider',
        ingredients: [],
        summary: 'Live image analysis is not configured yet. Add OPENAI_API_KEY on the server to analyse this product. You can still enter the ingredient list manually.',
        confidence: 'Unavailable',
        notes: ['No image analysis was performed because an AI API key is not configured.', 'Do not treat an empty or sample ingredient list as a verified product result.'],
        demo: true,
      });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const prompt = `You are a cautious hair-care label reader. Inspect this image and return ONLY JSON with keys productName, ingredients (array of strings), summary, confidence, notes (array of 3 strings). Read the label, do not invent unreadable ingredients. If unclear, use "[unclear — please verify]" and explain uncertainty. Do not diagnose or claim a product is safe/unsafe from ingredient names alone. Explain context and trade-offs, avoid medical claims, and note that concentration/formulation matter. User profile: ${JSON.stringify(profile)}. Summary must say this is a preliminary ingredient-label reading pending user confirmation. Confidence must be a plain-language estimate of label legibility, not clinical confidence.`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } },
        ] }],
      }),
      signal: AbortSignal.timeout(40000),
    });
    if (!response.ok) {
      const providerError = await response.json().catch(() => null);
      console.error('AI provider error', response.status, providerError?.error?.type || 'unknown');
      return NextResponse.json({ error: response.status === 401 ? 'The AI provider key was rejected. Check your server configuration.' : 'The AI service could not analyse this image right now. Please try again or enter ingredients manually.' }, { status: 502 });
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: 'The AI returned no readable result. Please try a clearer photo.' }, { status: 502 });
    const parsed = JSON.parse(content);
    const ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients.filter((x: unknown) => typeof x === 'string').slice(0, 120) : [];
    const notes = Array.isArray(parsed.notes) ? parsed.notes.filter((x: unknown) => typeof x === 'string').slice(0, 5) : [];
    return NextResponse.json({
      productName: typeof parsed.productName === 'string' ? parsed.productName.slice(0, 160) : 'Hair-care product',
      ingredients,
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 1200) : 'Preliminary label reading; please verify the ingredients.',
      confidence: typeof parsed.confidence === 'string' ? parsed.confidence.slice(0, 80) : 'Uncertain',
      notes,
      demo: false,
    });
  } catch (error) {
    console.error('Analysis route failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'We could not complete the analysis. Try again with a clearer photo or enter ingredients manually.' }, { status: 500 });
  }
}
