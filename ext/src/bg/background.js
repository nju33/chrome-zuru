/**
 * @typedef {'INITIALIZE'|'CHANGE_POSITION'} ActionType
 */

 /**
  * @readonly
  * @enum {number}
  */
const WebSocketReadyState = {
  Connecting:	0,
  Open: 1,
  Closing: 2,
  Closed: 3,
};

/**
 * 何もしない
 */
const noop = () => {};

/**
 * コンテンツページからメッセージが送られてきた時のハンドル
 * @param {Object} action
 * @property {ActionType} action.type
 * @param {Function} sendResponse 完了を伝える
 */
const extensionOnMessage = (action, _, sendResponse) => {
  chrome.windows.getCurrent(currentWindow => {
    if (currentWindow === -1) {
      return;
    }
    
    switch (action.type) {
      // 送られてきたwindowステートで初期化
      case 'INITIALIZE': {
        const window = chrome.windows.update(
          currentWindow.id,
          action.windowState,
          sendResponse
        );
        break;
      }
      // 送られてきた位置情報で位置更新
      case 'CHANGE_POSITION': {
        chrome.windows.update(
          currentWindow.id,
          action.position,
          sendResponse
        );
        break;
      }
      default: {
        sendResponse();
      }
    }
  });
};
/**
 * コンテンツページからメッセージが送られてきた時発火
 */
chrome.extension.onMessage.addListener(extensionOnMessage);

/**
 * 
 * @param {Object} action 
 */
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
        if (currentWindow === -1) {
          return;
        }
    
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

/**
 * 指定ミリ秒待つ
 * @param {number} msec 待ち時間
 */
const wait = msec => {
  return new Promise(resolve => {
    setTimeout(resolve, msec);
  });
};

/**
 * データの取得
 * @return {Promise<Object>}
 */
const getState = () => {
  return new Promise(resolve => {
    chrome.storage.local.get(null, resolve);
  });
};

/**
 * データの保存
 * @param {Object} obj
 */
const setState = obj => {
  return new Promise(resolve => {
    chrome.storage.local.set(obj, () => {
      resolve();
    });
  });
};

/**
 * 今開いてるタブの取得
 * @return {Promise<Object>}
 */
const getCurrentTab = () => {
  return new Promise(resolve => {
    chrome.tabs.getSelected(null, resolve);
  });
};

/**
 * windowが削除される、または何かしらが原因でフォーカスが外れた時場合は、
 * 無効と判断し、処理を終える
 * 有効な場合はコールバックを実行
 */
const validWindow = cb => window => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.id === -1) {
    return;
  }

  if (!window.focused) {
    return false;
  }

  return true;
}

/**
 * zuruアプリ側のwindow状態を取得
 * @return {Promise<Object>}
 */
const getWindow = async () => {
  const res = await fetch('http://localhost:33322/api/v1/window');
  return res.json();
};

/**
 * zuruアプリで開ける画像一覧を取得
 * @return {Promise<Object>}
 */
const getFiles = async () => {
  const res = await fetch('http://localhost:33322/api/v1/files');
  return res.json();
};

/**
 * ファイル名のパース
 * @param {string} filenameWithPath 
 * @return {Object} data
 * @property {string} data.filename
 * @property {string} data.url
 */
const parseFilename = filenameWithPath => {
  const filename = filenameWithPath.match(/[^/]+$/)[0];
  const url = filename.replace(/_.*/, '');

  return {
    filename,
    url
  };
};

/**
 * URLをファイル名に変換
 * @param {string} url 
 */
const formatUrl = url => {
  return url
    .replace(/https?:\/\//, '')
    .replace('/', '!')
    .replace(/!$/, '');
};

/**
 * websocketの接続が開くまで待機
 * @param {*} ws 
 */
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

/**
 * 現在のタブページを初期化
 * @param {Tab} tab 
 * @return {Tab}
 */
const tabInit = tab => {
  chrome.tabs.sendMessage(tab.id, {type: '@@INIT'}, () => {});
  return tab;
}

let ws;
let tryCount = 0;

/**
 * wsに接続済か
 * @return {boolean}
 */
const connectedWS = ws => typeof ws !== 'undefined' && ws.readyState === WebSocketReadyState.Open
const inactivate = async () => {
  if (!connectedWS(ws)) {
    setInactiveIcon();
    ws = undefined;
    try {
      ws.close();
    } catch (_) {}
    return
  }
  
  await Promise.resolve(ws.send(JSON.stringify({type: 'UNSELECT_FILE'})))
    .then(wait(1000))
    .then(setState({active: false}))
    .then(setInactiveIcon)
    .then(() => {
      ws = undefined;
      try {
        ws.close();
      } catch (_) {}
    });
};

const activate = async tab => {
  ws = new WebSocket('ws://localhost:33322');
  ws.onmessage = ev => {
    const action = JSON.parse(ev.data);
    // console.log(action);
    handleAction(action);
  }
  ws.onclose = inactivate;

  await waitConnection(ws);
  await setState({active: true}).then(setActiveIcon);
  try {
    await process(tab);
  } catch (err) {
    if (tryCount < 3 && err.message === 'Can not connect with websocket') {
      tryCount++;
      activate(tab);
    } else {
      tryCount = 0;
    }
  }
};

const process = async () => {
  if (typeof ws === 'undefined') {
    return;
  }

  const tab = await getCurrentTab().then(tabInit);
  const formatedTabUrl = formatUrl(tab.url);
  // ターゲットとなるファイル
  const file = await getFiles().then(files => {
    for (const idx in files) {
      const {filename, url} = parseFilename(files[idx].filename);
      if (formatedTabUrl === url) {
        return files[idx];
      }
    }
  })

  if (typeof file === 'undefined') {
    throw new Error('There was no target file');
  }

  if (ws.readyState !== WebSocketReadyState.Open) {
    throw new Error('Can not connect with websocket');
  }
  tryCount = 0;

  // アクティベート化するファイル情報を
  // zuruアプリへ送信
  ws.send(
    JSON.stringify({
      type: 'SELECT_FILE',
      file
    })
  );

  await getWindow().then(windowState => {
    chrome.windows.getCurrent(currentWindow => {
      if (currentWindow.id === -1) {
        return;
      }

      const nextState = {
        width: Number(windowState.width),
        height: Number(windowState.height),
        left: Number(windowState.x),
        top: Number(windowState.y),
      };

      chrome.windows.update(
        currentWindow.id,
        nextState,
        () => ws.send(JSON.stringify({type: 'FOCUS_ZURU_APP'}))
      );
    });
  });
};

/**
 *  tabが作られた時
 */
chrome.tabs.onCreated.addListener(tab => {});
/**
 *  tabを選択した時
 */
chrome.tabs.onActivated.addListener(tab => {
  process(tab).catch(err => {
    console.log(err);
  });
});
/**
 *  tabのURLが移動した時
 */
chrome.tabs.onUpdated.addListener((_, __, tab) => {
  process(tab).catch(err => {
    console.log(err);
  });
});


/**
 *  windowが変わった時
 */
chrome.windows.onFocusChanged.addListener(windowId => {
  chrome.windows.get(windowId, validWindow(() => {
    setTimeout(async () => {
      const tab = await getCurrentTab();

      process(tab).catch(err => {
        console.log(err);
      });
    }, 3000)
  })); 
});

/**
 * アイコンinactive化
 */
const setInactiveIcon = () => {
  iconPath = chrome.runtime.getURL('icons/icon19!inactive.png');
  chrome.browserAction.setIcon({path: iconPath}, noop);
}

/**
 * アイコンactive化
 */
const setActiveIcon = () => {
  iconPath = chrome.runtime.getURL('icons/icon19.png');
  chrome.browserAction.setIcon({path: iconPath}, noop);
}


/**
 *  右上の拡張アイコンをクリックした時
 */
chrome.browserAction.onClicked.addListener(async tab => {
  console.log(`browserAction start, ws: ${ws}`);

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
