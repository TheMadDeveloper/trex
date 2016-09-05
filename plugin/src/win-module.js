// Permissions Needed: "tabs"
// See: https://developer.chrome.com/extensions/windows

k3.chromex.win_module = {
    getWindows: function(fnCallback) {
        var me = this;
        var options = {
            populate: true // Loads window tabs
        }
        chrome.windows.getAll(options, function(windows) {
            me.windows = windows;

            if (options.populate) {
                me.tabs = me.extractTabsFrom(windows);
            }

            fnCallback(windows, me.tabs);
        });
    }
};