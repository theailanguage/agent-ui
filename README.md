A modern, feature-rich chat interface built with **React 19** and **Tailwind CSS**, powered by Google’s latest **Gemini 3.0** and **Gemini 2.5** models. This application features real-time streaming, multimodal inputs (images/files), image generation, and a unique visualization for the model’s *thinking* process.

---

## ✨ Features

- **🧠 Thinking Process Visualization**  \
  Automatically detects and formats `<think>` tags from Gemini models to show or hide the reasoning process behind answers.

- **💬 Streaming Responses**  \
  Real-time, character-by-character output for a smooth and responsive chat experience.

- **🎨 Image Generation**  \
  Dedicated **Imagine** mode supporting `gemini-2.5-flash-image` and `gemini-3-pro-image-preview`.

- **📁 Multimodal Support**  \
  Attach images and files to prompts for analysis and reasoning.

- **💾 Local Persistence**  \
  Chat history is automatically saved to the browser’s **Local Storage**.

- **🔀 Model Switching**  \
  Instantly toggle between **Flash** (speed-optimized) and **Pro** (reasoning-focused) models.

- **🌓 Dark / Light Mode**  \
  Fully responsive UI with automatic theme detection and manual switching.

- **📝 Markdown Rendering**  \
  Rich rendering for code blocks, tables, lists, and formatted text.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite  \
- **Styling:** Tailwind CSS, Lucide React (icons)  \
- **AI SDK:** `@google/genai` (Google GenAI SDK)  \
- **Markdown:** `react-markdown`

---

## 🚀 Getting Started

### Prerequisites

- Node.js **v18+**
- A Google Cloud project with the **Gemini API** enabled
- An **API key** from Google AI Studio

---

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/theailanguage/agent-ui
cd agent-ui
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the project root (or configure your build environment variables):

```env
API_KEY=your_google_ai_api_key_here
```

> **Note**  \
> The application expects `process.env.API_KEY` to be available.  \
> If you are using **Vite**, you may need to expose this variable using `import.meta.env` or adjust your Vite configuration accordingly.

4. **Start the development server**

```bash
npm start
# or
npm run dev
```

---

## 📂 Project Structure

```
src/
├── components/
│   ├── Chat UI components
│   ├── Sidebar, Message bubbles, Inputs
│   ├── ThinkingExpander.tsx   # Collapsible “Thinking Process” UI
│   └── ImageGenView.tsx       # Dedicated image generation view
│
├── services/
│   └── geminiService.ts       # Google GenAI SDK integration
│
├── types.ts                   # TypeScript types (Messages, Sessions, Config)
├── utils/                     # Helper utilities (Local Storage, etc.)
└── main.tsx / App.tsx
```

---

## 🤖 Supported Models

### Text Generation

- `gemini-3-flash-preview` — **Default**, fast and cost-efficient
- `gemini-3-pro-preview` — Higher reasoning capability

### Image Generation

- `gemini-2.5-flash-image` — Fast image generation
- `gemini-3-pro-image-preview` — High-quality images *(requires paid project key)*

---

## 📄 License

This repository is licensed under the GNU General Public License v3.0.
See the `LICENSE` file for details.

---
