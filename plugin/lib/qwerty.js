/**
 * WORK IN PROGRESS
 *
 * Created by Keith Kerlan.
 *
 * A custom keyboard interaction library.
 */

var keys = {
    DEL: 8,
    DELETE: 46,
    ENTER: 13,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    S:83,
    DASH: 189,
    PERIOD: 190,
    FS: 191, // Forward slash
    _actions: [],

    /*
    setAction: function($element, key, options, func) {
        this._actions.push($.extend({"$el": $element, "key": key, "func": func}, options));
    },
    */

    keyboard_map: [
        "","","",
        "CANCEL",
        "","",
        "HELP",
        "",
        "BACK_SPACE", // 8
        "TAB", // 9
        "",
        "",
        "CLEAR",
        "ENTER", // 13
        "RETURN",
        "",
        "SHIFT","CONTROL","ALT",
        "PAUSE","CAPS_LOCK",
        "KANA","EISU","JUNJA","FINAL","HANJA","","ESCAPE","CONVERT","NONCONVERT","ACCEPT","MODECHANGE",
        "SPACE", // 32
        "PAGE_UP","PAGE_DOWN",
        "END","HOME",
        "LEFT","UP","RIGHT","DOWN", // 37 - 40
        "SELECT","PRINT","EXECUTE","PRINTSCREEN",
        "INSERT","DELETE", // 45 - 46
        "",
        "0","1","2","3","4","5","6","7","8","9", // 48 - 57
        "COLON","SEMICOLON","LESS_THAN","EQUALS","GREATER_THAN","QUESTION_MARK","AT",
        "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z", // 65 - 90
        "LEFT_CMD",
        "",
        "RIGHT_CMD",
        "",
        "SLEEP",
        "NUMPAD0","NUMPAD1","NUMPAD2","NUMPAD3","NUMPAD4","NUMPAD5","NUMPAD6","NUMPAD7","NUMPAD8","NUMPAD9",
        "MULTIPLY","ADD","SEPARATOR","SUBTRACT","DECIMAL","DIVIDE",
        "F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","F15","F16","F17","F18","F19","F20","F21","F22","F23","F24",
        "","","","","","","","",
        "NUM_LOCK","SCROLL_LOCK",
        "WIN_OEM_FJ_JISHO","WIN_OEM_FJ_MASSHOU","WIN_OEM_FJ_TOUROKU","WIN_OEM_FJ_LOYA","WIN_OEM_FJ_ROYA",
        "","","","","","","","","",
        "CIRCUMFLEX","EXCLAMATION","DOUBLE_QUOTE","HASH","DOLLAR","PERCENT","AMPERSAND","UNDERSCORE","OPEN_PAREN","CLOSE_PAREN",
        "ASTERISK","PLUS","PIPE","HYPHEN_MINUS","OPEN_CURLY_BRACKET","CLOSE_CURLY_BRACKET","TILDE",
        "","","","",
        "VOLUME_MUTE","VOLUME_DOWN","VOLUME_UP",
        "","",
        "SEMICOLON","EQUALS","COMMA","MINUS","PERIOD","SLASH","BACK_QUOTE",
        "","","","","","","","","","","","","","","","","","","","","","","","","","",
        "OPEN_BRACKET","BACK_SLASH","CLOSE_BRACKET","QUOTE"
        ,"",
        "META","ALTGR","","WIN_ICO_HELP","WIN_ICO_00","","WIN_ICO_CLEAR","","","WIN_OEM_RESET","WIN_OEM_JUMP","WIN_OEM_PA1","WIN_OEM_PA2","WIN_OEM_PA3","WIN_OEM_WSCTRL","WIN_OEM_CUSEL","WIN_OEM_ATTN","WIN_OEM_FINISH","WIN_OEM_COPY","WIN_OEM_AUTO","WIN_OEM_ENLW","WIN_OEM_BACKTAB","ATTN","CRSEL","EXSEL","EREOF","PLAY","ZOOM","","PA1","WIN_OEM_CLEAR",""],

    keyName: function(key_code) {
        // String.fromCharCode() is not always reliable, given differences between UTF-8 and ASCII
        return this.keyboard_map[key_code].toLowerCase();
    },

    map: function(key, modifiers, fn) {
        this._actions.push({"key": key, "fn": fn, cmd: modifiers["cmd"], shift: modifiers["shift"]});
    },

    handle: function(event) {
        for(var i = 0, n = this._actions.length; i < n; i++) {
            if (this.test(event,this._actions[i])) {
                this._actions[i]["fn"](arguments);
            }
        }
    },

    test: function(event, action) {
        return  !(action["shift"] && !event.shiftKey || action["cmd"] && !event.metaKey) && (event.which == action["key"]);
                //(!action["cmd"] || !event.ctrlKey && !event.metaKey) && (event.which == action["key"]);
    },

    handleFor: function($el) {
        var key_mapper = new this.mapper($el);
    },

    isChar: function(keycode) {
        return keycode >= 48 && keycode <= 90;
    },

    isDelete: function(keycode) {
        return keycode == this.DEL || keycode == this.DELETE;
    },

    isMutator: function(keycode) {
        return this.isChar(keycode) || this.isDelete(keycode) || keycode == this.SPACE;
    },

    handlers: function($el, keyevent, keymap) {
        var me = this;
        $el.on(keyevent, function(event) {

            var handler_key = [];
            if (event.metaKey) {
                handler_key.push("cmd");
            }
            if (event.shiftKey) {
                handler_key.push("shift");
            }
            if (event.ctrlKey) {
                handler_key.push("ctrl");
            }

            var key = me.keyName(event.which);
            if (key != "win" && key != "shift" && key != "left_cmd" && key != "right_cmd") {
                handler_key.push(me.keyName(event.which));
            }
            handler_key = handler_key.join("+");

            if (keymap[handler_key]) {
                return keymap[handler_key].apply($el, [event]);
            }

            return true;
        });
    },

    mapper: function($el) {
        this.$element = $el;
    }
};

const QWERTY = keys;

/*
$.extend(keys.mapper.prototype, {
    down: function(key, fnAction) {
        this.$element.on("keydown", function(event) {

        });
    }
});
*/