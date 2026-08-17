import https from 'https'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const description = req.body?.description || ''
  const amount = req.body?.amount || 0
  const type = amount > 0 ? 'income' : 'expense'

  console.log('Received:', description, amount)

  const categories = ['Food & dining', 'Transport', 'Housing', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Business', 'Education', 'Salary', 'Freelance', 'Investments', 'Rental income', 'Gifts', 'Other income', 'Other']

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey || !description) {
    console.log('Missing key or description')
    return res.status(200).json({ category: type === 'income' ? 'Other income' : 'Other' })
  }

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    messages: [{
      role: 'user',
      content: `Categorize: "${description}" (${type}). Pick ONE: ${categories.join(', ')}. Reply with ONLY the name.`
    }]
  })

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }

    const req2 = https.request(options, (response) => {
      let data = ''
      response.on('data', chunk => { data += chunk })
      response.on('end', () => {
        console.log('Claude response:', data)
        try {
          const parsed = JSON.parse(data)
          const category = parsed.content?.[0]?.text?.trim() || ''
          const validCategory = categories.includes(category) ? category : (type === 'income' ? 'Other income' : 'Other')
          console.log('Category:', validCategory)
          res.status(200).json({ category: validCategory })
        } catch (e) {
          console.log('Parse error:', e.message)
          res.status(200).json({ category: type === 'income' ? 'Other income' : 'Other' })
        }
        resolve()
      })
    })

    req2.on('error', (e) => {
      console.log('Request error:', e.message)
      res.status(200).json({ category: type === 'income' ? 'Other income' : 'Other' })
      resolve()
    })

    req2.write(body)
    req2.end()
  })
}