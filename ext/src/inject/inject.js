// import WebSocket from 'ws';

// const parseJson = cd => data => {
// 	cb(JSON.parse(data));
// }

// const handleScroll = y => {
// 	document.scrollingElement.scrollTop = y;
// }

// const listenWebSocket = portNumber => {
// 	const ws = new WebSocket(`ws://localhost:${portNumber}`);
// 	ws.on('message', parseJson(action => {
// 		switch (action.type) {
// 			case 'SCROLL':
// 				handleScroll(action.scrollY);
// 			default:
// 				return;
// 		}
// 	}));
// }

// chrome.runtime.onMessage.addListener((action) => {
// 	switch (action.type) {
// 		case 'LISTEN_WEB_SOCKET':
// 			listenWebSocket(action.portNumber);
// 		defualt:
// 			return;
// 	}
// })
