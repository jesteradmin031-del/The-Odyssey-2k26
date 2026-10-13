# VERITAS — AI-Powered Claim Verification

**Combating misinformation through AI, evidence, and digital trust.**

VERITAS is an AI-powered claim verification platform that analyzes factual claims from text, URLs, and screenshots. It retrieves relevant web evidence and uses Retrieval-Augmented Generation (RAG) and Google Gemini to evaluate claims and provide evidence-based verdicts with source citations.

Developed by **Team Code Alchemists** for the **Digital Trust & Online Information Verification** hackathon.

## ✨ Key Features

- **Multi-Input Verification:** Submit text, URLs, or screenshots.
- **AI-Powered Analysis:** Extract checkable claims using Google Gemini.
- **Web Evidence Retrieval:** Search and retrieve relevant information from online sources.
- **RAG Pipeline:** Retrieve relevant evidence to support claim evaluation.
- **Evidence-Based Verdicts:** Classify claims as SUPPORTED, CONTRADICTED, MISLEADING, or UNVERIFIED.
- **Source Citations:** Display supporting evidence and explanations.
- **Verification Reports:** Present an overall verdict and a breakdown of individual claims.

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite / React-based tooling
- Tailwind CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- SQLite

### AI and Information Retrieval
- Google Gemini API
- Tavily
- Retrieval-Augmented Generation (RAG)
- Vector embeddings and cosine similarity
- Tavily Search API / DuckDuckGo
- Tesseract OCR for screenshot text extraction

## 📁 Project Structure

```text
VERITAS/
├── frontend/
├── backend/
├── docs/
├── .gitignore
└── README.md
```

The frontend contains the user interface, while the backend handles claim extraction, evidence retrieval, AI evaluation, and report storage.

## ⚙️ Getting Started

### Prerequisites

- Git
- Node.js and npm
- Python 3.11–3.13
- Google Gemini API key
- Tavily API key (optional if using an alternative search provider)
- Tesseract OCR installed for screenshot verification

### Installation

**1. Clone the repository**

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd VERITAS
```

**2. Set up the frontend**

```bash
cd frontend
npm install
```

Configure the frontend environment using the provided `.env.example` file and set the backend API URL.

Start the development server:

```bash
npm run dev
```

**3. Set up the backend**

Open another terminal from the project root:

```bash
cd backend
python -m venv .venv
```

On Windows:

```bash
.venv\Scripts\activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Create a local `.env` file based on `.env.example` and configure the required API keys.

Start the backend using the command appropriate to the implemented application entry point.

> **Note:** Setup commands and file paths may change as the project develops. Update this section to match the final implementation.

## 🔐 Environment Variables

Keep API keys and other secrets in local environment files. Never commit `.env` files or expose credentials publicly.

Use `.env.example` to document the required variable names without including real secrets.

## 🤝 Team Collaboration

This project uses Git and GitHub for collaborative development.

- Create feature branches for individual tasks.
- Commit changes with meaningful messages.
- Push branches to GitHub.
- Open Pull Requests for code review.
- Merge approved changes into the main branch.
- Keep the main branch stable and functional.

Example workflow:

```bash
git switch -c feature/your-feature
git add .
git commit -m "feat: implement your feature"
git push -u origin feature/your-feature
```

## 🎯 Project Goal

To make online information verification more transparent and accessible by helping users examine factual claims against relevant evidence rather than relying solely on unsupported AI-generated answers.

## 👥 Team

**Team Code Alchemists**

Built for the Digital Trust & Online Information Verification hackathon.
