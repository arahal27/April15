// v2 - improved categorization
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
        messages: [{
          role: 'user',
          content: `You are a bank transaction categorizer. Bank descriptions often contain extra text like dates, locations, and reference numbers.

Transaction: "${description}"
Amount: ${amount} (${type})

Rules:
- Extract the merchant/purpose from the description and categorize it
- "IN-N-OUT", "MCDONALD", "CHIPOTLE", "STARBUCKS" = Food & dining
- "UBER", "LYFT", "SHELL", "GAS", "AIRLINE", "SOUTHWEST", "QT", "CHEVRON" = Transport
- "NETFLIX", "SPOTIFY", "HULU", "AMC" = Entertainment  
- "AMAZON", "TARGET", "WALMART", "BEST BUY" = Shopping
- "CVS", "WALGREENS", "DOCTOR", "DENTAL", "PHARMACY" = Healthcare
- "ELECTRIC", "WATER", "INTERNET", "SPECTRUM", "AT&T", "UTILITY" = Utilities
- "PAYROLL", "SALARY", "DIRECT DEPOSIT" = Salary
- "ZELLE FROM", "VENMO FROM", "CASH APP FROM", "TRANSFER FROM" = Other income
- "ZELLE TO", "VENMO TO", "TRANSFER TO" = Other
- Positive amounts are usually income
- Pick ONE category from: ${categories.join(', ')}
- Reply with ONLY the category name, nothing else`
        }]
      })
    })

    const raw = await response.text()
    const data = JSON.parse(raw)

    if (data.error || !data.content || !data.content[0]) {
      return res.status(200).json({ category: type === 'income' ? 'Other income' : 'Other' })
    }

    const category = data.content[0].text.trim()
    const validCategory = categories.includes(category) ? category : (type === 'income' ? 'Other income' : 'Other')
    res.status(200).json({ category: validCategory })

  } catch (e) {
    res.status(200).json({ category: type === 'income' ? 'Other income' : 'Other' })
  }
}