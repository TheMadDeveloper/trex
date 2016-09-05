// T.otal R.ecall EX.tension

function TotalRecall() {
    this.init();
}

$.extend(TotalRecall.prototype,
    {
        recent_tabs: [],
        log: {
            tab_history_buffer: [],
            last_save: 0,
            buffer_delay: 10,
            tab_history: []
        },
        view_timeout: false,
        last_switch: 0,
        last_save: false,

        _tabs: false,
        _windows: false,
        win_names: {},

        _meta_tabs: {},
        _meta_wins: {},

        _loaded: false,

        // Initialize the plugin
        init: function() {
            if (this._loaded) {
                // Only allow initialize once
                return;
            }

            this.debug("initializing");
            this.loadTabLog();
        },

        _cacheValid: false,

        // Meta info collections of windows and tabs are cached
        _regenCache: function() {
            var me = this,
                deferred = $.Deferred();

            this.debug("caching tabs and windows");

            chrome.windows.getAll({populate: true}, function(windows) {
                me._generateMetaProperties(windows);
                me._cacheValid = true;
                deferred.resolve({wins: me._windows, tabs: me._tabs});
            });

            return deferred;
        },

        // Generate meta info for windows and their tabs
        _generateMetaProperties: function(windows) {
            var me = this;

            this.debug("generating meta properties");
            me._meta_wins = {};
            me._meta_tabs = {};
            me._windows = windows;
            me._tabs = [];
            for (var i = 0, n = windows.length; i < n; i++) {
                var win = windows[i];
                me._meta_wins[win.id] = me._generateMetaWindow(win, i);
                me._tabs = me._tabs.concat(win.tabs);
                for (var j = 0; j < win.tabs.length; j++) {
                    var tab = win.tabs[j];
                    me._meta_tabs[tab.id] = me._generateMetaTab(tab);
                }
            }
        },

        _generateMetaWindow: function(win, index, name) {
            name = name || "Window " + (index+1);
            win["meta"] = { name: name, updated: (new Date()).getTime(), index: index };
            return win;
        },

        _generateMetaTab: function(tab) {
            var old_tab = this._meta_tabs[tab.id],
                now = utils.seconds();

            return {tab: tab, last_view: old_tab ? old_tab.last_view : null, updated: now*1000};
        },

        _updateMetaTab: function(tab) {
            var now = utils.seconds();
            this._meta_tabs[tab.id] = {tab: tab, last_view: new Date(now * 1000), updated: now*1000};
        },

        stats: function() {
            return {
                "tab-count": this._tabs.length,
                "window-count": this._windows.length
            };
        },

        debug: function() {
            var args = [(new Date()).getTime()].concat([...arguments]);
            console.log.apply(console, args);
        },

        status: function() {
            chrome.storage.local.getBytesInUse(null, function(bytes) {
                console.log(Math.round(bytes / 1000) + " KB");
            });
        },

        // Logs a view of a particular tab
        logTabSwitch: function(activatedTab) {
            clearTimeout(this.view_timeout);
            if (activatedTab.id) {
                // seems like chrome sometimes passes in tab objects with "tabId" (from onActivated)
                // and sometimes with just "id" (from onFocusChanged)
                activatedTab.tabId = activatedTab.id;
            }
            if (!activatedTab.tabId) {
                // If the activated tab has no ID, bail out
                return;
            }

            var me = this;
            this.view_timeout = setTimeout(function() {
                // Note: only windowId and tabId are provided in "activatedTab" (since that's all that's provided by the event)
                var window_id = activatedTab.windowId,
                    tab_id = activatedTab.tabId,
                    now = utils.seconds();

                // If we stay on this tab for a second, it counts as viewing the tab, so update the last view timestamp
                me.tab(tab_id).always(function(meta_tab) {
                    // construct a new log item
                    var log_info = {
                        tabId: tab_id,
                        winId: window_id,
                        context: meta_tab.tab.url,
                        time: now
                    };

                    me.debug("switching to " + tab_id, log_info);

                    // add log item to the head of the recent_tabs array
                    me.recent_tabs.unshift(log_info);
                    // add log item to the log buffer
                    me.log.tab_history_buffer.push(log_info);

                    meta_tab.last_view = new Date(now * 1000);
                });

                // if it's been an ample amount of time, save the buffer
                if (now - me.log.last_save > me.log.buffer_delay) {
                    me.saveTabLog();
                    me.log.last_save = now;
                }

            }, 1000);
        },

        saveTabLog: function() {
            if (this.log.tab_history_buffer.length == 0) {
                return;
            }
            var me = this;
            me.debug("saving " + me.log.tab_history_buffer.length+" log items");

            var buffer_tabs = this.log.tab_history_buffer.map(function(log_item) {
                me.debug(log_item);
                if (log_item.tabId) {
                    chrome.tabs.get(log_item.tabId, function(tab) { log_item.context = tab.url; });
                }
                return log_item;
            });

            this.log.tab_history = this.log.tab_history.concat(buffer_tabs);
            this.log.tab_history_buffer = [];
            chrome.storage.local.set(
                {
                    'trex_tab_log': this.log.tab_history
                },
                function() {
                    // Notify that we saved.
                    //console.log('Settings saved');
                }
            );
        },

        // Get's tab log from local storage
        loadTabLog: function() {
            var me = this;
            chrome.storage.local.get('trex_tab_log', function(items) {
                me.debug("loaded", items);
                me.log.tab_history = [].concat(items.trex_tab_log.filter(function(element) { return element }));
                // Set recents to the last 10 items in the history
                me.recent_tabs = me.log.tab_history.slice(-10).reverse();
            });
        },

        // Gets recent tabs
        //  count: number of recent tabs to return
        //  exclude: (optional) tab ids to exclude from the list
        recentTabs: function(count, exclude) {
            var recents = this.recent_tabs,
                sliced = [],
                tabIds = {}; // for reducing to a single set of tabs

            exclude = exclude || [];

            for (var i = 0, n = recents.length; i < n; i++) {
                // first come, first serve
                var tab_id = recents[i].tabId;
                if (!tabIds[tab_id] && exclude.indexOf(tab_id) == -1) {
                    tabIds[recents[i].tabId] = true;

                    //var tab = this.findTab(recents[i].tabId);
                    var tab = this.findTab(recents[i].tabId);
                    if (tab) {
                        sliced.push(tab);
                        if (sliced.length == count) {
                            return sliced;
                        }
                    }
                }
            }

            return sliced;
        },

        // Only works on tabs that have been loaded
        findTab: function(id) {
            var target_tab = null;
            this._tabs.every(function(tab) {
                if (tab.id == id) {
                    target_tab = trex._meta_tabs[id];
                    return false;
                }
                return true;
            });
            return target_tab;
        },

        refreshTab: function(id) {
            var me = this;
            chrome.tabs.get(id, function(tab) {
               me._updateMetaTab(tab);
            });
        },

        route: function(location, singleton, reload) {
            var url = chrome.extension.getURL(location+'.html');

            if (singleton) {
                // Make sure to keep only one instance of this page open
                chrome.tabs.query({url: url}, function(tabs) {
                    if (tabs.length > 0) {
                        var tab = trex.activate(tabs.pop());
                        if (reload) {
                            chrome.tabs.reload(tab.id);
                        }
                    }
                    else {
                        chrome.tabs.create({url: url});
                    }
                });
            }
            else {
                chrome.tabs.create({url: url});
            }
        },

        loadData: function(callback) {
            var me = this;
            chrome.storage.local.get('packrat_windows', function(items) {
                me.win_names = items.packrat_windows || {};
                callback.apply(me)
            });
        },

        saveData: function() {

            var me = this;
            var sessions = [{ time: new Date(), windows: this.windows.length, tabs: this.tabs.length }];

            //// Get a value saved in a form.

            // Check that there's some code there.

            // Save it using the Chrome extension storage API.
            chrome.storage.local.set(
                {
                    'packrat_sessions': sessions,
                    'packrat_windows': me.win_names
                },
                function() {
                    // Notify that we saved.
                    console.log('Settings saved');
                }
            );
        },

        // Cached wrapper around the _tabs member
        tabs: function() {
            var def = $.Deferred();

            if (this._cacheValid) {
                def.resolve(this._meta_tabs);
            }
            else {
                var me = this;
                me._regenCache().done(function() {
                    def.resolve(me._meta_tabs);
                });
            }
            return def;
        },

        tab: function(tab_id) {
            var me = this,
                def = $.Deferred(),
                meta_tab = this._meta_tabs[tab_id];

            if (meta_tab) {
                def.resolve(meta_tab);
            }
            else {
                chrome.tabs.get(tab_id, function(tab) {
                    me._meta_tabs[tab_id] = me._generateMetaTab(tab);
                    def.resolve(me._meta_tabs[tab_id])
                });
            }

            return def;
        },

        // Accessor for meta windows
        windows: function(options) {
            var def_windows = $.Deferred();

            if (this._cacheValid) {
                def_windows.resolve(this._metaWinArray());
            }
            else {
                var me = this;
                me._regenCache().done(function() {
                    def_windows.resolve(me._metaWinArray());
                });
            }
            return def_windows;
        },

        _metaWinArray: function() {
            return $.map(this._meta_wins, function(meta_win, i) {return [meta_win];});
        },

        window: function(win_id) {
            var me = this,
                def = $.Deferred(),
                win = this._meta_wins[win_id];

            if (win) {
                def.resolve(win);
            }
            else {
                chrome.tabs.get(win_id, function(win) {
                    me._meta_wins[win_id] = me._generateMetaWindow(win);
                    def.resolve(me._meta_wins[win_id])
                });
            }

            return def;
        },

        // DEPRECATE! Can't run in a background context
        activeWindow: function() {
            var df = $.Deferred();
            var me = this;
            chrome.windows.getCurrent(function(win) {
                me.window(win.id).always(function(win) {
                    df.resolve(win);
                });
            });
            return df;
        },

        _idWindow: function(win, i) {
            if (!this.win_names[win.id]) {
                this.win_names[win.id] = $.extend(win,{name: "Window " + (i+1), order: i});
            }
        },

        activeTab: function(fnCallback) {
            var df = $.Deferred();
            chrome.tabs.query({currentWindow: true, active: true}, function(tabs) { df.resolve(tabs[0]); });
            return df;
        },

        activate: function(tab) {
            chrome.tabs.update(tab.id, {active: true});
            chrome.windows.update(tab.windowId, {focused: true});
            return tab;
        },

        activateWindow: function(window_id) {
            chrome.windows.update(parseInt(window_id), {focused: true});
        },

        moveActiveTabToEnd: function() {
            this.activeTab().done(function(tab) {
                chrome.tabs.move(tab.id, {index: -1});
            });
        },

        popActiveTabOut: function () {
            this.activeTab().done(function(tab) {
                chrome.windows.create({tabId: tab.id});
            });
        },

        popTabOut: function(tab) {
            chrome.windows.create({tabId: tab.id});
        },

        popTabsOut: function(tab_ids) {
            chrome.windows.create({tabId: tab_ids.shift(), focused: false}, function(win) {
                chrome.tabs.move(tab_ids, {windowId: win.id, index: -1});
            });
        },

        pullTabIn: function(win, tab) {
            chrome.tabs.move(tab.id, {windowId: win.id, index: -1});
        },

        pullTabsIn: function(win, tab_ids) {
            chrome.tabs.move(tab_ids, {windowId: win.id, index: -1});
        }
    }
);