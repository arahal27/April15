export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { description, amount } = req.body

  const categories = [
    'Food & dining', 'Transport', 'Housing', 'Utilities',
    'Healthcare', 'Entertainment', 'Shopping', 'Business',
    'Education', 'Salary', 'Freelance', 'Investments',
    'Rental income', 'Gifts', 'Other income', 'Other'
  ]

  const type = amount > 0 ? 'income' : 'expense'

  const prompt = `You are a financial transaction categorizer. 
Given this transaction description: "${description}"
Amount: ${amount} (${type})

Pick the single best category from this list:
${categories.join(', ')}

Rules:
- If amount is positive, prefer income categories like Salary, Freelance, Investments, Rental income, Gifts
- If amount is negative, prefer expense categories
- Reply with ONLY the category name, nothing else

Category:`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 50,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const category = data.content[0].text.trim()

  const validCategory = categories.includes(category) ? category : (type === 'income' ? 'Other income' : 'Other')

  res.status(200).json({ category: validCategory })
}