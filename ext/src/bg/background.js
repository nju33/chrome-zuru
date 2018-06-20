import WebSocket from 'isomorphic-ws';

// window.__ = _WebSocket;


// //example of using a message handler from the inject scripts
// chrome.extension.onMessage.addListener(
//   function(request, sender, sendResponse) {
//   	chrome.pageAction.show(sender.tab.id);
//     sendResponse();
//   });

chrome.storage.onChanged.addListener(changes => {
  if (!changes.portNumber) {
    return;
  }

  if (!changes.portNumber.newValue) {
    return;
  }

  const ws = new WebSocket(`ws://localhost:${changes.portNumber.newValue}`);
  ws.onopen = function () {
    console.log(arguments);
    return;
  }
  ws.onmessage = function () {
    console.log(arguments);
    return;
  };
  ws.onclose = function () {
    console.log(arguments);
    return;
  };
  ws.onerror = function () {
    console.log(arguments);
    return;
  };
})