export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const description = req.body?.description || ''
    const amount = Number(req.body?.amount) || 0
    const type = amount > 0 ? 'income' : 'expense'

    console.log('Received:', description, amount, type)

    const categories = ['Food & dining', 'Transport', 'Housing', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Business', 'Education', 'Salary', 'Freelance', 'Investments', 'Rental income', 'Gifts', 'Other income', 'Other']

    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log('Has API key:', !!apiKey)

    if (!apiKey || !description) {
      return res.status(200).json({ category: type === 'income' ? 'Other income' : 'Other' })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: `Categorize this bank transaction: "${description}" (${type}). Pick ONE category from this list: ${categories.join(', ')}. Reply with ONLY the category name, nothing else.`
        }]
      })
    })

    const data = await response.json()
    console.log('Claude response:', JSON.stringify(data))

    if (data.error) {
      console.log('API error:', data.error.message)
      return res.status(200).json({ category: type === 'income' ? 'Other income' : 'Other' })
    }

    const category = data.content?.[0]?.text?.trim() || ''
    const validCategory = categories.includes(category) ? category : (type === 'income' ? 'Other income' : 'Other')
    console.log('Final category:', validCategory)
    return res.status(200).json({ category: validCategory })

  } catch (e) {
    console.log('Error:', e.message)
    return res.status(200).json({ category: 'Other' })
  }
}