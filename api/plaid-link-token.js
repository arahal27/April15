export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.body

  const response = await fetch('https://sandbox.plaid.com/link/token/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      user: { client_user_id: userId },
      client_name: 'April15',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en'
    })
  })

  const data = await response.json()
  res.status(200).json(data)
}