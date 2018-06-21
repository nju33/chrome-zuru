chrome.extension.onMessage.addListener((action, sender, sendResponse) => {
  chrome.windows.getCurrent(currentWindow => {
    switch (action.type) {
      case 'INITIALIZE_WINDOW_SIZE':
        chrome.windows.update(currentWindow.id, action.dimension, () => {
          sendResponse();
        });
      case 'CHANGE_POSITION':
        chrome.windows.update(currentWindow.id, action.position, () => {
          sendResponse();
        });
      default:
        return sendResponse();
    }
  });
});
