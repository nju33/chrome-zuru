/**
 * @param {*} func
 * @param {*} limit
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const listenEvent = () => {
  document.addEventListener(
    'scroll',
    throttle(() => {
			// background へポジションを送る
      chrome.runtime.sendMessage(
        {
          type: 'CHROME_SCROLL',
          scrollY: document.scrollingElement.scrollTop
        },
        () => {}
      );
    }, 15)
  );
};

/**
 * @param {number} y zuruアプリの offsetY
 */
const scroll = y => {
  document.scrollingElement.scrollTop = y;
};

/**
 * zuru-app -> background 経由で来たデータの処理
 */
const handleMessage = (() => {
  let initial = true;

  return (action, _, sendResponse) => {
    if (initial) {
      listenEvent();
      initial = false;
    }

    switch (action.type) {
      case 'SCROLL':
        {
          scroll(action.scrollY);
          break;
        }
        default: {
          break;
        }
    }

    sendResponse();
  };
})();

chrome.runtime.onMessage.addListener(handleMessage);
