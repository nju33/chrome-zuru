chrome.extension.onMessage.addListener((action, sender, sendResponse) => {
  chrome.windows.getCurrent(currentWindow => {
    switch (action.type) {
      case 'INITIALIZE': {
        const window = chrome.windows.update(
          currentWindow.id,
          action.windowState,
          () => {
            sendResponse();
          }
        );
      }
      case 'CHANGE_POSITION':
        chrome.windows.update(currentWindow.id, action.position, () => {
          sendResponse();
        });
      default:
        return sendResponse();
    }
  });
});

const handleAction = async action => {
  console.log('action: ', action);
  switch (action.type) {
    case 'SCROLL': {
      const tab = await getCurrentTab();
      chrome.tabs.sendMessage(tab.id, action, () => {});
      break;
    }
    case 'MOVE_ZURU_APP': {
      chrome.windows.getCurrent(currentWindow => {
        const window = chrome.windows.update(
          currentWindow.id,
          {
            width: action.windowState.width,
            height: action.windowState.height,
            left: action.windowState.x,
            top: action.windowState.y
          },
          () => {} 
        );
      });
      break;
    }
  }
}

const wait = msec => {
  return new Promise(resolve => {
    setTimeout(resolve, msec);
  });
};

const getState = () => {
  return new Promise(resolve => {
    chrome.storage.local.get(null, value => {
      resolve(value);
    });
  });
};

const setState = obj => {
  return new Promise(resolve => {
    chrome.storage.local.set(obj, () => {
      resolve();
    });
  });
};

const getCurrentTab = () => {
  return new Promise(resolve => {
    chrome.tabs.getSelected(null, tab => {
      resolve(tab);
    });
  });
};

const getWindow = async () => {
  const res = await fetch('http://localhost:33322/api/v1/window');
  return res.json();
};

const getFiles = async () => {
  const res = await fetch('http://localhost:33322/api/v1/files');
  return res.json();
};

const parseFilename = filenameWithPath => {
  const filename = filenameWithPath.match(/[^/]+$/)[0];
  const url = filename.replace(/_.*/, '');

  return {
    filename,
    url
  };
};

const formatUrl = url => {
  return url
    .replace(/https?:\/\//, '')
    .replace('/', '!')
    .replace(/!$/, '');
};

const waitConnection = ws => {
  return new Promise(resolve => {
    const verify = () => {
      setTimeout(() => {
        if (ws.readyState === 0) {
          return verify();
        }

        resolve();
      }, 50);
    };

    verify();
  });
};

let ws;

const process = async () => {
  if (typeof ws === 'undefined') {
    return;
  }

  const tab = await getCurrentTab();
  chrome.tabs.sendMessage(tab.id, {type: '@@INIT'}, () => {});
  const formatedTabUrl = formatUrl(tab.url);
  const files = await getFiles();

  const file = (() => {
    let target;
    for (const idx in files) {
      const {filename, url} = parseFilename(files[idx].filename);
      console.log(formatedTabUrl, url);
      if (formatedTabUrl === url) {
        target = files[idx];
        break;
      }
    }

    return target;
  })();

  if (typeof file === 'undefined') {
    return;
  }

  if (ws.readyState !== 1) {
    return;
  }

  ws.send(
    JSON.stringify({
      type: 'SELECT_FILE',
      file
    })
  );

  await wait(500);

  const windowState = await getWindow();

  chrome.windows.getCurrent(currentWindow => {
    const window = chrome.windows.update(
      currentWindow.id,
      {
        width: Number(windowState.width),
        height: Number(windowState.height),
        left: Number(windowState.x),
        top: Number(windowState.y),
      },
      () => {}
    );
  });

  ws.send(
    JSON.stringify({
      type: 'FOCUS_ZURU_APP'
    })
  );
};

chrome.tabs.onCreated.addListener(tab => {});

chrome.tabs.onActivated.addListener(tab => {
  process(tab).catch(err => {
    console.log(err);
  });
});
chrome.tabs.onUpdated.addListener((_, __, tab) => {
  process(tab).catch(err => {
    console.log(err);
  });
});
chrome.windows.onFocusChanged.addListener(windowId => {
  chrome.windows.get(windowId, window => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.focused) {
      return;
    }

    setTimeout(async () => {
      const tab = await getCurrentTab();

      process(tab).catch(err => {
        console.log(err);
      });
    }, 3000)
  }); 
});

const inactivate = async () => {
  if (typeof ws !== 'undefined' && ws.readyState === 1) {
    ws.send(
      JSON.stringify({
        type: 'UNSELECT_FILE'
      })
    );
    setTimeout(() => {
      ws.close();
      ws = undefined;
    }, 100);
  }
  await setState({active: false});
  iconPath = chrome.runtime.getURL('icons/icon19!inactive.png');
  chrome.browserAction.setIcon({path: iconPath}, () => {});
};

const activate = async tab => {
  ws = new WebSocket('ws://localhost:33322');
  ws.onmessage = ev => {
    const action = JSON.parse(ev.data);
    // console.log(action);

    handleAction(action);
  }
  ws.onclose = () => {
    inactivate();
  };
  await waitConnection(ws);
  iconPath = chrome.runtime.getURL('icons/icon19.png');
  chrome.browserAction.setIcon({path: iconPath}, () => {});
  await setState({active: true});
  await process(tab);
};

chrome.browserAction.onClicked.addListener(async tab => {
  if (typeof ws === 'undefined') {
    await activate(tab);
  } else {
    await inactivate();
  }
});

chrome.runtime.onMessage.addListener((action, _, sendResponse) => {
  // console.log(action);
  if (typeof ws !== 'undefined' && ws.readyState === 1) {
    ws.send(JSON.stringify(action));
  }
});
