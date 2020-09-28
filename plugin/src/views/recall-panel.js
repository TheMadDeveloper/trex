/**
 * Created by Keith Kerlan on 2/2/14.
 */
self.metabolic = METABOLIC.getInstance();
// METABOLIC.chromex = chrome.extension.getBackgroundPage().cx;

document.addEventListener('DOMContentLoaded', function () {
    new RecallPanel();
});

function RecallPanel() {
    this.init();
}

$.extend(RecallPanel.prototype, {
    filter_query: "",
    focus_index: -1,
    $focused: null,
    $filtered: null,
    $tabs: [],
    filteredTabs: null,

    init: function(options) {
        const me = this;

        this.$filter_input = $("#tab-filter");
        this.$tab_list = $("#all-tabs");
        this.initFilterInput(this.$filter_input);

        metabolic.windows().done(function(windows) {
            //chrome.windows.getCurrent(w => cx.view.apply($(".stats"), metabolic.stats(w)));
            METABOLIC.getCurrentWinId(chrome, w => cx.view.apply($(".stats"), metabolic.stats(w)));
            me.filterRecent();
            //new WindowMap($(".win-map")).render({windows: windows});
        });
    },

    initFilterInput: function($filter_input) {
        const me = this;

        QWERTY.handlers($filter_input, "keydown", {
            'cmd': function() {
                $("#help").css("visibility", "visible");
            },
            'right': function(event) {
                var pattern = this.val();
                if (pattern == "") {
                    metabolic.moveActiveTabToEnd();
                }
            },
            'up': function() {
                me.incrementFocus(-1);
            },
            'down':function() {
                me.incrementFocus(1);
            },
            'enter': function(event) {
                var tab = me.getFocusedTab();
                if (tab) {
                    metabolic.activate(tab);
                }
                else if (me.$filtered) {
                    metabolic.activate(me.$filtered[0].data("tab"));
                }
                event.preventDefault();
                return false;
            },
            'cmd+h': function(event) {
                chrome.tabs.create({url: chrome.extension.getURL('tab-history.html')});
                event.preventDefault();
                return false;
            },
            'cmd+k': function(event) {
                chrome.tabs.create({url: chrome.extension.getURL('overview-page.html')});
                event.preventDefault();
                return false;
            },
            'cmd+f': function(event) {
                event.preventDefault();
                metabolic.getActiveTab(function(tab) {
                    chrome.pageCapture.saveAsMHTML({tabId: tab.id}, function(mhtml) {
                        //console.log(mhtml);
                        //chrome.tabs.create({url: window.webkitURL.createObjectURL(mhtml)});

                        //var oFReader = new FileReader();
                        //oFReader.onload = function (oFREvent) {
                        //    console.log(oFReader.result);
                        //};
                        window.open(window.URL.createObjectURL(mhtml));
                        //oFReader.readAsDataURL(mhtml);
                        //$("<a>", {href: window.webkitURL.createObjectURL(mhtml)}).insertAfter($filter_input).html("blob");
                    });
                });
                return false;
            },
            'cmd+up': function(event) {
                // Should pop Focused Tab Out
                metabolic.popTabOut(me.getFocusedTab());
                event.preventDefault();
                return false;
            },
            'cmd+shift+up': function(event) {
                metabolic.popTabsOut(me.getFilteredIds());
                event.preventDefault();
                return false;
            },
            'cmd+down': function(event) {
                METABOLIC.pullTabsIn(me.getFocusedTab().id);
                event.preventDefault();
                return false;
            },
            'cmd+shift+down': function(event) {
                metabolic.pullTabsIn(me.getFilteredIds());
                event.preventDefault();
                return false;
            }
        });

        $filter_input
            .on("keyup", function(event) {
                // update filter, if applicable
                if (event.which == 91 /* Cmd */) {
                    // Hide help?
                    $("#help").css("visibility", "hidden");
                }
                else if (keys.isMutator(event.which)) {
                    var pattern = $(this).val();
                    me.filterList(pattern);
                }
            })
            .on("keydown", function(event) {
                var $input = $(this);
                var pattern = $input.val();

                if (event.ctrl) {
                    if (event.which == 189 /* - */) {
                        me.filterList("gir|imdb");
                        event.preventDefault();
                        return false;
                    }
                    else if (event.which == 68 /* d */) {
                        metabolic.filterToFocusedTabDomain();
                        event.preventDefault();
                        return false;
                    }
                    else if (event.which == 83 /* s */) {
                        metabolic.getTabs({currentWindow: true}, function(tabs) {
                            metabolic.sortTabs(tabs, true);
                            $input.val("");
                        });
                        event.preventDefault();
                        return false;
                    }
                }
                else if (event.which == 8 && event.shiftKey /* SHIFT DELETE */) {
                    metabolic.closeFocusedTab();
                    event.preventDefault();
                    return false;
                }
            });

        $(document.body).on("click","a[href^=#]",
            function(event) {
                event.preventDefault();
                metabolic.route($(this).attr("href").substr(1), true, true);
                return false;
            }
        );
    },

    // converts a list of tabs into a list of jquery elements
    renderTabs: function(tabs) {
        var me = this,
            $tabs = new Array(tabs.length);

        for (var i = 0, n = tabs.length; i < n; i++) {
            var $tab = me.renderTab(tabs[i])
                .on("mouseover", function() { me.setFocus($(this)); })
                .on("mouseout", function() { me.clearFocus(); })
                .on("click", function() { metabolic.activate($(this).data("tab"))});
            $tabs[i]=$tab;
        }

        this.$tabs = $tabs;
        return this.$tabs;
    },

    renderTab: function(meta_tab) {
        var tab = meta_tab.tab,
            $fav = utils.view.favIcon(tab);

        var $info = $("<div>")
            .addClass("search-index")
            .append($("<div>").addClass("title").html(tab.title.replace(/</g,"&lt;")))
            .append($("<div>").addClass("last-view").html(utils.timeAgo(meta_tab.last_view)))
            .append($("<div>").addClass("url").html(tab.url));


        return $("<div>")
            .data({"url": tab.url, "tab":tab, "search-index": this.indexContent(tab)})
            .addClass("tab-row")
            .append($("<div>").addClass("fav-frame").append($fav))
            .append($info);
    },

    // Shows recent tabs in the filter section of the recall panel
    filterRecent: function() {
        var me = this;
        //
        // chromex.tabs.getCurrentTab(function(current_tab) {
        //     var recent_tabs = metabolic.recentTabs(6, current_tab ? [current_tab.id] : current_tab);
        //     me.$filtered = me.renderTabs(recent_tabs);
        //     me.filteredTabs = recent_tabs;
        //
        //     me.$tab_list.empty().append(me.$filtered);
        // });

    },

    filterList: function(search) {
        var me = this;

        if (this.filter_query == search) {
            return;
        }

        this.filter_query = search;

        if (search == "") {
            me.filterRecent();
            return;
        }

        var terms = search.split(" ");

        var search_expressions = [];

        for (var i = 0, n = terms.length; i < n; i++) {
            search_expressions.push(new RegExp(terms[i],"i"));
        }

        me.filterTabs(function(t) {
            for (i = 0; i < n; i++) {
                if (!search_expressions[i].test(me.indexContent(t))) {
                    return false;
                }
            }
            return true;
        });
    },

    indexContent: function(tab) {
        return tab.title + " " + tab.url;
    },

    filterTabs: function(fnFilter) {
        var me = this;

        metabolic.tabs()
            .done(function(mtabs) {
                var tabs = $.map(mtabs, function(mtab, i) {return [mtab];});
                var filtered_tabs = tabs.filter(function(t) { return fnFilter(t.tab); });
                me.filteredTabs = filtered_tabs;
                me.$filtered = me.renderTabs(filtered_tabs);

                me.$tab_list.empty().append(me.$filtered);
            });

        //k3.$toSelector(me.$tabs).not(me.$filtered).hide().filter(".focus").each(function() {
        //    me.clearFocus();
        //});
    },

    closeFocusedTab: function() {
        var $focused = this.getFocused();

        if ($focused) {
            this.$filtered.splice(this.focus_index,1);
            this.incrementFocus(-1);
            chrome.tabs.remove($focused.data("tab")["id"]);
            $focused.remove();
        }
    },

    getFilteredIds: function() {
        return this.filteredTabs.map(function(mtab) { return mtab.tab.id; });
    },

    setFocus: function($row) {
        this.$focused = $row;
        $row.addClass("focus");
    },

    incrementFocus: function(increment) {
        if (increment == 0 || this.$filtered.length == 0) {
            return;
        }
        var $focus;
        if (this.$focused == null) {
            $focus = $(this.$filtered[0]);
        }
        else {
            $focus = increment > 0
                ? this.$focused.nextAll(":visible").first()
                : this.$focused.prevAll(":visible").first();
            this.clearFocus();
        }

        if ($focus.length == 0) {
            this.clearFocus();
            return;
        }

        this.$focused = $focus.addClass("focus");
    },

    getFocused: function() {
        return this.$focused;
    },

    getFocusedTab: function() {
        if (!this.$focused) {
            return null;
        }
        return this.$focused.data('tab');
    },

    clearFocus: function() {
        if (this.$focused) {
            this.$focused.removeClass("focus");
        }
        this.$focused = null;
    }
});