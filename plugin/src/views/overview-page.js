/**
 * Created by keith on 2/2/14.
 */

//var trex = chrome.extension.getBackgroundPage().trex;
self.metabolic = METABOLIC.getInstance();

document.addEventListener('DOMContentLoaded', function () {
    new OverviewPage();
});

function OverviewPage() {
    this.init();
}

$.extend(OverviewPage.prototype, {
    windows: null,
    $mode_toggles: null,
    $dups: null,
    $tools: null,

    init: function() {
        // Init properties
        this.$info = $("#info-bar");
        //this.$mode_toggles = $("[data-mode]");
        //this.$tools = $("button.tool");
        //this.setMode("activate");

        //this.initWindowList($("#window-list"));
        this.renderTabMap($("#tab-map"));

        this.initEventHandlers();

        $("#load-time").html(new Date().toLocaleString());

    },

    initEventHandlers: function() {
        var me = this;
        $(document)
            .on("mouseover", "img.ico", function() {
                var $ico = $(this);
                me.info($ico.data("title"), $ico.data("url"));
            })
            .on("click", "a.win-link", function(event) {
                event.preventDefault();
                //trex.activateWindow($(this).attr("href").substring(1));
            })
            .on("click", "img.ico", function(event) {
                me.tabClick($(this), event);
            })
            .on("click", ".tool[data-action]", function(event) {
                var action = $(this).data("action");
                if (typeof me[action] == "function") {
                    me[action](event);
                }
            })
            .on("keydown", function(event) {
                if (this.mode == "activate" && event.which == 16) {
                    me.setMode("delete");
                }
            })
            .on("keyup", function(event) {
                if (this.mode == "activate" && event.which == 16) {
                    me.revertMode();
                }
            })
            .on("click", "[data-mode]", function() {
                me.setMode($(this).data("mode"));
            })
            .on("submit", "#name-window", function(evt) {
                evt.preventDefault();
                var $input = $(this).find("input#window-name");
                //trex.nameWindow($input.data("id"), $input.val());
                return false;
            })
            .on("click", "button.custom-page", function(evt) {
                chrome.tabs.create({url: chrome.extension.getURL('tab-history.html')});
            });
    },

    tabClick: function($ico, evt) {
        if (this.mode == "activate") {
            var tabId = $ico.data("id");
            return;
            if ((tabId != -1) && trex._meta_tabs[tabId]) {
                chrome.tabs.get(tabId, function(tab) {
                    trex.activate(tab);
                });
            }
            else {
                // Not really a tab (maybe devtools or removed or something)
                // Activate the window it was supposed to be in
                trex.activateWindow($ico.closest(".window-item").attr("class").match(/win-([\d]+)/)[1]);
            }
        }
        else if (this.mode == "select") {
            this.selectTabs($ico, {add: evt.shiftKey})
        }
        else if (this.mode == "delete") {
            this.removeTab($ico);
        }
        else if (this.mode == "domain-select") {
            this.selectTabs(this.getDomain(new kUrl($ico.data("url"))), {add: evt.shiftKey});
        }
    },

    info: function(msg, detail) {
        this.$info.empty().append($("<span>").html(msg));
        if (detail) {
            this.$info.append($("<span>").addClass("info-detail").text(detail));
        }
    },

    renderTabMap: function($container) {
        const $info = this.$info;
        metabolic.classifyTabs(tabTree => {
            console.log("Tab Tree", tabTree);

            const resolveName = (root, key) => {
                if (root === '$')
                    return key.substring(1);
                if (key[0] === '.')
                    return `${key.substring(1)}.${root}`;
                return root + key;
            }
            const fnMapper = (name, branch) => {
                let { _tabs, ...children } = branch;
                _tabs = _tabs || [];

                children = Object.keys(children).map(key => fnMapper(
                    resolveName(name, key),
                    branch[key])
                );

                while (children && children.length === 1 && children[0].children) {
                    children = children[0].children;
                }

                // Has a "tabs" member
                if (_tabs.length > 0) {
                    const _tabMap = {};
                    _tabs.forEach(tab => {
                        const name = tab.url;
                       _tabMap[name] = _tabMap[name] || { name: name, value: 0, _t: [] };
                       _tabMap[name].value++;
                       _tabMap[name]._t.push(tab);
                    });
                    children = children.concat(Object.values(_tabMap));
                }

                //const children = Object.keys(branch).map(key => fnMapper(key, branch[key])).flat();
                return { name, children };
            }

            const treeData = fnMapper("$", tabTree);
            if (treeData.children.length > 0) {
                const tm = new TabMap($container, treeData, {
                    onMouseOver: (d) => { $info.html(d.data.name); },
                    onMouseOut: (d) => { $info.html("&nbsp;"); }
                });
                tm.render();
            }
        });
    },

    initWindowList: function($list) {
        if (!$list) {
            return;
        }

        var me = this;


        // metabolic.tabs()
        //     .done(function(mtabs) {
        //
        //         const groups = {};
        //
        //         var tabs = $.map(mtabs, function(mtab, i) {
        //             me.addToGroup(groups, me.splitUrl(new URL(mtab.tab.url)), mtab);
        //
        //             return [mtab];
        //         });
        //         console.log(tabs);
        //         console.log(groups);
        //     });

        return;
        trex.windows()
            .done(function(windows) {
                me.refreshData();
                me.renderWindows($list, windows);
            })
            .then(function() {

                trex.activeWindow().always(function(win) {
                    //win = trex.win_names[win.id];

                    me.$winrow(win.id).addClass("active");

                    var render_dat = {
                        win: win,
                        tab_count: trex._tabs.length,
                        win_count: trex._windows.length,
                        open_time: new Date().toLocaleTimeString()
                    };
                    cx.hb.render("current-window-tpl", render_dat, function(html) {
                        $("#current-window").empty().append(html);
                    });
                });
            });
    },

    $winrow: function(win_id) {
        return $(".window-item.win-" +win_id);
    },

    renderWindows: function($container, windows) {
        var win_data = [],
            screen_size = [1440, 896];

        for (var i = 0, n = windows.length; i < n; i++) {
            var win = windows[i],
                win_bounds = [
                    parseInt(win.left / screen_size[0] * 100),
                    parseInt(win.top / screen_size[1] * 100),
                    parseInt(win.width / screen_size[0] * 100),
                    parseInt(win.height / screen_size[1] * 100)
                ],
                bounds = [
                    win_bounds[0] + "%",
                    win_bounds[1] + "%",
                    win_bounds[2] + "%",
                    win_bounds[3] + "%"
                ];

            win_data.push({
                id: win.id,
                bounds: bounds,
                tabs: this.tabData(win.tabs)
            });
        }

        cx.hb.render("win-list-tpl", {windows: win_data}, function(html) {
            $container.append(html);
        });
    },

    tabData: function(tabs) {
        var data = [];
        for (var i = 0, n = tabs.length; i < n; i++) {
            var tab = tabs[i];

            data.push({
                id: tab.id,
                fav: utils.getFavIcon(tab),
                title: tab.title,
                url: tab.url,
                classes: this.classifyTab(tab).join(" ")
            });
        }

        return data;
    },

    //renderTabs:function(tabs) {
    //    var a$tabs = [];
    //    for (var i = 0, n = tabs.length; i < n; i++) {
    //        //a$tabs.push($("<div>").html(tabs[i].title.substr(0, 20)));
    //        var $fav = trex.render.favIcon(tabs[i])
    //            .attr("data-title", tabs[i].title)
    //            .attr("data-url", tabs[i].url)
    //            .data("tab", tabs[i])
    //            .addClass(this.classifyTab(tabs[i]).join(" "));
    //
    //        //a$tabs.push($("<div>").addClass("ico").wrapInner($fav));
    //        a$tabs.push($fav);
    //    }
    //
    //    return a$tabs;
    //},

    classifyTab: function(tab) {
        var url = new kUrl(tab.url);
        var classes = [url.protocol];

        if (url.is_source) {
            classes.push("view-source");
        }
        return classes;
    },

    getDomain: function(kurl) {
        return $("img.ico").filter(function() {
            var url = $(this).data("url");
            return kurl.compareDomain(new kUrl(url)) == 0;
        });
    },

    markDups: function() {
        var me = this;
        var urls = {};
        me.highlight();
        me.$dups = {};
        $("img.ico").each(function() {
            var $this = $(this),
                url = $this.data("url"),
                normal_url = new kUrl(url).compareString();

            if (me.$dups[normal_url]) {
                me.$dups[normal_url].push($this);
                me.markDup($this);
                me.markDup(me.$dups[normal_url][0]);
            }
            else {
                me.$dups[normal_url] = [$this];
            }
        });

        /*
         urls.sort(function(a,b) { return a.compareWith(b)});

         for (var i = 1, n = urls.length; i < n; i++) {
         if (urls[i].compareString() == urls[i-1].compareString()) {
         console.log("DUPLICATE", urls[i].url);
         }
         console.log(urls[i].compareString());
         }
         */
    },

    markDup: function($ico) {
        if ($ico.hasClass("duplicate")) {
            return;
        }
        $ico.addClass("duplicate highlight").before($("<div>").addClass("marker"));
    },

    showSelected: function(show) {
        $("#window-list").toggleClass("show-highlights", show);
        if (show) {
            this.$tools.removeAttr("disabled");
        }
        else {
            this.$tools.attr("disabled", "disabled");
        }
    },

    _$selection: null,

    $selection: function(refresh) {
        if (this._$selection == null || refresh) {
            this._$selection = $("img.ico.highlight");
        }
        return this._$selection;
    },

    selectTabs: function($ico, options) {
        options = options || {};

        if (!options.add) {
            this.$selection().not($ico).removeClass("highlight");
        }
        $ico.toggleClass("highlight", true);

        this.showSelected(this.$selection(true).length > 0);
    },

    refreshData: function() {
        $(".data.win-count").html(trex._windows.length);
        $(".data.tab-count").html(trex._tabs.length);
    },

    mode: "select",

    setMode: function(mode) {
        this.previous_mode = this.mode;
        this.mode = mode;
        this.$mode_toggles.removeClass("active");
        this.$mode_toggles.filter("[data-mode="+mode+"]").addClass("active");

        $("body > .page").toggleClass("delete-mode", this.mode == "delete");
        if (this.mode == "dup-select") {
            this.markDups();
        }
    },

    // Sets to the previous mode
    revertMode: function() {
        this.setMode(this.previous_mode);
    },

    consolidate: function() {
        var $selected = this.$selection(true),
            tab_ids = this.getIds($selected),
            win = this.active_window;

        chrome.tabs.move(tab_ids, {windowId: win.id, index: -1});
        $selected.detach().appendTo(this.$winrow(win.id).find(".tab-items"));
    },

    regen: function() {
        var me = this;
        trex._regenCache().done(function() { me.initWindowList($("#window-list").empty()); });
    },

    remove: function() {
        var $selected = this.$selection(true),
            tab_ids = this.getIds($selected);

        chrome.tabs.remove(tab_ids);
        $selected.remove();
    },

    removeTab: function($ico) {
        chrome.tabs.remove($ico.data("id"));
        $ico.closest("span.ico").remove();
    },

    getIds: function($tab_items) {
        var tab_ids = [];
        $tab_items.each(function() { tab_ids.push($(this).data("tab").id); });
        return tab_ids;
    }
});

function kUrl(url) {
    this.url = url;


    var parts = url.match(/([^:]*):\/\/([^\/]*)(.*)/);

    if (!parts) {
        return;
    }

    this.protocol = parts[1];
    this.host = parts[2].split(".").reverse();
    this.path = parts[3].split("/").slice(1);
    this.is_source = url.indexOf("view-source:") == 0;

    this.resource = this.path.pop();

    parts = this.resource.split("?");

    if (parts.length > 1) {
        this.resource = parts[0];
        this.query = parts[1];
    }

    parts = this.resource.split("#");

    if (parts.length > 1) {
        this.resource = parts[0];
        this.hash = parts[1];
    }

    this.path.push(this.resource);
}

kUrl.prototype.compareDomain = function(kurl) {
    var mine = this.domainString(),
        theirs = kurl.domainString();

    if (mine > theirs) {
        return 1;
    }

    if (mine < theirs) {
        return -1;
    }

    return 0;
};

kUrl.prototype.compareWith = function(kurl) {
    var mine = this.compareString(),
        theirs = kurl.compareString();

    if (mine > theirs) {
        return 1;
    }
    if (mine < theirs) {
        return -1;
    }
    return 0;
};

kUrl.prototype.compareString = function() {
    return this.host.concat([this.resource, this.hash]).join(".");
};

kUrl.prototype.domainString = function() {
    return this.host.join(".");
};