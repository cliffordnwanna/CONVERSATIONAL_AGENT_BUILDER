// AI Agent Builder Embed Script (Demo Only)
// Production deployment requires authentication and API keys

(function() {
  // Create chat widget container
  const container = document.createElement('div');
  container.id = 'ai-agent-widget';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 350px;
    height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: none;
  `;
  
  // Create chat header
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px;
    border-radius: 12px 12px 0 0;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <span>AI Assistant</span>
    <span style="cursor: pointer; font-size: 18px;" onclick="toggleWidget()">×</span>
  `;
  
  // Create chat messages area
  const messages = document.createElement('div');
  messages.id = 'ai-messages';
  messages.style.cssText = `
    height: 350px;
    overflow-y: auto;
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
  `;
  
  // Create input area
  const inputArea = document.createElement('div');
  inputArea.style.cssText = `
    padding: 16px;
    display: flex;
    gap: 8px;
  `;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'ai-input';
  input.placeholder = 'Type your message...';
  input.style.cssText = `
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    outline: none;
  `;
  
  const sendBtn = document.createElement('button');
  sendBtn.textContent = 'Send';
  sendBtn.style.cssText = `
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  `;
  
  inputArea.appendChild(input);
  inputArea.appendChild(sendBtn);
  
  // Create chat toggle button
  const toggle = document.createElement('div');
  toggle.id = 'ai-toggle';
  toggle.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 9998;
    color: white;
    font-size: 24px;
  `;
  toggle.innerHTML = '💬';
  
  // Assemble widget
  container.appendChild(header);
  container.appendChild(messages);
  container.appendChild(inputArea);
  
  // Add to page
  document.body.appendChild(container);
  document.body.appendChild(toggle);
  
  // Toggle functionality
  window.toggleWidget = function() {
    const widget = document.getElementById('ai-agent-widget');
    const toggle = document.getElementById('ai-toggle');
    if (widget.style.display === 'none') {
      widget.style.display = 'block';
      toggle.style.display = 'none';
    } else {
      widget.style.display = 'none';
      toggle.style.display = 'flex';
    }
  };
  
  // Send message functionality (demo only)
  sendBtn.onclick = toggle.onclick = function() {
    const input = document.getElementById('ai-input');
    const messages = document.getElementById('ai-messages');
    
    if (input.value.trim()) {
      // Add user message
      const userMsg = document.createElement('div');
      userMsg.style.cssText = `
        background: #3b82f6;
        color: white;
        padding: 8px 12px;
        border-radius: 12px;
        margin-bottom: 8px;
        max-width: 80%;
        margin-left: auto;
      `;
      userMsg.textContent = input.value;
      messages.appendChild(userMsg);
      
      // Simulate AI response
      setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.style.cssText = `
          background: #f3f4f6;
          color: #1f2937;
          padding: 8px 12px;
          border-radius: 12px;
          margin-bottom: 8px;
          max-width: 80%;
        `;
        aiMsg.textContent = 'This is a demo response. In production, this would connect to your AI agent.';
        messages.appendChild(aiMsg);
        messages.scrollTop = messages.scrollHeight;
      }, 1000);
      
      input.value = '';
      messages.scrollTop = messages.scrollHeight;
    }
  };
  
  // Open widget on toggle click
  toggle.onclick = function() {
    window.toggleWidget();
  };
  
  console.log('AI Agent Widget loaded (Demo Mode)');
})();
