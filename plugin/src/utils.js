var utils = {
    view: {
        favIcon: function(tab) {
            return $("<img>").attr("src", utils.getFavIcon(tab)).addClass("ico");
        }
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