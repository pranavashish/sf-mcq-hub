
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'GROQ_API_KEY not set in Vercel env vars' })
    return
  }

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4000,
        temperature: 0.7,
        messages: req.body.messages,   // same messages array from App.jsx
      }),
    })

    const data = await upstream.json()

    const text = data.choices?.[0]?.message?.content || ''
    res.status(upstream.status).json({
      content: [{ type: 'text', text }]
    })
  } catch (err) {
    res.status(500).json({ error: 'Groq API call failed', details: err.message })
  }
}