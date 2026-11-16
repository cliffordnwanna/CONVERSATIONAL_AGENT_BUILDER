// Visual portfolio preview only. No public agent, API requests, or simulated AI replies.
(function () {
  if (document.getElementById('agentforge-preview')) return;
  var script = document.currentScript;
  var origin = script && script.src ? new URL(script.src).origin : location.origin;
  var mount = function () {
    if (document.getElementById('agentforge-preview')) return;
    var container = document.createElement('section');
    container.id = 'agentforge-preview';
    container.setAttribute('aria-label', 'AgentForge visual preview');
    container.style.cssText = 'position:fixed;bottom:20px;right:20px;max-width:calc(100vw - 40px);width:320px;z-index:9999;font-family:system-ui,sans-serif;color:#f1f5f9;';
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = 'Open widget concept';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'agentforge-preview-panel');
    toggle.style.cssText = 'display:block;margin-left:auto;padding:12px 18px;border:1px solid #818cf8;border-radius:14px;background:#4338ca;color:white;cursor:pointer;font:inherit;';
    var panel = document.createElement('div');
    panel.id = 'agentforge-preview-panel';
    panel.hidden = true;
    panel.style.cssText = 'padding:20px;margin-bottom:12px;border:1px solid #475569;border-radius:14px;background:#0f172a;box-shadow:0 8px 32px #0005;';
    var title = document.createElement('h2');
    title.textContent = 'Widget concept — not a live agent';
    title.style.cssText = 'font-size:17px;margin:0 0 12px;';
    var text = document.createElement('p');
    text.textContent = 'This visual preview does not send messages or load private knowledge. Try the interactive portfolio playground instead. No agent is published by this script.';
    text.style.cssText = 'font-size:14px;line-height:1.6;';
    var link = document.createElement('a');
    link.href = origin + '/builder';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open playground (new tab)';
    link.style.cssText = 'color:#93c5fd;font-size:14px;';
    panel.appendChild(title); panel.appendChild(text); panel.appendChild(link);
    container.appendChild(panel); container.appendChild(toggle); document.body.appendChild(container);
    toggle.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      toggle.setAttribute('aria-expanded', String(!panel.hidden));
      toggle.textContent = panel.hidden ? 'Open widget concept' : 'Close widget concept';
    });
    container.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) {
        panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Open widget concept'; toggle.focus();
      }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
