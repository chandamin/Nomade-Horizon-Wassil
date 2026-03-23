const axios = require('axios')

let cachedToken = null
let tokenExpiry = null

async function getAirwallexToken() {
  const now = Date.now()

  // reuse token if valid (2 min buffer)
  if (cachedToken && tokenExpiry && now < tokenExpiry - 120000) {
    return cachedToken
  }

  const res = await axios.post(
    `${process.env.AIRWALLEX_BASE_URL}/api/v1/authentication/login`,
    {
      client_id: process.env.AIRWALLEX_CLIENT_ID,
      api_key: process.env.AIRWALLEX_API_KEY,
    }
  )

  cachedToken = res.data.token
  tokenExpiry = now + res.data.expires_in * 1000

  return cachedToken
}

module.exports = {
  getAirwallexToken,
}
