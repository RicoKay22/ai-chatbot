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

    // Check if any message contains an image
    const hasImage = messages.some(m =>
      Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')
    );

    // Vision-capable models only for image requests
    const visionModels = [
      'google/gemma-3-27b-it:free',
      'mistralai/mistral-small-3.1-24b-instruct:free',
      'nvidia/nemotron-nano-12b-v2-vl:free',
      'google/gemma-3-12b-it:free',
      'google/gemma-3-4b-it:free',
      'nvidia/llama-nemotron-embed-vl-1b-v2:free',
    ];

    // Regular models for text requests - user selected model goes first, then fallbacks
    const textModels = [
      model || 'stepfun/step-3.5-flash:free',
      'stepfun/step-3.5-flash:free',
      'nvidia/nemotron-3-nano-30b-a3b:free',
      'arcee-ai/trinity-large-preview:free',
      'z-ai/glm-4.5-air:free',
      'upstage/solar-pro-3:free',
      'arcee-ai/trinity-mini:free',
      'openai/gpt-oss-120b:free',
      'nvidia/nemotron-nano-9b-v2:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'openai/gpt-oss-20b:free',
      'liquid/lfm-2.5-1.2b-thinking:free',
      'qwen/qwen3-next-80b-a3b-instruct:free',
      'qwen/qwen3-coder:free',
      'liquid/lfm-2.5-1.2b-instruct:free',
      'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
      'nousresearch/hermes-3-llama-3.1-405b:free',
      'qwen/qwen3-4b:free',
      'google/gemma-3n-e4b-it:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'google/gemma-3-4b-it:free',
      'cohere/command-light',
      'mistralai/mistral-7b-instruct',
    ].filter((m, index, self) => self.indexOf(m) === index); // remove duplicates

    const fallbackModels = hasImage ? visionModels : textModels;

    let lastError = null;

    for (const currentModel of fallbackModels) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout per model

        let response;
        try {
          response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            signal: controller.signal,
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
              max_tokens: 2048,
              temperature: 0.7
            })
          });
        } finally {
          clearTimeout(timeout); // always clear timeout after fetch resolves or fails
        }

        // Handle specific error codes
        if (response.status === 401) {
          return res.status(401).json({ error: 'Invalid API key. Please check your configuration.' });
        }

        if (!response.ok) {
          const errorData = await response.json();
          lastError = errorData.error?.message || `Model ${currentModel} failed`;
          console.warn(`⚠️ ${currentModel} failed, trying next model...`);
          continue;
        }

        const data = await response.json();
  
        const content = data.choices?.[0]?.message?.content
          || data.choices?.[0]?.text
          || null;

        if (!content) {
          console.warn(`⚠️ ${currentModel} returned empty content, trying next...`);
          continue;
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
      error: hasImage
        ? 'Vision models are currently at capacity. Please try again in a few minutes.'
        : 'All AI models are currently unavailable. Please try again in a moment.'
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Server error. Please try again.'
    });
  }
} 