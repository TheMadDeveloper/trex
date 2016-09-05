var utils = {
    view: {
        favIcon: function(tab) {
            return $("<img>").attr("src", utils.getFavIcon(tab)).addClass("ico");
        }//,
        //tabRow: function(tab) {
        //    var $fav = k3.trex.render.favIcon(tab);
        //
        //    var $info = $("<div>")
        //        .addClass("search-index")
        //        .append($("<div>").addClass("title").html(tab.title.replace(/</g,"&lt;")))
        //        .append($("<div>").addClass("url").html(tab.url));
        //
        //    return $("<div>")
        //        .data("url", tab.url)
        //        .data("tab",tab)
        //        .data("search-index", $info.html())
        //        .addClass("tab-row")
        //        .append($("<div>").addClass("fav-frame").append($fav))
        //        .append($info);
        //},
        //windowRow: function(w) {
        //    return $("<div>")
        //        .append($("<span>",{"class": "w-id"}).html(w.id))
        //        .append($("<span>",{"class": "w-type"}).html(w.type))
        //        .append($("<span>",{"class": "w-state"}).html(w.state))
        //        .append($("<span>",{"class": "w-width"}).html(w.width))
        //        .append($("<span>",{"class": "w-height"}).html(w.height));
        //},
        //apply: function($el, data) {
        //    $el.find("[data-content]").each(function() {
        //        var property = $(this).data("content");
        //        if (data[property] !== undefined) {
        //            this.innerHTML = data[property];
        //        }
        //    });
        //}//,
        //tpl: function(tpl_name, values, fnProps) {
        //    var $el = k3.trex.tpl(tpl_name);
        //    $el.find("[data-content]").each(function() {
        //        var property = $(this).data("content");
        //
        //        if (fnProps && fnProps[property]) {
        //            this.innerHTML = fnProps[property](values);
        //        }
        //        else if (values[property] !== undefined) {
        //            this.innerHTML = values[property];
        //        }
        //    });
        //
        //    return $el;
        //}
    },

    getFavIcon: function(tab) {
        var re = new RegExp(/chrome:/);
        if (/chrome-extension:/.test(tab.url)) {
            return "/IDR_EXTENSIONS_FAVICON@2x.png"
        }

        if (tab.favIconUrl && !re.test(tab.url)) {
            return tab.favIconUrl;
        }

        return "/chrome-file-icon.png";
    },

    find: function(ar, fnCondition) {
        var target_elem = null;
        ar.every(function(elem) {
            var is_match = fnCondition(elem);
            if (is_match) {
                target_elem = elem;
                return false;
            }
            return true;
        });
        return target_elem;
    },

    seconds: function() {
        return ((new Date()).getTime()/1000).toFixed(0); // now in seconds
    },

    timeAgo: function(date, now) {

        if (!date) {
            return "";
        }
        if (!now) {
            now = new Date();
        }
        var delta = now - date;

        var secs = (delta / 1000).toFixed(0),
            mins = (secs / 60).toFixed(0),
            hours = (mins / 60).toFixed(0),
            days = (hours / 24).toFixed(0);

        if (days > 0) {
            return days + "d";
        }
        else if (hours > 0) {
            return hours + "h";
        }
        else if (mins > 0) {
            return mins + "m";
        }
        else {
            return secs +"s";
        }
    }

};