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

  const ws = new WebSocket(`ws://localhost:${portNumber}`);
  ws.on('message', parseJson(action => {
    console.log(action);
  }))
};
document.getElementById('form').addEventListener('submit', onSubmit);