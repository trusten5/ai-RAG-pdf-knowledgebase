<p align="center">
  <a href="https://thrust-mvp-git-main-trusten5s-projects.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Launch-Demo-blue?style=for-the-badge&logo=vercel" alt="Launch Demo" />
  </a>
</p>


# AI-Powered Document Knowledge Assistant

An open-source, full-stack **RAG (Retrieval-Augmented Generation)** platform that transforms PDFs into executive summaries, markdown-style notes, and slide bullets — powered by LLMs and vector search.

Built with:
- **Next.js + Tailwind CSS** frontend
- **FastAPI** backend
- **Supabase** for auth/storage
- **OpenAI + pgvector** for embeddings and semantic search

---

## ✨ Features

- 📄 **Upload & Parse PDFs**: Automatic chunking and embedding of documents
- 🔍 **Semantic Memory (RAG)**: Query documents via vector search and LLM augmentation
- 🧠 **LLM Summarization**: Extract executive summaries, markdown sections, and presentation-ready bullets
- 💬 **Chat Interface**: Interact with documents using a project-level assistant
- 🏷️ **Feedback Workflow**: Tag vague/inaccurate responses and log feedback via PostHog
- 🧱 **Modular Stack**: Easily extend with more models, storage, or evaluation layers
- 🚀 **Production-Ready Deployment**: Designed for Vercel, Railway, Supabase

---

## 📁 Project Structure

```

thrust-mvp/
├── backend/          # FastAPI backend (Python)
│   └── app/          # API routes, LLM logic, embeddings
├── frontend/         # Next.js frontend (TypeScript + Tailwind)
│   └── src/          # UI, chat logic, uploads, dashboards
└── README.md         # You're here

```

---

## 🧪 Live Demo

Try the live demo here:  
👉 [https://thrust-mvp-git-main-trusten5s-projects.vercel.app/](https://thrust-mvp-git-main-trusten5s-projects.vercel.app/)

> Note: This is a demo instance, [contact](mailto:tlehmannkarp@g.hmc.edu) me for access code and commercial use.


---

## 🔧 Tech Stack

| Layer       | Tool                     |
|-------------|--------------------------|
| Frontend    | Next.js, Tailwind CSS    |
| Backend     | FastAPI, OpenAI API      |
| Database    | Supabase, PostgreSQL     |
| Embeddings  | OpenAI `text-embedding-3-large` + pgvector |
| Hosting     | Vercel (frontend), Railway (backend) |
| Analytics   | PostHog (user feedback tracking) |

---

## ⚙️ Environment Variables

### Backend (`.env`)
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL_NAME=your_preferred_openai_model
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
````

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* Python (v3.8+)
* Supabase account

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🛠 Development

* Backend: `http://localhost:8000`
* Frontend: `http://localhost:3000`
* FastAPI Docs: `http://localhost:8000/docs`

---

## 🧩 Deployment

* **Frontend** → [Vercel](https://vercel.com/)
* **Backend** → [Railway](https://railway.app/)
* **Database** → [Supabase](https://supabase.com/)

---

## 💼 Use Cases

* Consulting teams analyzing reports (e.g., 10-Ks, diligence docs)
* Small firms creating internal document knowledge bases
* Students, analysts, or researchers summarizing lengthy PDFs

---

## 📦 Customization Ideas

* Swap OpenAI for Claude, Gemini, or Mistral
* Extend prompt flows for document classification or extraction
* Add document filters, search UX, or history view
* Integrate LangChain or LlamaIndex backends

---

## 🧠 Learn More About RAG

This project uses **Retrieval-Augmented Generation (RAG)**:

* Chunks documents
* Embeds and stores vectors in pgvector
* Retrieves relevant content via similarity search
* Injects it into LLM prompts for grounded responses

---

## 📄 License

**Business Source License (BUSL-1.1)** — free for personal and evaluation use.
For commercial use, please [contact](mailto:tlehmannkarp@g.hmc.edu) or open an issue.

> Want help deploying or white-labeling this for your team? Reach out.

---

## 🙏 Acknowledgments

Built with tools from:

* OpenAI
* Supabase
* pgvector
* Vercel / Railway
* FastAPI

```
