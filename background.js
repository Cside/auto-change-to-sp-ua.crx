(function() {
    var p = function() {
        console.log(
            JSON.stringify(
                Array.prototype.slice.call(arguments, 0, arguments.length),
                null,
                ''
            )
        );
    }
    var defaults = {
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3',
        width: 640,
    };
    ['ua', 'width'].forEach(function (name) {
        var ret = localStorage[name];
        if (! ret) {
            localStorage[name] = defaults[name];
        }
    });

    var notify = function(message) {
        var notification = webkitNotifications.createNotification(
            chrome.extension.getURL('images/icon48.png'),
            "Auto Change to Smartphone's UserAgent",
            message
        )

        notification.show();

        setTimeout(function() {
            notification.close();
        }, 3000);
    };

    var isEnabled = false;
    chrome.tabs.getSelected(function (tab) {
        onFocusHandler(tab.id);
    });

    var onMessage = function (width) {
        if (! width) return;

        var threshold = localStorage.width;
        var isEnabledCurrent = width < threshold;
        if (isEnabled == isEnabledCurrent) return;

        isEnabled = isEnabledCurrent;

        notify(isEnabled ? "smartphone" : "PC");
    };
    var onFocus = function (tabId) {
        chrome.tabs.sendMessage(tabId, {}, onMessage);
    };

    chrome.tabs.getSelected(function (tab) {
        if (tab.index !== 0) onFocus(tab.id);
    });
    chrome.tabs.onActivated.addListener(function (info) {
        onFocus(info.tabId);
    });
    chrome.windows.onFocusChanged.addListener(function () {
        chrome.tabs.getSelected(function (tab) {
            if (tab.index !== 0) onFocus(tab.id);
        });
    });
    chrome.runtime.onMessage.addListener(onMessage);

    chrome.webRequest.onBeforeSendHeaders.addListener(
        function (details) {
            // p({ current: CurrentWidth, threshold: threshold });
            if (isEnabled) {
                for (var i = 0, l = details.requestHeaders.length; i < l; ++i) {
                    if (details.requestHeaders[i].name === 'User-Agent') {
                        details.requestHeaders[i].value = localStorage.ua;
                        break;
                    }
                }
            }
            return { requestHeaders: details.requestHeaders };
        },
        { urls: ["<all_urls>"] },
        ["blocking", "requestHeaders"]
    );
})();
