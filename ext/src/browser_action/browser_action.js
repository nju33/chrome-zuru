import WebSocket from 'ws';

const initialize = () => {
  document.getElementById('port-input').value = '33322';
};
document.addEventListener('DOMContentLoaded', initialize);

const parseJson = cb => jsonStr => {
  cd(JSON.parse(jsonStr));
};

const onSubmit = ev => {
  ev.preventDefault();
  const inputTag = ev.currentTarget[0];
  const portNumber = Number(inputTag.value);

  if (isNaN(portNumber)) {
    return;
  }
  
  if (portNumber < 1024) {
    return;
  }

  if (portNumber > 65535) {
    return;
  }


  // chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
  //   console.log(response.farewell);
  // });
  // const ws = new WebSocket(`ws://localhost:${portNumber}`);
  // ws.on('message', parseJson(action => {
  // }))
  // chrome.tabs.query({active: true, currentWindow: true}, tabs => {
  //   chrome.tabs.sendMessage(tabs[0].id, {type: 'LISTEN_WEB_SOCKET', portNumber}, () => {});
  // });
  console.log(123);
  chrome.storage.local.set({
    portNumber
  }, () => {
    setTimeout(() => {
      chrome.storage.local.clear(() => {});
    }, 1000);
  });
};
document.getElementById('form').addEventListener('submit', onSubmit);