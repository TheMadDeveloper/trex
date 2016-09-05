

function WindowMap($el, options) {
    this.$el = $el;
    this.options = options;
}

$.extend(WindowMap.prototype, {
    render: function(data) {
        var me = this;

        cx.hb.render("window-map-tpl", {windows: me._generateMapData(data.windows)}, function(html) {
            me.$el.empty().append(html);
        });
    },
    _generateMapData: function(windows) {
        var windata = [],
            window_limit = 10;

        for (var i = 0; i < window_limit; i++) {
            if (windows.length <= i) {
                // Not enough windows...lets add some placeholders
                windata.push({tab_count: 0, scale: 1});
            }
            else {

                var w = windows[i],
                    tab_count = w.tabs.length,
                    max_scale = Math.ceil(Math.sqrt(tab_count));

                var scale = Math.sqrt(Math.pow(4,Math.ceil(Math.log2(tab_count)/2)));
                // tc <= 1  = 4^0: 1/1 = 1
                // tc <= 4  = 4^1: 1/2 = .5
                // tc <= 16 = 4^2: 1/4 = .25
                // tc <= 64 = 4^3: 1/8 = .125
                // tc <=      4^n: 1/(2^n)

                //var scale = Math.log2(max_scale*max_scale)/2;
                //for (var scale = 1; scale < max_scale; scale *= 2) {
                //
                //}

                var max_tabs = scale * scale,
                    empties = max_tabs - tab_count,
                    upscale = Math.floor(empties / 3);

                // e = s^2 - n

                windata.push({
                    tab_count: tab_count,
                    tabs: w.tabs,
                    scale: 1/scale,
                    upscale: upscale-1
                });
            }
        }
        return windata;
    }
});