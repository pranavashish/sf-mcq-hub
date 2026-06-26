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
        model: 'openai/gpt-oss-120b',       
        max_tokens: 8000,                     
        temperature: 0.8,
        response_format: { type: 'json_object' }, 
        messages: req.body.messages,
      }),
    })

    const data = await upstream.json()


    if (!upstream.ok || data.error) {
      res.status(upstream.status || 500).json({
        error: data.error?.message || 'Groq API error',
        code: data.error?.code || null,
      })
      return
    }

    const text = data.choices?.[0]?.message?.content || ''
    res.status(200).json({ content: [{ type: 'text', text }] })
  } catch (err) {
    res.status(500).json({ error: 'Groq API call failed', details: err.message })
  }
}