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
    var onMessage = function (width, opts) {
        if (! width) return;
        if (! opts) opts = {};

        var threshold = localStorage.width;
        var isEnabledCurrent = width < threshold;
        if (isEnabled == isEnabledCurrent) return;

        isEnabled = isEnabledCurrent;

        if (! opts.noNotifications)
            notify(isEnabled ? "smartphone" : "PC");
    };
    var onFocus = function (tabId, opts) {
        chrome.tabs.sendMessage(tabId, {}, function (width) { onMessage(width, opts) });
    };

    chrome.tabs.getSelected(function (tab) {
        onFocus(tab.id);
    });
    chrome.tabs.getSelected(function (tab) {
        onFocus(tab.id);
    });
    chrome.tabs.onActivated.addListener(function (info) {
        onFocus(info.tabId);
    });
    chrome.windows.onFocusChanged.addListener(function () {
        chrome.tabs.getSelected(function (tab) {
            onFocus(tab.id, { noNotifications: true });
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
