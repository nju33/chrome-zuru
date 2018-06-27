const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

const listenEvent = () => {
	document.addEventListener('scroll', throttle(() => {
		chrome.runtime.sendMessage({
			type: 'CHROME_SCROLL',
			scrollY: document.scrollingElement.scrollTop
		}, () => {});
	}, 15));
}

const scroll = y => {
	document.scrollingElement.scrollTop = y;
}

const handleMessage = (() => {
	let initial = true;

	return (action, _, sendResponse) => {
		if (initial) {
			listenEvent();
			initial = false;
		}

		switch (action.type) {
			case 'SCROLL':
				scroll(action.scrollY);
				break;
			defualt: 
				break;
		}
		
		sendResponse();
	};
})();

chrome.runtime.onMessage.addListener(handleMessage);