import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
LLM_MODEL = "llama-3.3-70b-versatile"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
RETRIEVAL_K = 3

PROMPT = ChatPromptTemplate.from_template("""
You are a helpful AI assistant that answers questions about uploaded PDF documents.

Answer the user's question ONLY using the provided context.
If the answer is not in the context, say you cannot find that information in the document.

Context:
{context}

Question:
{input}
""")


class RAGEngine:
    def __init__(self):
        self._embeddings = None
        self._llm = None
        self.vectorstore = None
        self.retrieval_chain = None
        self.document_name = None
        self.page_count = 0
        self.chunk_count = 0

    @property
    def embeddings(self):
        if self._embeddings is None:
            self._embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        return self._embeddings

    @property
    def llm(self):
        if self._llm is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY is not set. Add it to your .env file.")
            self._llm = ChatGroq(
                groq_api_key=api_key,
                model=LLM_MODEL,
                temperature=0,
            )
        return self._llm

    @property
    def is_ready(self):
        return self.retrieval_chain is not None

    def load_pdf(self, pdf_path: str | Path) -> dict:
        pdf_path = Path(pdf_path)
        loader = PyPDFLoader(str(pdf_path))
        documents = loader.load()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
        )
        chunks = splitter.split_documents(documents)

        self.vectorstore = FAISS.from_documents(chunks, self.embeddings)
        retriever = self.vectorstore.as_retriever(search_kwargs={"k": RETRIEVAL_K})

        document_chain = create_stuff_documents_chain(self.llm, PROMPT)
        self.retrieval_chain = create_retrieval_chain(retriever, document_chain)

        self.document_name = pdf_path.name
        self.page_count = len(documents)
        self.chunk_count = len(chunks)

        return {
            "filename": self.document_name,
            "pages": self.page_count,
            "chunks": self.chunk_count,
        }

    def ask(self, question: str) -> dict:
        if not self.retrieval_chain:
            raise RuntimeError("No document loaded. Upload a PDF first.")

        response = self.retrieval_chain.invoke({"input": question})
        sources = []
        for doc in response.get("context", []):
            page = doc.metadata.get("page_label") or doc.metadata.get("page", "?")
            sources.append({"page": page, "snippet": doc.page_content[:280].strip()})

        return {
            "answer": response["answer"],
            "sources": sources,
        }
