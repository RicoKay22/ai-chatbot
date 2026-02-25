/**
 * RicoAI - Vercel Serverless Function
 * -----------------------------------------
 * This function acts as a secure proxy between
 * the frontend and OpenRouter API.
 * 
 * - Hides the API key from the browser
 * - Handles error responses gracefully
 * - Supports multiple AI models via OpenRouter
 * 
 * Author: Olayinka Olumide
 * Branch: api-integration
 */


export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model } = req.body;

    // Validate incoming data
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Call OpenRouter API using the key stored safely on Vercel
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'RicoAI'
      },
      body: JSON.stringify({
        model: model || 'mistralai/mistral-7b-instruct',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    // Handle OpenRouter errors
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter error:', errorData);

       if (response.status === 429) {
          return res.status(429).json({ 
            error: 'Rate limit reached for this model. Please wait a minute or two, or switch to Mistral 7B.' 
    });
  }
      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid API key. Please check your configuration.' });
      }

      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Something went wrong with the AI service.' 
      });
    }

    const data = await response.json();

    // Make sure we actually got a response
    if (!data.choices || data.choices.length === 0) {
      return res.status(500).json({ error: 'No response received from AI.' });
    }

    // Send back just the message content to the frontend
    return res.status(200).json({
      message: data.choices[0].message.content,
      model: data.model
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Server error. Please try again.' 
    });
  }
}
