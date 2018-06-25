const throttle = (() => {
	let tid = null;

	return (cb, msec) => {
		if (tid !== null) {
			return;
		}

		tid = setTimeout(() => {
			cb();
			tid = null
		}, msec)
	};
})();

const listenEvent = () => {
	document.addEventListener('scroll', throttle(() => {
		chrome.runtime.sendMessage({
			type: 'SCROLL',
			scrollY: document.scrollingElement.scrollTop
		}, () => {});
	}, 80));
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