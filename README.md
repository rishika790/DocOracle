# 📄 DocOracle — AI-Powered PDF Question Answering

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python" />
  <img src="https://img.shields.io/badge/Flask-3.0%2B-black?style=for-the-badge&logo=flask" />
  <img src="https://img.shields.io/badge/LangChain-0.3%2B-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Groq-LLaMA%203.3-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/FAISS-Vector%20Store-purple?style=for-the-badge" />
</p>

> **DocOracle** is a web application that lets you upload any PDF and ask questions about it in natural language. It uses a **Retrieval-Augmented Generation (RAG)** pipeline powered by Groq's blazing-fast LLaMA 3.3 model, HuggingFace embeddings, and a FAISS vector store — all wrapped in a clean Flask web UI.

---

## ✨ Features

- 📤 **PDF Upload** — Upload any PDF (up to 16 MB)
- 🔍 **Semantic Search** — Finds the most relevant chunks from your document using vector similarity
- 🤖 **AI Answers** — Powered by Groq's `llama-3.3-70b-versatile` for fast, accurate responses
- 📌 **Source Citations** — Answers come with page numbers and text snippets for verification
- 🔐 **Session Isolation** — Each user gets their own isolated RAG engine instance
- ⚡ **Lazy Loading** — Embeddings and LLM are initialized only when needed

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Web Framework** | Flask 3.0+ |
| **LLM** | Groq API — `llama-3.3-70b-versatile` |
| **Embeddings** | HuggingFace — `sentence-transformers/all-MiniLM-L6-v2` |
| **Vector Store** | FAISS (CPU) |
| **PDF Parsing** | PyPDF via LangChain Community |
| **RAG Framework** | LangChain (Classic + Core + Community) |
| **Environment** | python-dotenv |

---

## 📁 Project Structure

```
DocOracle/
├── app.py              # Flask application & API routes
├── rag_engine.py       # RAGEngine class — core PDF processing & QA logic
├── requirements.txt    # Python dependencies
├── .env                # Environment variables (API keys) — not committed
├── .gitignore          # Git ignore rules
├── templates/
│   ├── base.html       # Base HTML template
│   ├── index.html      # Home / Upload page
│   └── reader.html     # PDF Reader & Q&A interface
├── static/             # CSS, JS, and other static assets
├── uploads/            # Uploaded PDF files (auto-created)
├── faiss_index/        # FAISS vector index storage
└── Data/               # Additional data files
```

---

## 🚀 Getting Started

### Prerequisites

- Python **3.10** or higher
- A **Groq API Key** (free at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/DocOracle.git
cd DocOracle
```

### 2. Create a Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_flask_secret_key_here   # optional, has a default
```

> 💡 Get your free Groq API key from [console.groq.com](https://console.groq.com)

### 5. Run the Application

```bash
python app.py
```

Open your browser and navigate to **[http://localhost:5000](http://localhost:5000)**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Home page — PDF upload interface |
| `GET` | `/reader` | PDF reader & Q&A page |
| `POST` | `/upload` | Upload and process a PDF file |
| `POST` | `/ask` | Ask a question about the loaded PDF |
| `GET` | `/health` | Health check endpoint |

### `POST /upload`

**Request**: `multipart/form-data` with field `pdf` (PDF file)

**Response (success)**:
```json
{
  "success": true,
  "filename": "document.pdf",
  "pages": 42,
  "chunks": 130
}
```

### `POST /ask`

**Request**:
```json
{ "question": "What is the main topic of this document?" }
```

**Response (success)**:
```json
{
  "success": true,
  "answer": "The document discusses...",
  "sources": [
    { "page": "3", "snippet": "Relevant text snippet from page 3..." }
  ]
}
```

---

## ⚙️ Configuration

You can tweak the following constants in `rag_engine.py`:

| Constant | Default | Description |
|----------|---------|-------------|
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | HuggingFace embedding model |
| `LLM_MODEL` | `llama-3.3-70b-versatile` | Groq LLM model |
| `CHUNK_SIZE` | `1000` | Characters per text chunk |
| `CHUNK_OVERLAP` | `200` | Overlap between consecutive chunks |
| `RETRIEVAL_K` | `3` | Number of chunks retrieved per query |

File upload limit can be changed in `app.py`:

```python
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
```

---

## 🧠 How It Works

```
PDF Upload
    │
    ▼
PyPDFLoader ──► Extract text from all pages
    │
    ▼
RecursiveCharacterTextSplitter ──► Split into overlapping chunks
    │
    ▼
HuggingFaceEmbeddings ──► Convert chunks to vector embeddings
    │
    ▼
FAISS VectorStore ──► Store & index embeddings
    │
    ▼
User asks a question
    │
    ▼
FAISS Retriever ──► Find top-K most relevant chunks
    │
    ▼
ChatGroq (LLaMA 3.3) ──► Generate answer from context
    │
    ▼
Response with answer + source page citations
```

---

## 🙌 Acknowledgements

- [LangChain](https://www.langchain.com/) — RAG framework
- [Groq](https://groq.com/) — Ultra-fast LLM inference
- [FAISS](https://github.com/facebookresearch/faiss) — Vector similarity search by Meta
- [HuggingFace Sentence Transformers](https://www.sbert.net/) — Text embeddings

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
