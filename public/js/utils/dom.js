export function addGoBackButton() {
  const content = document.getElementById("content");
  if (!content) return;
  if (content.querySelector('#goBackBtn')) return;

  const goBackBtn = document.createElement("button");
  goBackBtn.textContent = "Go Back";
  goBackBtn.className = "go-back-btn";
  goBackBtn.id = "goBackBtn";
  goBackBtn.onclick = async () => {
    const { loadHomePage } = await import('../pages/home.js');
    loadHomePage();
  };
  content.appendChild(goBackBtn);
}

// --- Toast utilities ---
function getToastContainer() {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
}

export function showToast(html, { duration = 8000 } = {}) {
  const container = getToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = html;

  container.appendChild(toast);

  // Auto-hide
  const hide = () => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 220);
  };
  const timer = setTimeout(hide, duration);

  // Close button handler
  const closeBtn = toast.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      clearTimeout(timer);
      hide();
    });
  }

  return toast;
}

export function showComplaintRegistered(complaintId) {
  const toast = showToast(`
    <div class="body">
      <strong>Complaint registered!</strong><br/>
      Your Complaint ID: <code>${complaintId}</code>
    </div>
    <button class="copy-btn" type="button">Copy</button>
    <button class="close-btn" type="button" aria-label="Close">×</button>
  `, { duration: 10000 });

  const copyBtn = toast.querySelector('.copy-btn');
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(complaintId);
      copyBtn.textContent = 'Copied';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.classList.remove('copied');
      }, 1500);
    } catch {
      // Fallback copy
      const ta = document.createElement('textarea');
      ta.value = complaintId;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
      copyBtn.textContent = 'Copied';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.classList.remove('copied');
      }, 1500);
    }
  });
}