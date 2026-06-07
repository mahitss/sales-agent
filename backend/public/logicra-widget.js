(function () {
  const scriptTag = document.currentScript;
  const businessId = scriptTag.getAttribute('data-business-id');
  if (!businessId) {
    console.error('Logicra Widget: data-business-id attribute is missing');
    return;
  }

  const frontendUrl = scriptTag.getAttribute('data-frontend-url') || 'http://localhost:3000';

  // Create iframe container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '999999';
  container.style.fontFamily = 'sans-serif';

  // Create floating button
  const button = document.createElement('button');
  button.style.width = '60px';
  button.style.height = '60px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = '#10B981'; // Emerald green
  button.style.color = '#FFFFFF';
  button.style.border = 'none';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.outline = 'none';
  button.style.transition = 'transform 0.2s ease, background-color 0.2s ease';
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = `${frontendUrl}/widget?id=${businessId}`;
  iframe.style.width = '380px';
  iframe.style.height = '580px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '16px';
  iframe.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
  iframe.style.position = 'absolute';
  iframe.style.bottom = '80px';
  iframe.style.right = '0';
  iframe.style.display = 'none';
  iframe.style.opacity = '0';
  iframe.style.transform = 'translateY(20px)';
  iframe.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });

  button.addEventListener('click', () => {
    if (iframe.style.display === 'none') {
      iframe.style.display = 'block';
      // Reflow
      iframe.offsetHeight;
      iframe.style.opacity = '1';
      iframe.style.transform = 'translateY(0)';
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    } else {
      iframe.style.opacity = '0';
      iframe.style.transform = 'translateY(20px)';
      setTimeout(() => {
        iframe.style.display = 'none';
      }, 250);
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
    }
  });

  // Handle window message to close iframe if requested
  window.addEventListener('message', (event) => {
    if (event.data === 'close-logicra-widget') {
      button.click();
    }
  });

  container.appendChild(iframe);
  container.appendChild(button);
  document.body.appendChild(container);
})();
