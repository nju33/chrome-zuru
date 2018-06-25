const initialize = () => {
  document.getElementById('port-input').value = '33322';
};
document.addEventListener('DOMContentLoaded', initialize);

const parseJson = cb => jsonStr => {
  cd(JSON.parse(jsonStr));
};

const closePopup = () => {
  window.close();
}

const listenInCurrentTab = () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {type: 'LISTEN_WEB_SOCKET', portNumber}, closePopup);
  });
}

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
};

document.getElementById('form').addEventListener('submit', onSubmit);
document.getElementById('port-input').focus();