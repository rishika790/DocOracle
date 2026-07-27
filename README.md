# 🔮 DocOracle

> **Chat with your PDF documents using AI** — Upload any PDF and ask questions in natural language. DocOracle uses RAG (Retrieval-Augmented Generation) to give you accurate, context-grounded answers.

---

## ✨ Features

- 📄 **PDF Upload** — Upload any PDF document (up to 16 MB)
- 🤖 **AI-Powered Q&A** — Ask questions and get answers from your document
- 🔍 **Source Citations** — Every answer includes page references and snippets
- ⚡ **Fast Embeddings** — Uses HuggingFace `all-MiniLM-L6-v2` for local vector search
- 🧠 **Powered by Llama 3.3** — Uses `llama-3.3-70b-versatile` via Groq API
- 🗃️ **FAISS Vector Store** — Efficient similarity search for relevant document chunks
- 🌐 **Clean Web UI** — Simple Flask-based interface

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Flask |
| LLM | Llama 3.3 70B (via Groq) |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` |
| Vector Store | FAISS |
| RAG Framework | LangChain |
| PDF Parsing | PyPDF |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- A free [Groq API Key](https://console.groq.com/)

### 1. Clone the repository

```bash
git clone https://github.com/rishika790/DocOracle.git
cd DocOracle
```

### 2. Create a virtual environment

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_secret_key_here
```

> 💡 Get your free Groq API key at [console.groq.com](https://console.groq.com/)

### 5. Run the application

```bash
python app.py
```

Open your browser and go to: **http://localhost:5000**

---

## 📖 How It Works

```
PDF Upload → Text Extraction → Chunking → Embeddings → FAISS Index
                                                              ↓
User Question → Query Embedding → Similarity Search → Top-K Chunks
                                                              ↓
                                              LLM (Llama 3.3) → Answer + Sources
```

1. **Upload** a PDF — it gets split into overlapping chunks (1000 chars, 200 overlap)
2. Each chunk is **embedded** using a local HuggingFace model
3. Embeddings are stored in a **FAISS** vector index
4. When you ask a question, the top 3 most relevant chunks are **retrieved**
5. The **LLM** generates an answer grounded only in those chunks

---

## 📁 Project Structure

```
DocOracle/
├── app.py              # Flask app & API routes
├── rag_engine.py       # RAG pipeline (load, embed, query)
├── requirements.txt    # Python dependencies
├── .env                # Environment variables (not committed)
├── templates/          # HTML templates
│   ├── index.html
│   └── reader.html
├── static/             # CSS, JS, assets
├── uploads/            # Uploaded PDFs (temporary)
└── Data/               # Sample data
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Home page |
| `GET` | `/reader` | PDF reader & chat interface |
| `POST` | `/upload` | Upload a PDF file |
| `POST` | `/ask` | Ask a question about the PDF |
| `GET` | `/health` | Health check |

---

## ⚠️ Notes

- The `.env` file is **not committed** to git for security
- Each browser session gets its own isolated RAG engine
- Only **PDF** files are supported (max 16 MB)
- Answers are strictly grounded in the document — the LLM won't hallucinate outside context

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/rishika790">rishika790</a>
</div>
