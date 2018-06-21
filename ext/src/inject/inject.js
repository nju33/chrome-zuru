// import WebSocket from 'ws';

// const parseJson = cd => data => {
// 	console.log(cb, data)
// 	// cb(JSON.parse(data));
// }

const initializeWindowSize = dimension => {
  chrome.runtime.sendMessage(
    {type: 'INITIALIZE_WINDOW_SIZE', dimension},
    () => {}
  );
};

const changePosition = position => {
  chrome.runtime.sendMessage({type: 'CHANGE_POSITION', position}, () => {});
};

const scroll = y => {
  document.scrollingElement.scrollTop = y;
};

const listenWebSocket = portNumber => {
  const ws = new WebSocket(`ws://localhost:${portNumber}`);
  ws.onmessage = ev => {
    const action = JSON.parse(ev.data);
    switch (action.type) {
      case 'INITIALIZE_WINDOW_SIZE':
        initializeWindowSize({
          width: action.width,
					height: action.height,
					top: (action.position || {}).top,
					left: (action.position || {}).left,
        });
      case 'CHANGE_POSITION':
        changePosition(action.position);
      case 'SCROLL':
        scroll(action.scrollY);
      default:
        return;
    }
  };
};

chrome.runtime.onMessage.addListener(action => {
  switch (action.type) {
    case 'LISTEN_WEB_SOCKET':
      listenWebSocket(action.portNumber);
      defualt: return;
  }
});
