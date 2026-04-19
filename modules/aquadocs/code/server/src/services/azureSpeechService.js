const axios = require('axios');
const config = require('../config');

/**
 * Returns a short-lived Azure Speech token for the client-side Speech SDK.
 * Token is valid for 10 minutes — clients should refresh before expiry.
 */
async function getSpeechToken() {
  if (!config.azure.speech.key) {
    return {
      token: null,
      region: config.azure.speech.region,
      message: 'Azure Speech not configured. Set AZURE_SPEECH_KEY to enable voice features.',
    };
  }

  const url = `https://${config.azure.speech.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
  const r = await axios.post(url, null, {
    headers: { 'Ocp-Apim-Subscription-Key': config.azure.speech.key },
  });
  return { token: r.data, region: config.azure.speech.region };
}

module.exports = { getSpeechToken };
