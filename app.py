import os
import uuid
from pathlib import Path

from flask import Flask, jsonify, render_template, request, session
from werkzeug.utils import secure_filename

from rag_engine import RAGEngine

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
ALLOWED_EXTENSIONS = {"pdf"}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "rag-pdf-reader-dev-key")
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
app.config["UPLOAD_FOLDER"] = str(UPLOAD_DIR)

engines: dict[str, RAGEngine] = {}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_engine() -> RAGEngine:
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    sid = session["session_id"]
    if sid not in engines:
        engines[sid] = RAGEngine()
    return engines[sid]


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/reader")
def reader():
    engine = get_engine()
    return render_template(
        "reader.html",
        document_name=engine.document_name,
        is_ready=engine.is_ready,
        page_count=engine.page_count,
        chunk_count=engine.chunk_count,
    )


@app.route("/upload", methods=["POST"])
def upload():
    if "pdf" not in request.files:
        return jsonify({"error": "No PDF file provided."}), 400

    file = request.files["pdf"]
    if not file.filename:
        return jsonify({"error": "No file selected."}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "Only PDF files are allowed."}), 400

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = secure_filename(file.filename)
    save_path = UPLOAD_DIR / filename
    file.save(save_path)

    try:
        engine = get_engine()
        meta = engine.load_pdf(save_path)
        return jsonify({"success": True, **meta})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        return jsonify({"error": f"Failed to process PDF: {exc}"}), 500


@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    if not question:
        return jsonify({"error": "Please enter a question."}), 400

    engine = get_engine()
    if not engine.is_ready:
        return jsonify({"error": "Upload a PDF before asking questions."}), 400

    try:
        result = engine.ask(question)
        return jsonify({"success": True, **result})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
