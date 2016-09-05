var chromex = {
	tabs: {
		popTabOut: function (tab) {
			chrome.windows.create({tabId: tab.id});
		},

		popTabsOut: function (tab_ids) {
			chrome.windows.create({tabId: tab_ids.shift(), focused: false}, function (win) {
				chrome.tabs.move(tab_ids, {windowId: win.id, index: -1});
			});
		},

		pullTabIn: function (tab) {
			//this.activeWindow().done(function(win) {
			//    chrome.tabs.move(tab.id, {windowId: win.id, index: -1});
			//});
			console.log(this);
		},

		pullTabsIn: function (tab_ids, win_id) {
			if (typeof(win_id) != 'number') {
				chrome.windows.getCurrent(function (win) {
					chrome.tabs.move(tab_ids, {windowId: win.id, index: -1});
				});
			}
			else {
				chrome.tabs.move(tab_ids, {windowId: win_id, index: -1});
			}
		},

		// If we need to get the current visible tab from outside a tab context (e.g. background
		// or popup context)
		getCurrentTab: function (callback) {
			chrome.windows.getLastFocused({windowTypes: ['normal']}, function (win) {
				if (win) {
					chrome.tabs.query({windowId: win.id, active: true}, function (tabs) {
						if (tabs && tabs.length == 1) {
							callback(tabs[0]);
						}
						else {
							callback(null);
						}
					});
				}
				else {
					callback(null);
				}
			});
		}
	},

	view: {
		apply: function($el, data) {
			$el.find("[data-content]").each(function() {
				var property = $(this).data("content");
				if (data[property] !== undefined) {
					this.innerHTML = data[property];
				}
			});
		}
	}
};

// Support for handlebars
chromex.hb = {

	$tpl_frame: null,

	render: function (tpl, context, callback) {
		var msg = { tpl: tpl, context: context };
		var $body = $(document.body);
		$body.one("rendered:content:" + tpl, function(event, data) {
			if (typeof(callback) != 'function') {
				// assume callback is a jquery element
				callback.empty().append(data.html);
			}
			else {
				callback(data.html);
			}
		});

		var me = chromex.hb;

		if (!me.$tpl_frame) {
			me.$tpl_frame = $("<iframe>", {src:"tpl.html"}).css("display", "none");

			$body.append(me.$tpl_frame);
			window.addEventListener('message', function(event) {
				$body.trigger("rendered:content:"+event.data.tpl, event.data);
			});
			me.$tpl_frame.on("load", function() {
				me.$tpl_frame[0].contentWindow.postMessage(msg, '*');
			});
		}
		else {
			// Switch to deferred mechanism (to make sure iframe has loaded)
			setTimeout(function() {
				me.$tpl_frame[0].contentWindow.postMessage(msg, '*');
			},100);
		}
	},
	
	// NOTE: Everything else is 'psuedo-private' and should only be used in the context of the sandboxed iframe.
	_init: function() {
		var me = chromex.hb;

		// Should only be called via sandboxed iframe
		me.templates = [];

		var helpers = me.helpers;
		for(var helper in helpers) {
			Handlebars.registerHelper(helper, helpers[helper]);
		}

		window.addEventListener('message', function(event) {
			var name = event.data.tpl;
			event.source.postMessage({
				tpl: name,
				html: me._getTemplate(name)(event.data.context)
			}, event.origin);
		});
	},
	_getTemplate: function(name) {
		var me = chromex.hb;
		if (!me.templates[name]) {
			me.templates[name] = Handlebars.compile(document.getElementById(name).innerHTML);
		}

		return me.templates[name];
	},
	helpers: {
		tpl: function(name, context) {
			var subTemplate = chromex.hb._getTemplate(name);

			return new Handlebars.SafeString(subTemplate(context));
		},
		ftimefromto: function(from_time, to_time) {
			var time_span = to_time - from_time;
			var total = Math.floor(time_span / 1000),
				hours = Math.floor(total / 60 / 60),
				minutes = Math.floor(total / 60) % 60,
				secs = Math.floor(total % 60);

			return new Handlebars.SafeString([
				"<span class='hours'>", hours,
				"</span><span class='minutes'>", minutes,
				"</span><span class='seconds'>", secs, "</span>"
			].join(""));
		},
		favicon: function(tab) {
			var re = new RegExp(/chrome:/);
			if (/chrome-extension:/.test(tab.url)) {
				return "/IDR_EXTENSIONS_FAVICON@2x.png"
			}

			if (tab.favIconUrl && !re.test(tab.url)) {
				return tab.favIconUrl;
			}

			return "/chrome-file-icon.png";
		},
		winbox_size: function(num_tabs) {
			return Math.floor(Math.sqrt(num_tabs))*10;
		},
		"agtb": function(a,b) {
			return a > b;
		}
	}
};

// chromex a.k.a. 'cx'
var cx = chromex;

//var k3 = {
//	list: function(data, fnRender, el) {
//		var n = data.length;
//		var output = Array(n);
//		for(var i = 0; i < n; i++) {
//			output[i] = fnRender(data[i]);
//		}
//		output = output.join("");
//		if (el) {
//			el.innerHTML = output;
//		}
//		return output;
//	}/*,
//	$toSelector: function(element_array) {
//		return $(element_array).map (function () { return this.toArray(); } );
//	},
//    chromex: {
//
//    }*/
//};