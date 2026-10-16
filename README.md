# READ BETWEEN — Hair-care intelligence

A Next.js + TypeScript app with a cinematic landing page, photo upload, guided hair profile, and a cautious evidence-oriented verdict.

## Run locally
1. Install Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add an `OPENAI_API_KEY` to enable live image analysis.
4. Run `npm run dev` and open http://localhost:3000.

Without a key, the app uses an explicitly labelled demo analysis. Do not treat demo results as real product advice.

## AI integration
`POST /api/analyze` accepts `{ imageDataUrl, profile }`. With `OPENAI_API_KEY`, it sends the product photo to a multimodal model through a server-side API route and requests structured JSON. The UI asks the user to confirm extracted ingredients before the final verdict. The analysis is educational, not medical advice.
