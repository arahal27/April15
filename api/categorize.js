export const config = {
  api: {
    bodyParser: true,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { description, amount } = req.body
  const type = amount > 0 ? 'income' : 'expense'

  const categories = ['Food & dining', 'Transport', 'Housing', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Business', 'Education', 'Salary', 'Freelance', 'Investments', 'Rental income', 'Gifts', 'Other income', 'Other']

  const apiKey = process.env.ANTHROPIC_API_KEY
  console.log('API key exists:', !!apiKey)
  console.log('Description received:', description)
  console.log('Amount received:', amount)

  if (!apiKey) {
    console.log('No API key found!')
    return res.status(200).json({ category: type === 'income' ? 'Other income' : 'Other' })
  }

  if (!description) {
    console.log('No description received!')
    return res.status(200).json({ category: type === 'income' ? 'Other income' : 'Other' })
  }

  try {
    console.log('Calling Claude API...')
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
          content: `Categorize this bank transaction: "${description}" (${type}, $${Math.abs(amount)}). Pick ONE from: ${categories.join(', ')}. Reply with ONLY the category name.`
        }]
      })
    })

    console.log('Claude response status:', response.status)
    const raw = await response.text()
    console.log('Claude raw response:', raw)
    const data = JSON.parse(raw)

    if (data.error || !data.content || !data.content[0]) {
      console.log('Invalid Claude response:', JSON.stringify(data))
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