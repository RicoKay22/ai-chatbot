/**
 * RicoAI - Vercel Serverless Function
 * -----------------------------------------
 * This function acts as a secure proxy between
 * the frontend and OpenRouter API.
 * 
 * - Hides the API key from the browser
 * - Handles error responses gracefully
 * - Supports multiple AI models via OpenRouter
 * - Auto-fallback if selected model fails
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

    // Fallback chain - if selected model fails, try the next one
    const fallbackModels = [
      model || 'nvidia/nemotron-3-nano-30b-a3b:free',
      'stepfun/step-3.5-flash:free',
      'cohere/command-light',
      'mistralai/mistral-7b-instruct',
    ].filter((m, index, self) => self.indexOf(m) === index); // remove duplicates

    let lastError = null;

    for (const currentModel of fallbackModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
            'X-Title': 'RicoAI'
          },
          body: JSON.stringify({
            model: currentModel,
            messages: messages,
            max_tokens: 1024,
            temperature: 0.7
          })
        });

        // Handle specific error codes
        if (response.status === 401) {
          return res.status(401).json({ error: 'Invalid API key. Please check your configuration.' });
        }

        if (!response.ok) {
          const errorData = await response.json();
          lastError = errorData.error?.message || `Model ${currentModel} failed`;
          console.warn(`⚠️ ${currentModel} failed, trying next model...`);
          continue; // try next model
        }

        const data = await response.json();

        const content = data.choices?.[0]?.message?.content 
          || data.choices?.[0]?.text 
          || null;

        if (!content) {
          console.warn(`⚠️ ${currentModel} returned empty content, trying next...`);
          continue; // try next model
        }

        // Success - return response
        return res.status(200).json({
          message: content,
          model: data.model
        });

      } catch (modelError) {
        lastError = modelError.message;
        console.warn(`⚠️ ${currentModel} error: ${modelError.message}, trying next...`);
        continue;
      }
    }

    // All models failed
    return res.status(500).json({
      error: 'All AI models are currently unavailable. Please try again in a moment.'
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Server error. Please try again.'
    });
  }
}
