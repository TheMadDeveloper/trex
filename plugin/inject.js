// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

keys.map(keys.PERIOD, {cmd: true}, function() {
    chrome.extension.sendRequest({activate_filter: true}, function(response) {});
});

window.addEventListener("keydown", function(event) {

  /*
  keys.handle(event);
  // Bind to both command (for Mac) and control (for Win/Linux)
  var modifier = event.ctrlKey || event.metaKey;
    //console.log(event.keyCode);
    if (event.keyCode == 191) {
        chrome.extension.sendRequest({toggle_pin: true}, function(response) {
          // Do stuff on successful response
        });
    }
    */

    console.log(event);
    //console.log(keys.test(event, {"key": 40}));
    //keys.handle(event);
}, false);
