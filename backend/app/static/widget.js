/**
 * ChatSphare Embed Widget Runtime (<15KB Zero-Dependency Vanilla JS)
 */
(function() {
  const currentScript = document.currentScript;
  const agentId = currentScript ? currentScript.getAttribute('data-agent-id') : null;
  const baseUrl = currentScript ? new URL(currentScript.src).origin : window.location.origin;

  if (!agentId) {
    console.warn('[ChatSphare] Missing data-agent-id attribute on embed script.');
  }

  // Create floating widget bubble
  const bubble = document.createElement('div');
  bubble.id = 'chatsphare-bubble';
  bubble.innerHTML = `
    <div style="position: fixed; bottom: 20px; right: 20px; z-index: 99999; display: flex; align-items: center; gap: 8px;">
      <button id="chatsphare-toggle-btn" style="
        width: 60px; height: 60px; border-radius: 30px; background: #6366f1; color: white;
        border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        display: flex; align-items: center; justify-content: center; font-size: 24px; transition: transform 0.2s;
      ">
        💬
      </button>
    </div>
  `;
  document.body.appendChild(bubble);

  let isOpen = false;
  let iframe = null;

  document.getElementById('chatsphare-toggle-btn').addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.src = `${baseUrl}/fullscreen-widget/${agentId || 'default'}`;
        iframe.style.cssText = `
          position: fixed; bottom: 90px; right: 20px; width: 380px; height: 580px;
          border: none; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          z-index: 99999; max-width: calc(100vw - 40px); max-height: calc(100vh - 120px);
        `;
        document.body.appendChild(iframe);
      } else {
        iframe.style.display = 'block';
      }
    } else if (iframe) {
      iframe.style.display = 'none';
    }
  });
})();
