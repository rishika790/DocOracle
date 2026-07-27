// DocMind Enterprise — Chat Engine with Markdown, Citations & Actions

document.addEventListener('DOMContentLoaded', () => {
  /* ── DOM References ── */
  const uploadZone    = document.getElementById('upload-zone');
  const pdfInput      = document.getElementById('pdf-input');
  const browseBtn     = document.getElementById('browse-btn');
  const uploadStatus  = document.getElementById('upload-status');
  const statusSpinner = document.getElementById('status-spinner');
  const statusMessage = document.getElementById('status-message');
  const docInfo       = document.getElementById('doc-info');
  const docName       = document.getElementById('doc-name');
  const docPages      = document.getElementById('doc-pages');
  const docChunks     = document.getElementById('doc-chunks');
  const chatForm      = document.getElementById('chat-form');
  const questionInput = document.getElementById('question-input');
  const sendBtn       = document.getElementById('send-btn');
  const chatMessages  = document.getElementById('chat-messages');
  const charCounter   = document.getElementById('char-counter');
  const chatMsgCount  = document.getElementById('chat-msg-count');
  const clearChatBtn  = document.getElementById('clear-chat-btn');
  const exportChatBtn = document.getElementById('export-chat-btn');
  const statusBadge   = document.getElementById('doc-status-badge');
  const statusBadgeTxt= document.getElementById('status-badge-text');

  let docReady      = window.DOC_READY === true;
  let messageCount  = 0;
  const chatHistory = []; // { role, text, timestamp }

  /* ══════════════════════════════════
     TOAST SYSTEM
     ══════════════════════════════════ */
  function showToast(type, title, message, duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark',
                    info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>
    `;

    const close = () => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast-close').addEventListener('click', close);
    container.appendChild(toast);
    if (duration > 0) setTimeout(close, duration);
    return toast;
  }

  /* ══════════════════════════════════
     LIGHTWEIGHT MARKDOWN RENDERER
     ══════════════════════════════════ */
  function renderMarkdown(text) {
    let html = escapeHtml(text);

    // Code blocks (``` ... ```)
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const langLabel = lang || 'code';
      return `<div class="code-block-wrap">
        <div class="code-block-header">
          <span class="code-lang">${langLabel}</span>
          <button class="copy-code-btn" data-code="${encodeURIComponent(code.trim())}">
            <i class="fa-regular fa-copy"></i> Copy
          </button>
        </div>
        <pre><code>${code.trim()}</code></pre>
      </div>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Unordered lists
    html = html.replace(/^(\s*[-*+] .+(\n|$))+/gm, (match) => {
      const items = match.trim().split('\n')
        .map(line => `<li>${line.replace(/^[-*+] /, '').trim()}</li>`).join('');
      return `<ul>${items}</ul>`;
    });

    // Ordered lists
    html = html.replace(/^(\s*\d+\. .+(\n|$))+/gm, (match) => {
      const items = match.trim().split('\n')
        .map(line => `<li>${line.replace(/^\d+\. /, '').trim()}</li>`).join('');
      return `<ol>${items}</ol>`;
    });

    // Horizontal Rule
    html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:12px 0;">');

    // Paragraphs (double newlines)
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = `<p>${html}</p>`;

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<(?:h[1-6]|ul|ol|div|blockquote|pre|hr)[^>]*>)/g, '$1');
    html = html.replace(/(<\/(?:h[1-6]|ul|ol|div|blockquote|pre|hr)>)<\/p>/g, '$1');

    return html;
  }

  /* ══════════════════════════════════
     HELPERS
     ══════════════════════════════════ */
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function updateMessageCount() {
    messageCount++;
    if (chatMsgCount) {
      chatMsgCount.textContent = `${messageCount} message${messageCount !== 1 ? 's' : ''}`;
    }
  }

  function scrollToBottom(smooth = true) {
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  }

  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      btn.classList.add('active');
      setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('active'); }, 2000);
    }).catch(() => showToast('error', 'Copy Failed', 'Could not access clipboard.'));
  }

  /* ══════════════════════════════════
     STATUS HELPERS
     ══════════════════════════════════ */
  function setStatus(type, message, showProgress = false) {
    uploadStatus.hidden = false;
    uploadStatus.className = `upload-status ${type}`;
    statusMessage.textContent = message;
    statusSpinner.hidden = !showProgress;
  }

  function setDocStatusBadge(state, text) {
    if (!statusBadge) return;
    statusBadge.dataset.state = state;
    statusBadgeTxt.textContent = text;
  }

  function enableChat() {
    docReady = true;
    questionInput.disabled = false;
    sendBtn.disabled = false;
    questionInput.focus();
  }

  /* ══════════════════════════════════
     AUTO-RESIZE TEXTAREA
     ══════════════════════════════════ */
  if (questionInput) {
    questionInput.addEventListener('input', () => {
      questionInput.style.height = 'auto';
      questionInput.style.height = Math.min(questionInput.scrollHeight, 160) + 'px';

      const len = questionInput.value.length;
      if (charCounter) {
        charCounter.textContent = len;
        charCounter.className = 'char-counter' + (len > 800 ? ' limit' : len > 600 ? ' warn' : '');
      }
    });
  }

  /* ══════════════════════════════════
     APPEND MESSAGE
     ══════════════════════════════════ */
  function appendMessage(role, rawText, sources = null, skipHistory = false) {
    const isBot  = role === 'bot';
    const time   = formatTime();
    const msgHtml= isBot ? renderMarkdown(rawText) : `<p>${escapeHtml(rawText)}</p>`;
    const msgId  = `msg-${Date.now()}`;

    // Sources HTML
    let sourcesHtml = '';
    if (isBot && sources && sources.length) {
      const cards = sources.map(s => `
        <div class="source-card">
          <div class="source-page-badge">P.${s.page}</div>
          <div class="source-snippet">${escapeHtml(s.snippet)}…</div>
        </div>
      `).join('');
      sourcesHtml = `
        <details class="message-sources">
          <summary class="sources-toggle">
            <i class="fa-solid fa-chevron-right"></i>
            <i class="fa-solid fa-book-open"></i>
            ${sources.length} source passage${sources.length > 1 ? 's' : ''} retrieved
          </summary>
          <div class="sources-list">${cards}</div>
        </details>
      `;
    }

    // Actions (only for bot messages)
    let actionsHtml = '';
    if (isBot) {
      actionsHtml = `
        <div class="message-actions">
          <button class="msg-action-btn copy-answer-btn" title="Copy answer">
            <i class="fa-regular fa-copy"></i> Copy
          </button>
          <button class="msg-action-btn thumbs-up-btn" title="Good answer">
            <i class="fa-regular fa-thumbs-up"></i>
          </button>
          <button class="msg-action-btn thumbs-down-btn" title="Poor answer">
            <i class="fa-regular fa-thumbs-down"></i>
          </button>
        </div>
      `;
    }

    const div = document.createElement('div');
    div.className = `message message--${role}`;
    div.id = msgId;
    div.innerHTML = `
      <div class="message-avatar message-avatar--${role}" aria-hidden="true">
        <i class="fa-solid ${isBot ? 'fa-brain-circuit' : 'fa-user'}"></i>
      </div>
      <div class="message-body">
        <div class="message-header">
          <span class="msg-sender">${isBot ? 'DocMind AI' : 'You'}</span>
          <span class="msg-time">${time}</span>
        </div>
        <div class="message-content">${msgHtml}</div>
        ${sourcesHtml}
        ${actionsHtml}
      </div>
    `;

    chatMessages.appendChild(div);
    scrollToBottom();
    updateMessageCount();

    // Bind code copy buttons
    div.querySelectorAll('.copy-code-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = decodeURIComponent(btn.dataset.code || '');
        copyToClipboard(code, btn);
      });
    });

    // Copy answer
    const copyBtn = div.querySelector('.copy-answer-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => copyToClipboard(rawText, copyBtn));
    }

    // Thumbs
    const thumbUp   = div.querySelector('.thumbs-up-btn');
    const thumbDown = div.querySelector('.thumbs-down-btn');
    if (thumbUp) {
      thumbUp.addEventListener('click', () => {
        thumbUp.classList.toggle('active');
        if (thumbDown) thumbDown.classList.remove('active');
        if (thumbUp.classList.contains('active')) showToast('success', 'Feedback recorded', 'Thanks for rating this response!', 2500);
      });
    }
    if (thumbDown) {
      thumbDown.addEventListener('click', () => {
        thumbDown.classList.toggle('active');
        if (thumbUp) thumbUp.classList.remove('active');
        if (thumbDown.classList.contains('active')) showToast('info', 'Feedback recorded', 'We\'ll work on improving this.', 2500);
      });
    }

    // Track history
    if (!skipHistory) {
      chatHistory.push({ role, text: rawText, time, sources: sources || [] });
    }

    return div;
  }

  /* ══════════════════════════════════
     TYPING INDICATOR
     ══════════════════════════════════ */
  function showTyping() {
    const div = document.createElement('div');
    div.className = 'message message--bot message--typing';
    div.id = 'typing-indicator';
    div.innerHTML = `
      <div class="message-avatar message-avatar--bot" aria-hidden="true">
        <i class="fa-solid fa-brain-circuit"></i>
      </div>
      <div class="message-body">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    chatMessages.appendChild(div);
    scrollToBottom();
  }

  function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  /* ══════════════════════════════════
     FILE UPLOAD
     ══════════════════════════════════ */
  async function uploadFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      showToast('error', 'Invalid File Type', 'Please select a valid PDF file.');
      setStatus('error', '⚠ Only PDF files are supported.');
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Maximum file size is 16 MB.');
      setStatus('error', '⚠ File exceeds 16 MB limit.');
      return;
    }

    setStatus('loading', `Processing "${file.name}" — building FAISS index…`, true);
    setDocStatusBadge('loading', 'Indexing document…');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res  = await fetch('/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error', `⚠ ${data.error || 'Upload failed.'}`);
        setDocStatusBadge('idle', 'Upload failed');
        showToast('error', 'Upload Failed', data.error || 'An unexpected error occurred.');
        return;
      }

      setStatus('success', `✓ "${data.filename}" indexed — ${data.pages} pages, ${data.chunks} chunks.`);

      // Update doc info
      docInfo.hidden = false;
      docName.textContent   = data.filename;
      docPages.textContent  = data.pages;
      docChunks.textContent = data.chunks;

      setDocStatusBadge('ready', `${data.filename} — Ready`);
      enableChat();

      showToast('success', 'Document Ready', `${data.pages} pages and ${data.chunks} chunks indexed.`);
      appendMessage('bot', `**Document indexed successfully!** 🎉\n\nFile **${data.filename}** has been processed:\n- **${data.pages} pages** extracted\n- **${data.chunks} semantic chunks** created\n- **FAISS vector index** built and ready\n\nYou can now ask me anything about this document. I'll answer using only the content retrieved from it.`);

    } catch {
      setStatus('error', '⚠ Network error — is the Flask server running?');
      setDocStatusBadge('idle', 'Connection error');
      showToast('error', 'Network Error', 'Cannot reach the server. Make sure Flask is running.');
    }
  }

  /* ══════════════════════════════════
     UPLOAD ZONE EVENTS
     ══════════════════════════════════ */
  if (uploadZone) {
    uploadZone.addEventListener('click', () => pdfInput.click());
    uploadZone.setAttribute('tabindex', '0');
    uploadZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') pdfInput.click(); });

    browseBtn?.addEventListener('click', e => { e.stopPropagation(); pdfInput.click(); });

    uploadZone.addEventListener('dragover', e => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', e => {
      if (!uploadZone.contains(e.relatedTarget)) uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', e => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      uploadFile(e.dataTransfer.files[0]);
    });

    pdfInput.addEventListener('change', () => {
      if (pdfInput.files[0]) uploadFile(pdfInput.files[0]);
      pdfInput.value = '';
    });
  }

  /* ══════════════════════════════════
     SMART PROMPT BUTTONS
     ══════════════════════════════════ */
  document.querySelectorAll('.tip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!docReady) {
        showToast('warning', 'No Document', 'Please upload a PDF first.');
        return;
      }
      questionInput.value = btn.dataset.question;
      questionInput.dispatchEvent(new Event('input'));
      questionInput.focus();
    });
  });

  /* ══════════════════════════════════
     SEND QUESTION
     ══════════════════════════════════ */
  if (chatForm) {
    chatForm.addEventListener('submit', async e => {
      e.preventDefault();
      const question = questionInput.value.trim();
      if (!question || !docReady) return;

      // Reset input
      appendMessage('user', question);
      questionInput.value = '';
      questionInput.style.height = 'auto';
      if (charCounter) charCounter.textContent = '0';

      // Lock input
      questionInput.disabled = true;
      sendBtn.disabled = true;
      showTyping();

      try {
        const res  = await fetch('/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
        });
        const data = await res.json();
        hideTyping();

        if (!res.ok) {
          appendMessage('bot', `⚠ ${data.error || 'An error occurred. Please try again.'}`);
          showToast('error', 'Query Failed', data.error || 'Something went wrong.');
        } else {
          appendMessage('bot', data.answer, data.sources);
        }
      } catch {
        hideTyping();
        appendMessage('bot', '⚠ Network error — the server may be unreachable. Please check your connection and try again.');
        showToast('error', 'Network Error', 'Could not reach the server.');
      } finally {
        questionInput.disabled = false;
        sendBtn.disabled = false;
        questionInput.focus();
      }
    });

    // Enter to send, Shift+Enter for newline
    questionInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.requestSubmit();
      }
    });
  }

  /* ══════════════════════════════════
     CLEAR CHAT
     ══════════════════════════════════ */
  clearChatBtn?.addEventListener('click', () => {
    // Keep only the welcome message
    chatMessages.innerHTML = `
      <div class="message message--bot" id="welcome-msg">
        <div class="message-avatar message-avatar--bot" aria-hidden="true">
          <i class="fa-solid fa-brain-circuit"></i>
        </div>
        <div class="message-body">
          <div class="message-header">
            <span class="msg-sender">DocMind AI</span>
            <span class="msg-time">${formatTime()}</span>
          </div>
          <div class="message-content">
            <p>Chat cleared. ${docReady ? 'Your document is still indexed — ask me anything!' : 'Upload a PDF to begin.'}</p>
          </div>
        </div>
      </div>
    `;
    messageCount = 0;
    chatHistory.length = 0;
    if (chatMsgCount) chatMsgCount.textContent = '0 messages';
    showToast('info', 'Chat Cleared', 'Conversation history has been reset.');
  });

  /* ══════════════════════════════════
     EXPORT CHAT
     ══════════════════════════════════ */
  exportChatBtn?.addEventListener('click', () => {
    if (!chatHistory.length) {
      showToast('warning', 'Nothing to Export', 'Have a conversation first!');
      return;
    }

    const docTitle = docName?.textContent || 'document';
    let md = `# DocMind AI Session Export\n\n`;
    md += `**Document:** ${docTitle}\n`;
    md += `**Exported:** ${new Date().toLocaleString()}\n\n---\n\n`;

    chatHistory.forEach(({ role, text, time, sources }) => {
      md += `### ${role === 'user' ? '👤 You' : '🤖 DocMind AI'} — ${time}\n\n`;
      md += `${text}\n\n`;
      if (sources && sources.length) {
        md += `**Sources:**\n`;
        sources.forEach(s => { md += `- Page ${s.page}: ${s.snippet}…\n`; });
        md += '\n';
      }
      md += '---\n\n';
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `docmind-session-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'Chat Exported', 'Session saved as a Markdown file.');
  });

  /* ══════════════════════════════════
     INITIAL STATE
     ══════════════════════════════════ */
  if (docReady && statusBadge) {
    setDocStatusBadge('ready', statusBadge.querySelector('#status-badge-text')?.textContent || 'Document Ready');
  }
});
