# RicoAI — Intelligent AI Chatbot

A ChatGPT-style AI chatbot built with vanilla JavaScript, powered by real LLM models through OpenRouter API.


## 🌐 Live Demo
[https://ai-chatbot-two-psi-58.vercel.app](https://ai-chatbot-two-psi-58.vercel.app)

## ✨ Features

- 🤖 Real AI responses powered by multiple LLM models
- 🔀 Multi-model support — switch between Mistral 7B, OpenChat 3.5, Gemma 3, Llama 3.2
- 🎤 Voice input with pause/resume support (Web Speech API)
- 💾 Chat history saved to localStorage
- 🌙 Dark/Light theme toggle
- ⭐ Animated star background with shooting stars
- 📝 Markdown rendering with syntax highlighted code blocks
- 📱 Mobile-first responsive design
- ⚙️ Customizable AI system prompt (personality settings)
- 🔒 API key secured via Vercel serverless function

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **AI API:** OpenRouter (free tier)
- **Deployment:** Vercel (serverless functions)
- **Libraries:** marked.js (markdown), highlight.js (code highlighting)

## 👥 Team

| Name | Branch | Contribution |
|------|--------|-------------|
| OLAYINKA OLUMIDE | `api-integration` | Serverless function, API integration, Vercel deployment |
| [Person 2] | `ui-layout` | UI design, chat bubbles, theme toggle, mobile layout |
| OLAYINKA OLUMIDE | `chat-logic` | Chat history, localStorage, multi-model, voice input |

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18+
- OpenRouter API key (free at [openrouter.ai](https://openrouter.ai))
- Vercel account (free at [vercel.com](https://vercel.com))

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/RicoKay22/ai-chatbot.git
cd ai-chatbot
```

2. Install Vercel CLI:
```bash
npm install -g vercel
```

3. Link to Vercel and pull environment variables:
```bash
vercel link
vercel env pull .env.local
```

4. Run locally:
```bash
vercel dev
```

### Environment Variables

Create a `.env.local` file with:
```
OPENROUTER_API_KEY=your-openrouter-api-key-here
SITE_URL=http://localhost:3000
```

## 📁 Project Structure
```
ai-chatbot/
├── api/
│   └── chat.js          # Vercel serverless function (API key protected)
├── public/
│   ├── index.html       # Main HTML
│   ├── css/
│   │   └── style.css    # All styling
│   └── js/
│       ├── app.js       # Main app logic
│       ├── chat.js      # Chat history & localStorage
│       ├── voice.js     # Voice input
│       └── stars.js     # Star background animation
├── .env.local           # API key (never committed)
├── .gitignore
├── vercel.json          # Vercel configuration
└── README.md
```

## 🔒 Security

The OpenRouter API key is stored as an environment variable on Vercel's servers and is never exposed to the browser. All AI requests are proxied through a serverless function at `/api/chat`.
  