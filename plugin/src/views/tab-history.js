/**
 * Created by keith on 7/21/15.
 */

function TabHistoryPage() {
    var me = this;
    me.init();
}

$.extend(TabHistoryPage.prototype, {
    init: function() {
        var recents = k3.trex.recentTab,
            recent_tabs = [];

        k3.trex.getWindows(function() {
            for (var i = 0, n = recents.length; i < n; i++) {
                var tab = k3.trex.findTab(recents[i].tabId);
                if (tab) {
                    recent_tabs.push({recent: recents[i], tab: tab});
                }
            }

            cx.hb.render(
                "tab-history-tpl",
                {
                    recent_tabs: recent_tabs,
                    now: new Date()
                },
                $("#tab-history")
            );
        });
    }
});