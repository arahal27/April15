export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { accessToken } = req.body

  const today = new Date().toISOString().slice(0, 10)
  const startDate = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 10)

  const response = await fetch('https://sandbox.plaid.com/transactions/get', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      access_token: accessToken,
      start_date: startDate,
      end_date: today
    })
  })

  const data = await response.json()
  res.status(200).json(data)
}