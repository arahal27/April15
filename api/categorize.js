export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { description, amount } = req.body
  const type = amount > 0 ? 'income' : 'expense'

  const categories = [
    'Food & dining', 'Transport', 'Housing', 'Utilities',
    'Healthcare', 'Entertainment', 'Shopping', 'Business',
    'Education', 'Salary', 'Freelance', 'Investments',
    'Rental income', 'Gifts', 'Other income', 'Other'
  ]

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        messages: [{ role: 'user', content: `Categorize this transaction: "${description}". Pick one from: ${categories.join(', ')}. Reply with only the category name.` }]
      })
    })

    const raw = await response.text()
    console.log('Claude raw response:', raw)

    const data = JSON.parse(raw)

    if (data.error) {
      console.log('Claude API error:', data.error.message)
      return res.status(200).json({ category: type === 'income' ? 'Other income' : 'Other' })
    }

    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.log('Unexpected response structure:', raw)
      return res.status(200).json({ category: type === 'income' ? 'Other income' : 'Other' })
    }

    const category = data.content[0].text.trim()
    const validCategory = categories.includes(category) ? category : (type === 'income' ? 'Other income' : 'Other')
    console.log('Final category:', validCategory)
    res.status(200).json({ category: validCategory })

  } catch (e) {
    console.log('Catch error:', e.message)
    res.status(200).json({ category: type === 'income' ? 'Other income' : 'Other' })
  }
}