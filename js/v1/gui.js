/*
   Cheetah News JS/v1 GUI
   Copyright (C) 2005, 2006, 2007 Wojciech Polak.

   This program is free software; you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation; either version 3 of the License, or (at your
   option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License along
   with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var eWindow = null;
var eWindowContent = null;
var sWindow = null;
var sWindowFeeds = null;
var dWindow = null;
var aWindow = null;
var cWindow = null;
var cWindowSaveChanges = null;
var footer = null;
var openedLabel = null;
var movContainer = null;
var folderListMenu = null;
var menu = null;
var menuLink = null;
var menuInvt = null;
var sChanged = false;
var sChangedInterface = false;
var mFeed = null;
var con = null;
var imageFO = null;
var swLeft = 17;
var bwLeft = 0;

function js_initGui () {
  eWindow = js_createWindow ('e', null, _('Error Information'), false);
  var eWindowBottom = document.createElement ('DIV');
  eWindowBottom.id = 'eWindowBottom';
  eWindowBottom.innerHTML = '<table width="100%"><tr><td align="right">'
    + '<span id="eWindowClear" class="linkEWindow">' + _('clear')
    + '</span></td></tr></table>';
  eWindow.appendChild (eWindowBottom);
  eWindowContent = GID ('eWindowContent');
  js_prepareWindowClose (GID ('eWindowClose'), js_closeEWindow);
  GID ('eWindowClear').onclick = js_clearEWindow;

  var slr = js_readCookie ('cheetahInterface');
  if (slr) {
    js_setInterface (slr);
    if (slr == 'style1')
      GID ('cWindowLabel_4_IR1').checked = true;
    else if (slr == 'style1sticky')
      GID ('cWindowLabel_4_IR2').checked = true;
  }

  folderListMenu = document.createElement ('DIV');
  folderListMenu.id = 'folderListMenu';
  folderListMenu.className = 'contextMenu';
  feeds = document.createElement ('DIV');
  feeds.id = 'feeds';
  footer = document.createElement ('DIV');
  footer.id = 'footer';
  footer.style.display = 'none';
  var p = document.createElement ('P');
  p.style.position = 'relative';
  p.innerHTML = '&nbsp;';

  document.body.appendChild (folderListMenu);
  document.body.appendChild (feeds);
  document.body.appendChild (footer);
  document.body.appendChild (p);

  topRightInfo = GID ('topRightInfo');
  progressBar  = GID ('progressBar');
  movContainer = GID ('movContainer');

  sWindow = js_createEmptyWindow ('s', null, _('My Stuff'));
  var sWindowModules = GID ('sWindowModules');
  var sWindowSeparator = document.createElement ('DIV');
  sWindowSeparator.id = 'sWindowSeparator';
  var sWindowOptions = GID ('sWindowOptions');
  sWindowFeeds = document.createElement ('DIV');
  sWindowFeeds.id = 'sWindowFeeds';
  sWindowFeeds.innerHTML = _('Loading...');
  sWindow.appendChild (sWindowModules);
  sWindow.appendChild (sWindowSeparator);
  sWindow.appendChild (sWindowOptions);
  sWindow.appendChild (sWindowFeeds);
  sWindowModules.style.display = 'block';
  sWindowOptions.style.display = 'block';
  sWindowFeeds.style.display = 'block';

  for (var module in Modules) {
    var rs = Modules[module].init ();
    if (!rs)
      delete Modules[module];
  }
  if (js_findActiveModules (sWindowModules).length == 0) {
    sWindowSeparator.style.display = 'none';
    sWindowModules.style.display = 'none';
    sWindowOptions.style.marginTop = '3px';
  }
  else
    sWindowSeparator.style.display = 'block';
  
  js_registerWindow (sWindow);
  js_prepareWindowClose (GID ('sWindowClose'), js_closeSWindow);

  GID ('welcome').innerHTML = _('Welcome');
  js_prepareLink ('about', 'Cheetah News', _('About Cheetah News'), js_openAWindow);
  js_prepareBLink ('showAllActive', _('show active'), _('Show all active feeds'), js_showAllActive);
  js_prepareBLink ('showAllLoaded', _('show loaded'), _('Show all loaded feeds'), js_showAllLoaded);
  js_prepareBLink ('hideAll', _('hide all'), _('Hide all feeds'), function () {
      js_hideAll ();
      WindowSystem.focus (sWindow);
    });
  js_prepareBLink ('refreshAll', _('refresh visible'), _('Refresh all visible feeds'), js_refreshVisible);
  if (Modules.Filter) {
    js_prepareBLink ('filterVisible', _('filter visible'), _('Filter visible feeds'), Modules.Filter.js_shortcut);
    GID ('filterVisible').onclick = function (e) {
      if (!e) var e = window.event;
      e.cancelBubble = true;
      if (e.stopPropagation) e.stopPropagation ();
      if (msie)
	setTimeout (function () { js_setCaretToEnd (GID ('filterInput')); }, 250);
      return false;
    };
  }
  GID ('header').style.display = 'block';
  
  var expandFolders = GID ('expandFolders');
  var collapseFolders = GID ('collapseFolders');
  expandFolders.innerHTML = _('Expand');
  expandFolders.title = _('Expand folders');
  expandFolders.onmousedown = js_expandFolders;
  expandFolders.onmouseover = js_styleLink;
  expandFolders.onmouseout  = js_styleILink;
  collapseFolders.innerHTML = _('Collapse');
  collapseFolders.title = _('Collapse folders');
  collapseFolders.onmousedown = js_collapseFolders;
  collapseFolders.onmouseover = js_styleLink;
  collapseFolders.onmouseout  = js_styleILink;

  GID ('menuOpenSWindow').innerHTML  += '&nbsp;' + _('Show My Stuff') + '&nbsp;';
  GID ('menuOpenCWindow1').innerHTML += '&nbsp;' + _('Add New Feed') + '&nbsp;';
  GID ('menuOpenCWindow2').innerHTML += '&nbsp;' + _('Manage Subscriptions') + '&nbsp;';
  GID ('menuOpenCWindow3').innerHTML += '&nbsp;' + _('Manage Folders') + '&nbsp;';
  GID ('menuOpenCWindow4').innerHTML += '&nbsp;' + _('User Settings') + '&nbsp;';
  GID ('logout').innerHTML += '&nbsp;' + _('Logout') + '&nbsp;';

  js_initWSizes ();
  js_initMenu ();
  if (document.images) {
    imageFO = new Image (16, 16);
    imageFO.src = 'images/folderopen.png';
  }

  if (msie)
    sWindow.style.top = '45px';

  js_resizeSWindow ();
  window.onresize = js_resizeSWindow;

  js_setFooter ();

  try { window.focus (); } catch (E) {}
}

function js_createEmptyWindow (id, classTitle, title) {
  var win = document.createElement ('DIV');
  win.id = id + 'Window';
  if (classTitle)
    win.className = classTitle;
  win.style.display = 'none';
  var wtb = document.createElement ('DIV');
  wtb.id = id + 'WindowTitleBar';
  wtb.className = 'WindowTitleBarInactive';
  wtb.innerHTML = '<table width="100%"><tr><td align="left">' + title + '</td><td align="right"><span id="'
    + id + 'WindowClose" class="link" title="' + _('Close Window')
    + '"><img src="images/12_remove.png" width="12" height="12" />'
    + '</span></td></tr></table>';
  win.appendChild (wtb);
  document.body.appendChild (win);
  return win;
}

function js_createWindow (id, classTitle, title, content) {
  var win = js_createEmptyWindow (id, classTitle, title);
  if (content) {
    var con = GID (id + 'WindowContent');
    win.appendChild (con);
    con.style.display = 'block';
  }
  else {
    var con = js_createEmptyWContent (id, 'fWindowContent');
    win.appendChild (con);
  }
  if (!opera) {
    var r = document.createElement ('DIV');
    r.id = id + 'Resize';
    r.style.position = 'absolute';
    r.style.bottom = msie ? '-10px' : '0px';
    r.style.right = '0px';
    r.style.cursor = 'se-resize';
    r.style.display = 'block';
    r.innerHTML = '<div class="seResize"></div>';
    r.onmousedown = function (e) {
      if (!e) var e = window.event;
      startResize (e, win, GID (id + 'WindowContent'));
    };
    win.appendChild (r);
  }
  return win;
}

function js_createEmptyWContent (id, className) {
  var content = document.createElement ('DIV');
  content.id = id + 'WindowContent';
  content.className = className;
  return content;
}

function js_createBWindow (id, desc) {
  var win = document.createElement ('DIV');
  win.id = 'bWindow_' + id;
  win.className = 'bWindow';
  win.style.display = 'none';
  var wtb = document.createElement ('DIV');
  wtb.className = 'WindowTitleBarInactive';
  wtb.innerHTML = '<table width="100%"><tr><td align="left" style="cursor:default"><span id="bWindowTitle_' + id
    + '">' + desc + '</span>&nbsp;&nbsp;<span id="bWindowReload_' + id
    + '" class="link" title="' + _('Reload this feed') +'">'
    + '<img src="images/12_reload.png" width="12" height="12" /></span><span id="bWindowFiltered_' + id
    + '" class="feedFiltered"></span></td><td align="right"><span id="bWindowClose_' + id
    + '" class="link" title="' + _('Close Window') + '">'
    + '<img src="images/12_remove.png" width="12" height="12" /></span></td></tr></table>';
  wtb.ondblclick = function () {
    js_clearSelection ();
    js_scrollToElement (win);
  };
  win.appendChild (wtb);
  var fw = document.createElement ('DIV');
  fw.id = 'feedWaiting_' + id;
  fw.className = 'feedWaiting';
  fw.innerHTML = _('fetching data...');
  if (msie)
    fw.style.styleFloat = 'right';
  else {
    fw.style.position = 'absolute';
    fw.style.right = '9px';
  }
  fw.style.display = 'none';
  win.appendChild (fw);
  var bc = document.createElement ('DIV');
  bc.id = 'bWindowContent_' + id;
  bc.className = 'bWindowContent';
  win.appendChild (bc);
  js_traverseDOM (win, prepareFeed, id);
  js_registerBWindow (win);
  feeds.appendChild (win);
}

function js_prepareWindowClose (obj, cb) {
  if (obj) {
    obj.onmousedown = function (e) {
      if (!e) var e = window.event;
      e.cancelBubble = true;
      if (e.stopPropagation) e.stopPropagation ();
      return false;
    };
    obj.onclick = function () {
      cb (this);
      WindowSystem.lwfocus ();
    };
  }
}

function js_prepareLink (id, text, title, fnc) {
  var link = GID (id);
  if (link) {
    link.innerHTML = text;
    link.title = title;
    link.onmousedown = function (e) {
      if (!e) var e = window.event;
      e.cancelBubble = true;
      if (e.stopPropagation) e.stopPropagation ();
      fnc ();
      return false;
    };
  }
}

function js_prepareBLink (id, text, title, fnc) {
  js_prepareLink (id, text, title, fnc);
  var link = GID (id);
  if (link) {
    link.onmouseover = js_styleLButtonB;
    link.onmouseout  = js_styleLButton;
  }
}

function js_styleLink () { this.className = 'link'; }
function js_styleILink () { this.className = 'ilink'; }
function js_styleIFocus () { this.className = 'ifocus'; }
function js_styleLinkCM () { this.className = 'linkCM'; }
function js_styleLinkCMH () { this.className = 'linkCMH'; }
function js_styleLButton () { this.className = 'lbutton'; }
function js_styleLButtonB () { this.className = 'lbuttonb'; }
function js_styleEmpty () { this.className = ''; }

function js_prepareInput (obj) {
  obj.onfocus = js_styleIFocus;
  obj.onblur  = js_styleEmpty;
}

function js_initWSizes () {
  if (screen.width > 1024)
    swLeft += 1;
  bwLeft = swLeft + 2;
  sWindow.style.width = swLeft + 'em';
  feeds.style.marginLeft = bwLeft + 'em';
}

function js_initFolderListMenu (curFolder) {
  folderListMenu.innerHTML = '';
  if (curFolder != 0) {
    var fo = document.createElement ('SPAN');
    fo.id  = 'fo_0';
    fo.className = 'linkCM';
    fo.innerHTML = '&nbsp;&raquo;&nbsp;' + _('Root folder') + '&nbsp;';
    js_setCmhLink (fo, function () { js_moveFeed (mFeed, this.id.split('_')[1]); } );
    folderListMenu.appendChild (fo);
  }
  if (cheetahData) {
    for (var foi = 0; foi < cheetahData.folderOrder.length; foi++) {
      var folderid = cheetahData.folderOrder[foi];
      var name = cheetahData.folders[folderid]; /* folder name */
      if (folderid != curFolder) {
	var fo = document.createElement ('SPAN');
	fo.id  = 'fo_' + folderid;
	fo.className = 'linkCM';
	fo.innerHTML = '&nbsp;&raquo;&nbsp;' + name + '&nbsp;';
	js_setCmhLink (fo, function () { js_moveFeed (mFeed, this.id.split('_')[1]); } );
	folderListMenu.appendChild (fo);
      }
    }
  }
}

function js_showFolderListMenu (e) {
  var link = this;
  if (!folderListMenu) return false;
  mFeed = js_findParentContainer (link, 'movContainer');
  var cw_folderSelect = GID ('cw_folderSelect');
  var curFolder = cw_folderSelect.options[cw_folderSelect.selectedIndex].value;
  js_initFolderListMenu (curFolder);
  if (!e) var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation ();
  var x = js_findPosX (link);
  folderListMenu.style.left = (x + 14) + 'px';
  var y = js_findPosY (link);
  y -= GID ('moveBox_' + curFolder).scrollTop;
  folderListMenu.style.top = y + 'px';
  folderListMenu.style.display = 'inline';

  var yBottom = y + parseInt (folderListMenu.clientHeight);
  var yDiff = yBottom - js_getWindowHeight () - js_getScrollY ();
  if (yDiff > 0)
    folderListMenu.style.top = (y - yDiff - 5) + 'px';

  document.onclick = js_hideFolderListMenu;
}

function js_hideFolderListMenu () {
  document.onclick = null;
  folderListMenu.style.display = 'none';
  mFeed = null;
}

function js_moveFeed (src, dst) {
  var moveBox = GID ('moveBox_' + dst);
  moveBox.appendChild (src);
  js_sChanged ();
}

function js_initMenu () {
  menu = GID ('menu');
  if (menu == null) return;
  menu.onclick = function (e) {
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation ();
  };
  menuLink = GID ('menuLink');
  menuLink.title = _('Menu');
  menuLink.innerHTML = _('menu') + ' &raquo;';
  if (menuLink != null) {
    menuLink.onclick = js_showMenu;
    menuLink.oncontextmenu = js_showMenu;
  }

  js_setCmhLink (GID ('logout'), function () { document.location = 'logout'; });
  js_setCmhLink (GID ('menuOpenCWindow1'), function () { this.className = 'linkCM'; js_openCWindow (1); });
  js_setCmhLink (GID ('menuOpenCWindow2'), function () { this.className = 'linkCM'; js_openCWindow (2); });
  js_setCmhLink (GID ('menuOpenCWindow3'), function () { this.className = 'linkCM'; js_openCWindow (3); });
  js_setCmhLink (GID ('menuOpenCWindow4'), function () { this.className = 'linkCM'; js_openCWindow (4); });
  menu.style.width = (menuLength * 0.55 + 1) + 'em';
}

function max (a, b) {
  return a > b ? a : b;
}

var menuLength = 24;
function js_setCmhLink (el, fnc) {
  if (!el) return;
  el.onclick = fnc;
  el.onmouseover = js_styleLinkCMH;
  el.onmouseout  = js_styleLinkCM;
  if (el.innerText)
    menuLength = max (el.innerText.length, menuLength);
}

function js_showMenu (e) {
  js_clearSelection ();
  if (!menuLink || !menu) return false;
  if (!e) var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation ();
  menuLink.onclick = null;
  var x = js_findPosX (menuLink);
  menu.style.left = x + 'px';
  menu.style.top  = (js_findPosY (menuLink) + 17) + 'px';
  menu.style.display = 'inline';
  document.onclick = js_hideMenu;
}

function js_hideMenu () {
  document.onclick = null;
  menu.style.display = 'none';
  menuLink.onclick = js_showMenu;
}

function js_findPosX (obj) {
  var left = 0;
  if (obj.offsetParent) {
    while (obj.offsetParent) {
      left += obj.offsetLeft;
      obj = obj.offsetParent;
    }
  }
  else if (obj.x)
    left += obj.x;
  return left;
}

function js_findPosY (obj) {
  var top = 0;
  if (obj.offsetParent) {
    while (obj.offsetParent) {
      top += obj.offsetTop;
      obj = obj.offsetParent;
    }
  }
  else if (obj.y)
    top += obj.y;
  return top;
}

function js_getStyle (x, styleProp) {
  if (document.defaultView && document.defaultView.getComputedStyle)
    return document.defaultView.getComputedStyle (x, null).getPropertyValue (styleProp);
  else if (x.currentStyle)
    return x.currentStyle[styleProp];
  return null;
}

function js_setCaretToEnd (input) {
  if (input && input.setSelectionRange)
    input.focus ();
  else if (input && input.createTextRange) {
    var range = input.createTextRange ();
    range.collapse (false);
    range.moveEnd ('character', input.value.length);
    range.moveStart ('character', input.value.length);
    range.select ();
  }
}

function js_updateUrlStatusBar (dw, color, msg) {
  if (dw) {
    var dwc = GID ('dWindowContentMsg2');
    if (color == 'red')
      dwc.innerHTML = '<img src="images/16_error.png" width="16" height="16" alt="!" />&nbsp;' + msg;
    else
      dwc.innerHTML = '<img src="images/16_tick.png" width="16" height="16" alt="" />&nbsp;' + msg;
  }
  else {
    var statusBar = GID ('addURLStatusBar');
    statusBar.style.backgroundColor = color;
    statusBar.innerHTML = '&nbsp;' + msg + '&nbsp;';
    statusBar.style.display = 'inline';
  }
}

function js_validateFeed (url) {
  if (!js_checkOnline ()) return;
  if (sendIntv) return;
  if (url == '') {
    js_updateUrlStatusBar (false, 'red', _('Invalid URL'));
  }
  else {
    GID ('addURLAdd').disabled = true;
    cWindow.style.cursor = 'wait';
    var snd = 'add=' + encodeURIComponent (url);
    js_updateUrlStatusBar (false, 'green', _('Validating URL...'));
    var xhs = js_mdb (snd, js_addNewFeed, js_validateFeedRecover);
    sendIntv = setTimeout (function () {
			     if (xhs && xhs.readyState != 0) xhs.abort ();
			     cWindow.style.cursor = 'auto';
			     js_updateUrlStatusBar (false, 'red', _('Timeout Error!'));
			     GID ('addURLAdd').disabled = false;
			     sendIntv = null; }, 30000);
  }
}

function js_addNewFeed (xml) {
  var sts = js_xmlStatus (xml);
  if (sts) {
    js_updateUrlStatusBar (false, 'red', sts);
  }
  else {
    var feedid = null;
    var desc   = null;
    js_updateUrlStatusBar (false, 'green', _('OK'));
    var node = js_lookupNode (xml, 'feedid');
    if (node)
      feedid = node.firstChild.nodeValue;
    node = js_lookupNode (xml, 'description');
    if (node)
      desc = node.firstChild.nodeValue;
    if (feedid && desc) {
      js_appendSWindow (feedid, desc, '0');
      js_createBWindow (feedid, desc);
      js_fetchUserData (js_reinitData);
      var input = GID ('addURLInput');
      input.value = '';
      input.focus ();
    }
  }
  cWindow.style.cursor = 'auto';
  GID ('addURLAdd').disabled = false;
}

var sbsintv = null;
function js_addNewFeed2 (xml) {
  js_prepareWindowClose (GID ('dWindowClose'), js_closeDWindow);
  var sts = js_xmlStatus (xml);
  if (sts) {
    js_updateUrlStatusBar (true, 'red', sts);
    js_resetTitle ();
  }
  else {
    var feedid = null;
    var desc   = null;
    js_updateUrlStatusBar (true, 'green', _('OK'));
    var node = js_lookupNode (xml, 'feedid');
    if (node)
      feedid = node.firstChild.nodeValue;
    node = js_lookupNode (xml, 'description');
    if (node)
      desc = node.firstChild.nodeValue;
    if (feedid && desc) {
      js_appendSWindow (feedid, desc, '0');
      js_createBWindow (feedid, desc);
      js_fetchUserData (js_reinitData);
      sbsintv = setInterval (function () {
	  if (typeof cheetahData.feeds[feedid] != 'undefined') {
	    if (sbsintv) {
	      clearInterval (sbsintv);
	      sbsintv = null;
	    }
	    js_openFeed (feedid, false);
	    js_closeDWindow ();
	  }
	}, 500);
    }
  }
  GID ('addURLAdd').disabled = false;
}

function js_validateFeedRecover (status, statusText) {
  js_stderr ('addNewFeed Error: ' + status +': '+ statusText);
  cWindow.style.cursor = 'auto';
  GID ('addURLAdd').disabled = false;
}

function js_addFeedUrl (url) {
  js_openDWindow ();
  if (url == '') {
    js_updateUrlStatusBar (true, 'red', _('Invalid URL'));
    js_resetTitle ();
  }
  else {
    var dwc = GID ('dWindowContentMsg1');
    dwc.innerHTML = '<b>&nbsp;' + js_sprintf (_('Subscribing to %s...'),
					      ('<a href="'+ url +'" target="_blank" onmouseup="this.blur()">'
					       + url.substring (0, 50) +'</a>')) + '&nbsp;</b>';
    GID ('addURLAdd').disabled = true;
    var snd = 'add=' + encodeURIComponent (url);
    js_updateUrlStatusBar (true, 'green', _('Validating URL...'));
    var xhs = js_mdb (snd, js_addNewFeed2, js_validateFeedRecover);
    sendIntv = setTimeout (function () {
			     if (xhs && xhs.readyState != 0) xhs.abort ();
			     cWindow.style.cursor = 'auto';
			     js_updateUrlStatusBar (true, 'red', _('Timeout Error!'));
			     js_resetTitle ();
			     GID ('addURLAdd').disabled = false;
			     sendIntv = null; }, 30000);
  }
}

function js_openDWindow () {
  if (!dWindow) {
    dWindow = js_createEmptyWindow ('d', 'dWindow', _('Info Window'));
    var con = GID ('dWindowContent');
    dWindow.appendChild (con);
    con.style.display = 'block';
  }
  js_popUp (dWindow);
  js_setupDrag (dWindow);
  js_registerWindow (dWindow);
}

function js_closeDWindow () {
  GID ('dWindowTitleBar').onmousedown = null;
  dWindow.style.display = 'none';
}

function js_addSwitcher () {
  var addURL = GID ('addURL');
  var addOPML = GID ('addOPML');
  if (addURL.style.display != 'none') {
    GID ('uploadStatusBar').style.display = 'none';
    addURL.style.display = 'none';
    addOPML.style.display = 'block';
    GID ('addSwitcher').innerHTML = _('Or add feed by URL');
  }
  else {
    GID ('addURLStatusBar').style.display = 'none';
    addOPML.style.display = 'none';
    addURL.style.display = 'block';
    GID ('addSwitcher').innerHTML = _('Or import an OPML file');
    GID ('addURLInput').focus ();
  }
}

function js_updateUploadStatusBar (color, msg) {
  var statusBar = GID ('uploadStatusBar');
  statusBar.style.backgroundColor = color;
  statusBar.innerHTML = '&nbsp;' + msg + '&nbsp;';
  statusBar.style.display = 'inline';
}

function js_uploadOPML () {
  if (!js_checkOnline ()) return false;
  js_updateUploadStatusBar ('green', _('Importing file...'));
  var uploadResult = GID ('uploadResult');
  if (msie) {
    uploadResult.attachEvent ('onload', js_getUploadResult);
  }
  else
    uploadResult.onload = js_getUploadResult;
  return true;
}

function js_getUploadResult () {
  var xml = null;
  var uploadResult = GID ('uploadResult');
  if (uploadResult.contentDocument)
    xml = uploadResult.contentDocument;
  else if (uploadResult.contentWindow && uploadResult.contentWindow.document)
    xml = uploadResult.contentWindow.document;
  if (msie)
    xml = xml.XMLDocument;
  var sts = js_xmlStatus (xml);
  if (sts) {
    js_updateUploadStatusBar ('red', sts);
  }
  else {
    js_updateUploadStatusBar ('green', _('OK'));
    sWindowFeeds.innerHTML = _('Loading...');
    feeds.innerHTML = '';
    js_run ();
  }
  if (msie) {
    uploadResult.detachEvent ('onload', js_getUploadResult);
  }
  else
    uploadResult.onload = null;
}

function js_updateFolderStatusBar (color, msg) {
  var statusBar = GID ('addFolderStatusBar');
  statusBar.style.backgroundColor = color;
  statusBar.innerHTML = '&nbsp;' + msg + '&nbsp;';
  statusBar.style.display = 'inline';
}

function js_validateFolder () {
  if (!js_checkOnline ()) return;
  var folder = GID ('addFolderInput').value;
  if (folder == '') {
    js_updateFolderStatusBar ('red', _('Invalid folder name'));
  }
  else {
    GID ('addFolderAdd').disabled = true;
    cWindow.style.cursor = 'wait';
    var snd = 'add=1&folder=' + encodeURIComponent (folder);
    js_updateFolderStatusBar ('green', _('Adding folder...'));
    js_mdb (snd, js_addNewFolder, js_validateFolderRecover);
  }
}

function js_addNewFolder (xml) {
  var sts = js_xmlStatus (xml);
  if (sts) {
    js_updateFolderStatusBar ('red', sts);
  }
  else {
    var folderid = null;
    var fname    = null;
    js_updateFolderStatusBar ('green', _('OK'));
    var node = js_lookupNode (xml, 'folderid');
    if (node)
      folderid = node.firstChild.nodeValue;
    node = js_lookupNode (xml, 'name');
    if (node)
      fname = node.firstChild.nodeValue;
    if (folderid && fname) {
      js_appendFolder (folderid, fname, true);
      js_fetchUserData (function (data) { js_reinitData (data); js_openCWindowLabel (3); });
      var input = GID ('addFolderInput');
      input.value = '';
      input.focus ();
    }
  }
  cWindow.style.cursor = 'auto';
  GID ('addFolderAdd').disabled = false;
}

function js_validateFolderRecover (status, statusText) {
  js_stderr ('addFolderFeed Error: ' + status +': '+ statusText);
  cWindow.style.cursor = 'auto';
  GID ('addFolderAdd').disabled = false;
}

function js_sChanged () {
  sChanged = true;
  cWindowSaveChanges.disabled = false;
}

function js_changeRefreshRate () {
  var val = parseInt (this.value);
  if (isNaN (val)) val = 0;
  if (val < 0 || val > 9999) this.value = '0';
  else if (val > 0 && val < 15) this.value = '15';
  else this.value = val;
  js_sChanged ();
}

function js_saveChanges2 () {
  if (!js_checkOnline ()) return;
  cWindowSaveChanges.disabled = true;
  cWindow.style.cursor = 'wait';
  var activeCounter = 0;
  var feeds_order = '';
  var moveBox = GID ('moveBox_0');
  for (var j = 0; j < moveBox.childNodes.length; j++) {
    var feedid = moveBox.childNodes[j].id.split ('_')[1]; /* [1] feedid */
    var desc   = js_encodeSD (GID ('desc_' + feedid).value);
    if (!desc) desc = 'Nameless';
    var latest = parseInt (GID ('latest_' + feedid).value);
    if (latest < 1 || latest > 99) latest = 1;
    var expand = parseInt (GID ('expand_' + feedid).value);
    if (expand < 0 || expand > 99) expand = 1;
    if (expand > latest) expand = latest;
    var active = GID ('active_' + feedid).checked ? '1' : '0';
    if (active == '1') activeCounter++;
    feeds_order += feedid +','+ desc +',0,'+ latest +','+ expand +','+ active + ':';
  }
  if (cheetahData) {
    for (var i = 0; i < cheetahData.folderOrder.length; i++) {
      var folderid = cheetahData.folderOrder[i];
      var moveBox = GID ('moveBox_' + folderid);
      for (var j = 0; j < moveBox.childNodes.length; j++) {
	var feedid = moveBox.childNodes[j].id.split ('_')[1]; /* [1] feedid */
	var desc   = js_encodeSD (GID ('desc_' + feedid).value);
	if (!desc) desc = 'Nameless';
	var latest = parseInt (GID ('latest_' + feedid).value);
	if (latest < 1 || latest > 99) latest = 1;
	var expand = parseInt (GID ('expand_' + feedid).value);
	if (expand < 0 || expand > 99) expand = 1;
	if (expand > latest) expand = latest;
	var active = GID ('active_' + feedid).checked ? '1' : '0';
	if (active == '1') activeCounter++;
	feeds_order += feedid +','+ desc +','+ folderid +','+
	  latest +','+ expand +','+ active + ':';
      }
    }
  }
  var proceed = true;
  if (activeCounter > 10)
    proceed = confirm (_('You have checked more than 10 active feeds.\nThis might slow down the startup process.\nWould you like to proceed?'));
  if (proceed) {
    feeds_order = feeds_order.substr (0, feeds_order.length - 1);
    if (feeds_order == '') feeds_order = 'flushAll';
    var refresh = parseInt (GID ('cWindowRefreshRate').value);
    if (refresh > 0 && refresh < 15) refresh = 15;
    var safs = GID ('cWindowShowActive').checked ? '1' : '0';
    var oldf = GID ('cWindowOldestFirst').checked ? '1' : '0';
    var snd = 'save=1&lucid=' + (cheetahData ? cheetahData.lucid : '');
    snd += '&refresh=' + refresh + '&safs=' + safs + '&oldf=' + oldf;
    snd += ('&feeds=' + encodeURIComponent (feeds_order));
    var xhs = js_mdb (snd, js_checkSave2, js_saveChangesRecover);
    sendIntv = setTimeout (function () {
			     if (xhs && xhs.readyState != 0) xhs.abort ();
			     cWindow.style.cursor = 'auto';
			     alert (_('Timeout Error!'));
			     cWindowSaveChanges.disabled = false;
			     sendIntv = null; }, 15000);
  }
  else {
    cWindowSaveChanges.disabled = false;
    cWindow.style.cursor = 'auto';
  }
}

function js_checkSave2 (xml) {
  cWindow.style.cursor = 'auto';
  var sts = js_xmlStatus (xml);
  if (sts) {
    js_error (sts);
    cWindowSaveChanges.disabled = false;
  }
  else {
    sWindowFeeds.innerHTML = _('Loading...');
    js_fetchUserData (js_reinitData);
    js_closeCWindow ();
  }
}

function js_saveChangesRecover (status, statusText) {
  js_stderr ('saveChanges Error: ' + status +': '+ statusText);
  cWindow.style.cursor = 'auto';
  cWindowSaveChanges.disabled = false;
}

function js_saveChanges3 () {
  if (!js_checkOnline ()) return;
  cWindowSaveChanges.disabled = true;
  cWindow.style.cursor = 'wait';
  var folders_order = '';
  if (cheetahData) {
    var fmoveBoxes = GID ('fmoveBoxes');
    for (var i = 0; i < fmoveBoxes.childNodes.length; i++) {
      var folderid = fmoveBoxes.childNodes[i].id.split ('_')[1]; /* [1] folderid */
      var desc = js_encodeSD (GID ('fdesc_' + folderid).value);
      if (!desc) desc = 'Nameless';
      folders_order += folderid +','+ desc + ':';
    }
  }
  folders_order = folders_order.substr (0, folders_order.length - 1);
  if (folders_order == '') folders_order = 'flushAll';
  var snd = 'save=1&lucid=' + (cheetahData ? cheetahData.lucid : '');
  snd += '&folders=' + encodeURIComponent (folders_order);
  var xhs = js_mdb (snd, js_checkSave3, js_saveChangesRecover);
  sendIntv = setTimeout (function () {
			   if (xhs && xhs.readyState != 0) xhs.abort ();
			   cWindow.style.cursor = 'auto';
			   alert (_('Timeout Error!'));
			   cWindowSaveChanges.disabled = false;
			   sendIntv = null; }, 15000);
}

function js_checkSave3 (xml) {
  cWindow.style.cursor = 'auto';
  var sts = js_xmlStatus (xml);
  if (sts) {
    js_error (sts);
    cWindowSaveChanges.disabled = false;
  }
  else {
    sWindowFeeds.innerHTML = _('Loading...');
    js_fetchUserData (js_reinitData);
    js_closeCWindow ();
  }
}

function js_switchInterface () {
  sChangedInterface = this.value;
  cWindowSaveChanges.disabled = false;
}

function js_setInterface (id) {
  var a;
  for (var i = 0; (a = document.getElementsByTagName ('link')[i]); i++) {
    if (a.getAttribute ('rel').indexOf ('style') != -1) {
      a.disabled = true;
      if (a.id == id)
	a.disabled = false;
    }
  }
}

function js_saveChanges4 () {
  if (!js_checkOnline ()) return;
  cWindowSaveChanges.disabled = true;
  if (sChangedInterface) {
    js_setInterface (sChangedInterface);
    js_writeCookie ('cheetahInterface', sChangedInterface, 365);
    sChangedInterface = false;
    if (!sChanged)
      js_closeCWindow ();
  }
  if (sChanged) {
    cWindow.style.cursor = 'wait';
    var changeLangOptions = GID ('changeLangOptions');
    var snd = 'save=1&lang=' + changeLangOptions.options[changeLangOptions.selectedIndex].value;
    var xhs = js_mdb (snd, js_checkSave4, js_saveChangesRecover);
    sendIntv = setTimeout (function () {
			     if (xhs && xhs.readyState != 0) xhs.abort ();
			     cWindow.style.cursor = 'auto';
			     alert (_('Timeout Error!'));
			     cWindowSaveChanges.disabled = false;
			     sendIntv = null; }, 15000);
  }
}

function js_checkSave4 (xml) {
  cWindow.style.cursor = 'auto';
  var sts = js_xmlStatus (xml);
  if (sts) {
    js_error (sts);
    cWindowSaveChanges.disabled = false;
  }
  else
    document.location.reload ();
}

function js_openSWindow () {
  js_hideMenu ();
  feeds.style.marginLeft = bwLeft + 'em';
  footer.style.marginLeft = bwLeft + 'em';
  js_registerWindow (sWindow);
  js_resizeSWindow ();
  var menuOpenSWindow = GID ('menuOpenSWindow');
  menuOpenSWindow.onclick = null;
  menuOpenSWindow.className = 'ilinkCM';
  menuOpenSWindow.onmouseover = null;
  menuOpenSWindow.onmouseout = null;
}

function js_closeSWindow () {
  sWindow.style.display = 'none';
  feeds.style.marginLeft = '10px';
  footer.style.marginLeft = '10px';
  var menuOpenSWindow = GID ('menuOpenSWindow');
  menuOpenSWindow.className = 'linkCM';
  js_setCmhLink (menuOpenSWindow, function () { this.className = 'linkCM'; js_openSWindow (); });
}

function js_resizeSWindow () {
  if (sWindow.style.display != 'none') {
    var ys = js_findPosY (sWindow);
    var h = js_findPosY (sWindowFeeds) - ys;
    var wh = js_getWindowHeight ();
    if (wh > 0) {
      if (opera && js_getStyle (sWindow, 'position') == 'fixed')
	wh -= 50;
      sWindow.style.height = (wh - ys - 25) + 'px';
      sWindowFeeds.style.height = (sWindow.clientHeight - h) + 'px';
    }
  }
}

function js_openAWindow () {
  if (msie) js_clearSelection ();
  if (!aWindow) {
    aWindow = js_createWindow ('a', null, _('About Cheetah News'), true);
    js_prepareWindowClose (GID ('aWindowClose'), js_closeAWindow);
  }
  js_popUp (aWindow);
  js_setupDrag (aWindow);
  js_registerWindow (aWindow);
  return false;
}

function js_closeAWindow () {
  GID ('aWindowTitleBar').onmousedown = null;
  aWindow.style.display = 'none';
  js_initAllKShortcuts ();
}

function js_openEWindow () {
  js_popUp (eWindow);
  js_setupDrag (eWindow);
  js_registerWindow (eWindow);
  eWindowContent.scrollTop = eWindowContent.scrollHeight;
}

function js_closeEWindow () {
  eWindow.style.display = 'none';
}

function js_clearEWindow () {
  eWindowContent.innerHTML = '';
  errorNotifier.style.display = 'none';
}

function js_initCWindow () {
  cWindow = js_createWindow ('c', null, _('Settings'), true);
  cWindow.minWidth  = 550;
  cWindow.minHeight = 300;
  cWindow.afterresize = function () {
    js_fixCWindowHeights (openedLabel);
    js_fixCMBoxesHeights (openedLabel);
    if (GID ('popularFeeds').style.display == 'block')
      js_fixPFeedsHeight ();
  };

  cWindowSaveChanges = GID ('cWindowSaveChanges');
  cWindowSaveChanges.value = _('Save changes');
  var cWindowCloseSettings = GID ('cWindowCloseSettings');
  cWindowCloseSettings.value = _('Cancel');
  cWindowCloseSettings.onclick = function () {
    if (cWindow.style.cursor != 'wait') {
      js_closeCWindow ();
      WindowSystem.lwfocus ();
    }
  }

  GID ('cWindowLabel_1DescURL').innerHTML = _('Add a specific RSS, RDF, or ATOM feed by entering the URL below (Autodiscovery supported).');
  GID ('cWindowLabel_1DescOPML').innerHTML = _('Import your subscriptions from an OPML file.');
  GID ('cWindowLabel_2Desc').innerHTML  = _('Refresh rate (active feeds)') + ':';
  GID ('cWindowLabel_2Desc2').innerHTML = _('Show active feeds on startup') + ':';
  GID ('cWindowLabel_2Desc3').innerHTML = _('Oldest entries first') + ':';
  GID ('cWindowLabel_3Desc').innerHTML  = _('Add new folder.');
  GID ('cWindowLabel_4_Language').innerHTML = _('Display language:');
  GID ('cWindowLabel_4_Interface').innerHTML = _('Interface (cookie-based):');
  GID ('cWindowLabel_4_System').innerHTML = _('System:');
  GID ('cWindowLabel_4_IR1').onclick = js_switchInterface;
  GID ('cWindowLabel_4_IR2').onclick = js_switchInterface;

  js_prepareWindowClose (GID ('cWindowClose'), function () {
      if (cWindow.style.cursor != 'wait') {
	var res = true;
	if (sChanged) res = confirm (_('Close without saving?'));
	if (res) js_closeCWindow ();
      }});

  js_prepareInput (GID ('addURLInput'));
  js_prepareInput (GID ('addFolderInput'));
  var cWindowRefreshRate = GID ('cWindowRefreshRate');
  cWindowRefreshRate.onchange = js_changeRefreshRate;
  js_prepareInput (cWindowRefreshRate);
  GID ('cWindowShowActive').onclick = js_sChanged;
  GID ('cWindowOldestFirst').onclick = js_sChanged;
  GID ('addURLAdd').value = _('add');
  GID ('addURLForm').onsubmit = function () { js_validateFeed (GID ('addURLInput').value); return false; };
  var uploadOPML = GID ('uploadOPML');
  uploadOPML.value = _('Import');
  uploadOPML.onclick = js_uploadOPML;
  GID ('addFolderAdd').value = _('add');
  GID ('addFolderForm').onsubmit = function () { js_validateFolder (); return false; };

  js_prepareLink ('cWindowLabelLink_1', _('Add New Feed'), '', function () { js_openCWindowLabel (1); return false; });
  js_prepareLink ('cWindowLabelLink_2', _('Manage Subscriptions'), '', function () { js_openCWindowLabel (2); return false; });
  js_prepareLink ('cWindowLabelLink_3', _('Manage Folders'), '', function () { js_openCWindowLabel (3); return false; });
  js_prepareLink ('cWindowLabelLink_4', _('User Settings'), '', function () { js_openCWindowLabel (4); return false; });
  js_prepareLink ('addSwitcher', _('Or import an OPML file'), '', js_addSwitcher);
  js_prepareLink ('cWindowLabel_4_ChangePassword', _('Change Password'), '',
		  function () { js_openSysLink ('changepassword', true); });

  GID ('mStories').innerHTML = _('stories');
  GID ('mExpand').innerHTML  = _('expand');
  GID ('mActive').innerHTML  = _('active');
  GID ('minutes').innerHTML  = _('minutes');

  if (msie)
    GID ('cWindowLabels').style.marginTop = '10px';
  if (msie || opera)
    GID ('cWindowContent').style.overflow = 'visible';
}

function js_openCWindow (label) {
  js_hideMenu ();
  document.onkeypress = null;

  if (!cWindow)
    js_initCWindow ();

  var cWidth  = parseInt (js_getStyle (cWindow, 'width'));
  var cHeight = parseInt (js_getStyle (cWindow, 'height'));

  if (cWidth > document.body.clientWidth &&
      document.body.clientWidth > cWindow.minWidth) {
    GID ('cWindowContent').style.width = (document.body.clientWidth - 20) + 'px';
    cWindow.style.width = (document.body.clientWidth - 10) + 'px';
  }
  var wh = js_getWindowHeight ();
  if (cHeight > wh && wh > cWindow.minHeight) {
    cWindow.style.height = (wh - 10) + 'px';
  }

  if (label == 1)
    js_openCWindowLabel (1);
  else if (label == 2)
    js_openCWindowLabel (2);
  else if (label == 3)
    js_openCWindowLabel (3);
  else if (label == 4)
    js_openCWindowLabel (4);

  js_popUp (cWindow);
  js_setupDrag (cWindow);
  js_registerWindow (cWindow);

  js_fixCWindowHeights (label);
  js_fixCMBoxesHeights (label);

  if (label == 1) {
    if (GID ('addURL').style.display != 'none')
      GID ('addURLInput').focus ();
  }
}

function js_closeCWindow () {
  GID ('cWindowTitleBar').onmousedown = null;
  cWindow.style.display = 'none';
  js_initAllKShortcuts ();
  sChanged = false;
}

function js_openCWindowLabel (label) {
  if (msie) js_clearSelection ();
  if (cWindow.style.cursor == 'wait')
    return;
  else if (label != openedLabel) {
    var res = true;
    if (sChanged) res = confirm (_('Switch without saving?'));
    if (!res) return;
  }

  if (openedLabel) {
    var l = GID ('cWindowLabel_' + openedLabel);
    if (l) l.style.display = 'none';
    l = GID ('cWindowLabelLink_' + openedLabel);
    if (l) l.className = 'dLink';
    js_fixCWindowHeights (label);
  }

  if (label == 1) {
    openedLabel = label;
    sChanged = false;
    GID ('cWindowLabel_1').style.display = 'block';
    GID ('cWindowLabelLink_1').className = 'dLinkb';
    GID ('addURLStatusBar').style.display = 'none';
    GID ('uploadStatusBar').style.display = 'none';
    if (cWindow.style.display == 'block') {
      if (GID ('addURL').style.display != 'none')
	GID ('addURLInput').focus ();
    }
    if (GID ('popularFeeds').style.display == 'block')
      js_fixPFeedsHeight ();
  }
  else if (label == 2) {
    openedLabel = label;
    sChanged = false;
    cWindowSaveChanges.disabled = true;
    cWindowSaveChanges.onclick = js_saveChanges2;

    var cWindowLabel_2 = GID ('cWindowLabel_2');
    var controlPanel = GID ('controlPanel')
    cWindowLabel_2.insertBefore (controlPanel, GID ('separator2'));
    controlPanel.style.display = 'block';

    cWindowLabel_2.style.display = 'block';
    GID ('cWindowLabelLink_2').className = 'dLinkb';
    if (cheetahData) {
      GID ('cWindowRefreshRate').value = cheetahData.frequency;
      GID ('cWindowShowActive').checked = cheetahData.safs ? true : false;
      GID ('cWindowOldestFirst').checked = cheetahData.oldf ? true : false;
    }

    var moveBoxes = GID ('moveBoxes');
    moveBoxes.innerHTML = '';

    var selectFolder = document.createElement ('SELECT');
    selectFolder.id = 'cw_folderSelect';
    selectFolder.onchange = js_changeMoveBoxFolder;
    selectFolder.options[0] = new Option (_('Root folder'), '0', false, false);
    var para = document.createElement ('P');
    var mbfs = document.createElement ('SPAN');
    mbfs.id = 'moveBoxFolderSelect';
    mbfs.appendChild (document.createTextNode (_('Select folder') + ': '));
    mbfs.appendChild (selectFolder);
    para.appendChild (mbfs);
    var exports = document.createElement ('SPAN');
    exports.style.marginLeft = '2em';
    var exportSel = document.createElement ('SPAN');
    exportSel.className = 'link';
    exportSel.innerHTML = _('Export selected folder');
    exportSel.title = _('Export feeds from selected folder to OPML');
    exportSel.onmousedown = function () {
      document.location = 'export?fid=' + selectFolder.value;
      return false;
    };
    var exportAll = document.createElement ('SPAN');
    exportAll.className = 'link';
    exportAll.innerHTML = _('Export all feeds');
    exportAll.title = _('Export all feeds to OPML');
    exportAll.onmousedown = function () {
      document.location = 'export';
      return false;
    };
    exports.appendChild (exportSel);
    exports.appendChild (document.createTextNode (String.fromCharCode (160)));
    exports.appendChild (document.createTextNode (String.fromCharCode (160)));
    exports.appendChild (exportAll);
    para.appendChild (mbfs);
    para.appendChild (exports);
    moveBoxes.appendChild (para);

    var moveBox = document.createElement ('DIV');
    moveBox.id = 'moveBox_0'; /* Root folder */
    moveBox.className = 'moveBox';
    if (cheetahData) {
      for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
	var feedid = cheetahData.feedOrder[foi];
	var folder = cheetahData.feeds[feedid][1];
	if (folder == '0') {
	  var mClone = movContainer.cloneNode (true);
	  mClone.id  = 'mFeed_' + feedid;
	  js_traverseDOM (mClone, prepareMovContainer, feedid);
	  mClone.style.display = 'block';
	  moveBox.style.display = 'block';
	  moveBox.appendChild (mClone);
	}
      }
    }
    moveBoxes.appendChild (moveBox);

    if (cheetahData) {
      var i = 1;
      for (var foi = 0; foi < cheetahData.folderOrder.length; foi++) {
	var folderid = cheetahData.folderOrder[foi];
	var fname = cheetahData.folders[folderid]; /* folder name */
	selectFolder.options[i++] = new Option (fname, folderid, false, false);
	var moveBox = document.createElement ('DIV');
	moveBox.id = 'moveBox_' + folderid;
	moveBox.className = 'moveBox';
	for (var foj = 0; foj < cheetahData.feedOrder.length; foj++) {
	  var feedid = cheetahData.feedOrder[foj];
	  var folder = cheetahData.feeds[feedid][1];
	  if (folder == folderid) {
	    var mClone = movContainer.cloneNode (true);
	    mClone.id  = 'mFeed_' + feedid;
	    js_traverseDOM (mClone, prepareMovContainer, feedid);
	    mClone.style.display = 'block';
	    moveBox.appendChild (mClone);
	  }
	}
	moveBox.style.display = 'none';
	moveBoxes.appendChild (moveBox);
      }
    }
    js_fixCMBoxesHeights (label);
  }
  else if (label == 3) {
    openedLabel = label;
    sChanged = false;
    cWindowSaveChanges.disabled = true;
    cWindowSaveChanges.onclick = js_saveChanges3;

    var cWindowLabel_3 = GID ('cWindowLabel_3');
    var controlPanel = GID ('controlPanel')
    cWindowLabel_3.insertBefore (controlPanel, GID ('separator3'));
    controlPanel.style.display = 'block';

    cWindowLabel_3.style.display = 'block';
    GID ('cWindowLabelLink_3').className = 'dLinkb';
    GID ('addFolderStatusBar').style.display = 'none';
    if (cWindow.style.display == 'block')
      GID ('addFolderInput').focus ();
    var fmovContainer = GID ('fmovContainer');
    var fmoveBoxes = GID ('fmoveBoxes');
    fmoveBoxes.innerHTML = '';

    if (cheetahData) {
      for (var foi = 0; foi < cheetahData.folderOrder.length; foi++) {
	var folderid = cheetahData.folderOrder[foi];
	var mClone = fmovContainer.cloneNode (true);
	mClone.id  = 'mFolder_' + folderid;
	js_traverseDOM (mClone, prepareFmovContainer, folderid);
	mClone.style.display = 'block';
	fmoveBoxes.appendChild (mClone);
      }
    }
    js_fixCMBoxesHeights (label);
  }
  else if (label == 4) {
    openedLabel = label;
    sChanged = false;
    cWindowSaveChanges.disabled = true;
    cWindowSaveChanges.onclick = js_saveChanges4;

    var cWindowLabel_4 = GID ('cWindowLabel_4');
    var controlPanel = GID ('controlPanel')
    cWindowLabel_4.insertBefore (controlPanel, GID ('separator4'));
    controlPanel.style.display = 'block';
    cWindowLabel_4.style.display = 'block';
    var changeLangOptions = GID ('changeLangOptions');
    if (cheetahData && cheetahData.lang != '')
      changeLangOptions.value = cheetahData.lang;
    else
      changeLangOptions.selectedIndex = 0;
    changeLangOptions.onchange = js_sChanged;

    var slr = js_readCookie ('cheetahInterface');
    if (slr) {
      if (slr == 'style1') GID ('cWindowLabel_4_IR1').checked = true;
      else if (slr == 'style1sticky') GID ('cWindowLabel_4_IR2').checked = true;
    }
    else
      GID ('cWindowLabel_4_IR1').checked = true;
    if (msie) {
      GID ('cWindowLabel_4_IR1').disabled = true;
      GID ('cWindowLabel_4_IR2').disabled = true;
    }
    GID ('cWindowLabelLink_4').className = 'dLinkb';
    js_fixCWindowHeights (label);
  }
  else
    openedLabel = null;
}

function js_fixCWindowHeights (label) {
  var cWindowHeight = parseInt (js_getStyle (cWindow, 'height'));
  var cWindowTitleBarHeight = parseInt (js_getStyle (GID ('cWindowTitleBar'), 'height'));
  var cWindowLabelsHeight = parseInt (js_getStyle (GID ('cWindowLabels'), 'height'));
  if (isNaN (cWindowTitleBarHeight)) cWindowTitleBarHeight = 0;
  if (isNaN (cWindowLabelsHeight)) cWindowLabelsHeight = 0;
  GID ('cWindowContent').style.height = cWindowHeight - cWindowTitleBarHeight - 15;
  GID ('cWindowLabel_' + label).style.height = cWindowHeight - cWindowTitleBarHeight - cWindowLabelsHeight - 40;
  if (label == 4) {
    var cWindowContent = GID ('cWindowContent');
    if (cWindowContent.scrollHeight > cWindowContent.clientHeight) {
      GID ('cWindowLabel_' + label).style.height = cWindowContent.scrollHeight
	- cWindowTitleBarHeight - cWindowLabelsHeight - 20;
    }
  }
}

function js_fixCMBoxesHeights (label) {
  if (label == 2) {
    var mbMaxHeight = parseInt (js_getStyle (cWindow, 'height'));
    if (!isNaN (mbMaxHeight)) {
      var cfs = GID ('cw_folderSelect');
      var folderid = cfs.options[cfs.selectedIndex].value;
      mbMaxHeight -= GID ('moveBox_' + folderid).offsetTop + 25;
      js_changeCSS ('.moveBox', msie ? 'height' : 'maxHeight', mbMaxHeight + 'px');
    }
  }
  else if (label == 3) {
    var fmoveBoxes = GID ('fmoveBoxes');
    var mbMaxHeight = parseInt (js_getStyle (cWindow, 'height'));
    if (!isNaN (mbMaxHeight)) {
      mbMaxHeight -= fmoveBoxes.offsetTop + 25;
      if (msie)
	fmoveBoxes.style.height = mbMaxHeight + 'px';
      else
	fmoveBoxes.style.maxHeight = mbMaxHeight + 'px';
    }
  }
}

function js_fixPFeedsHeight () {
  var mbMaxHeight = parseInt (js_getStyle (cWindow, 'height'));
  if (!isNaN (mbMaxHeight)) {
    mbMaxHeight -= GID ('popularFeeds').offsetTop + 25;
    js_changeCSS ('#popularFeeds', (msie || opera) ? 'height' : 'maxHeight', mbMaxHeight + 'px');
  }
}

function js_changeCSS (selector, styleProp, value)
{
  if (!document.styleSheets) return;
  var rules = new Array ();
  var lvl = 0;
  if (js_getStyle (sWindow, 'position') == 'fixed')
    lvl = 1;
  if (document.styleSheets[lvl].cssRules)
    rules = document.styleSheets[lvl].cssRules;
  else if (document.styleSheets[lvl].rules)
    rules = document.styleSheets[lvl].rules;
  else
    return;
  for (var i = 0; i < rules.length; i++) {
    if (rules[i].selectorText == selector ||
	rules[i].selectorText == '*|' + selector) {
      eval ('rules[i].style.' + styleProp +"='"+ value + "'");
      break;
    }
  }
}

function js_changeMoveBoxFolder () {
  this.blur ();
  GID ('moveBox_0').style.display = 'none';
  if (cheetahData) {
    for (var foi = 0; foi < cheetahData.folderOrder.length; foi++) {
      var folderid = cheetahData.folderOrder[foi];
      GID ('moveBox_' + folderid).style.display = 'none';
    }
  }
  var folderid = this.options[this.selectedIndex].value;
  GID ('moveBox_' + folderid).style.display = 'block';
}

function js_moveUpICmov () {
  js_moveUp (js_findParentContainer (this, 'movContainer'));
}

function js_moveDownICmov () {
  js_moveDown (js_findParentContainer (this, 'movContainer'));
}

function js_moveUpICfmov () {
  js_moveUp (js_findParentContainer (this, 'fmovContainer'));
}

function js_moveDownICfmov () {
  js_moveDown (js_findParentContainer (this, 'fmovContainer'));
}

function js_remICmovFnc () {
  var mb = GID ('moveBox_' + GID ('cw_folderSelect').value);
  if (mb && con) mb.removeChild (con);
  con = null;
  js_sChanged ();
}

function js_remICmov () {
  con = js_findParentContainer (this, 'movContainer');
  con.style.backgroundColor = 'gray';
  window.setTimeout (js_remICmovFnc, 200);
}

function js_remICfmovFnc () {
  var fmb = GID ('fmoveBoxes');
  if (fmb && con) fmb.removeChild (con);
  con = null;
  js_sChanged ();
}

function js_remICfmov () {
  con = js_findParentContainer (this, 'fmovContainer');
  con.style.backgroundColor = 'gray';
  window.setTimeout (js_remICfmovFnc, 200);
}

function prepareMovContainer (n, feedid) {
  var feed   = cheetahData.feeds[feedid];
  var desc   = feed[0];
  var folder = feed[1];
  var latest = feed[2];
  var expand = feed[3];
  var active = feed[4];
  if (typeof feed[6] != 'undefined')
    latest = feed[6];
  if (n.tagName == 'INPUT') {
    if (n.getAttribute ('name') == 'feedid') {
      n.value = feedid;
    }
    else if (n.getAttribute ('name') == 'desc') {
      n.id = 'desc_' + feedid;
      n.value = js_decodeEntities (desc);
      n.onchange = js_sChanged;
      js_prepareInput (n);
    }
    else if (n.getAttribute ('name') == 'latest') {
      n.id = 'latest_' + feedid;
      if (latest < 1 || latest > 99)
	latest = '1';
      n.value = latest;
      n.onchange = js_sChanged;
      js_prepareInput (n);
    }
    else if (n.getAttribute ('name') == 'expand') {
      n.id = 'expand_' + feedid;
      if (expand < 0 || expand > 99)
	expand = '1';
      n.value = expand;
      n.onchange = js_sChanged;
      js_prepareInput (n);
    }
    else if (n.getAttribute ('name') == 'active') {
      n.id = 'active_' + feedid;
      if (active == 1)
	n.defaultChecked = true;
      n.onclick = js_sChanged;
    }
  }
  else if (n.tagName == 'SPAN')
  {
    var action = n.getAttribute ('action');
    if (action != null) {
      if (action.indexOf ('moveUp') != -1) {
	n.title = _('Move up');
	n.onclick = js_moveUpICmov;
      }
      else if (action.indexOf ('moveDown') != -1) {
	n.title = _('Move down');
	n.onclick = js_moveDownICmov;
      }
      else if (action.indexOf ('moveRight') != -1) {
	n.title = _('Move to other folder');
	n.onclick = js_showFolderListMenu;
      }
      else if (action.indexOf ('rem') != -1) {
	n.title = _('Remove');
	n.onclick = js_remICmov;
      }
    }
  }
}

function prepareFmovContainer (n, folderid) {
  var desc = cheetahData.folders[folderid];
  if (n.tagName == 'INPUT') {
    if (n.getAttribute ('name') == 'folderid') {
      n.value = folderid;
    }
    else if (n.getAttribute ('name') == 'desc') {
      n.id = 'fdesc_' + folderid;
      n.value = js_decodeEntities (desc);
      n.onchange = js_sChanged;
      js_prepareInput (n);
    }
  }
  else if (n.tagName == 'SPAN')
  {
    var action = n.getAttribute ('action');
    if (action != null) {
      if (action.indexOf ('moveUp') != -1) {
	n.title = _('Move up');
	n.onclick = js_moveUpICfmov;
      }
      else if (action.indexOf ('moveDown') != -1) {
	n.title = _('Move down');
	n.onclick = js_moveDownICfmov;
      }
      else if (action.indexOf ('rem') != -1) {
	n.title = _('Remove');
	n.onclick = js_remICfmov;
      }
    }
  }
}

function js_getScrollY () {
  if (js_getStyle (sWindow, 'position') == 'fixed')
    return 0;
  if (document.body && document.body.scrollTop) /* DOM */
    return document.body.scrollTop;
  else if (document.documentElement && document.documentElement.scrollTop) /* IE */
    return document.documentElement.scrollTop;
  return 0;
}

function js_popUp (obj) {
  var innerWidth = 0;
  var innerHeight = 0;
  if (opera || safari)
    obj.style.display = 'block';
  var objWidth  = js_getStyle (obj, 'width');
  var objHeight = js_getStyle (obj, 'height');
  if (objWidth == '0px' || objWidth == '') {
    objWidth = obj.offsetWidth + 'px';
    objHeight = obj.offsetHeight + 'px';
  }
  if (objHeight.indexOf ('px') == -1) {
    obj.style.display = 'block';
    objHeight = obj.clientHeight;
  }
  objWidth = parseInt (objWidth);
  objHeight = parseInt (objHeight);
  if (window.innerWidth) {
    innerWidth  = window.innerWidth / 2;
    innerHeight = window.innerHeight / 2 - 20;
  } else if (document.body.clientWidth) {
    innerWidth  = document.body.clientWidth / 2;
    innerHeight = document.body.clientHeight / 2 - 20;
  }
  var wleft = innerWidth - (objWidth / 2);
  if (wleft < 0) wleft = 0;
  obj.style.left = wleft + 'px';
  obj.style.top  = js_getScrollY () + innerHeight - (objHeight / 2) + 'px';
  if (parseInt (obj.style.top) < 1)
    obj.style.top = '1px';
}

function js_setupDrag (win, cb) {
  var tb = GID (win.id + 'TitleBar');
  tb.style.cursor = 'move';
  tb.onmousedown = function (e) {
    if (!e) var e = window.event;
    if (cb) cb ();
    return js_startDrag (e, this, win);
  };
}

function js_startDrag (e, src, dst) {
  if (!e) var e = window.event;
  if (!src) var src = this;
  if (!dst) var dst = this;
  WindowSystem.focus (dst);
  var d = new Draggable (src, dst);
  d.lastMouseX = e.clientX;
  d.lastMouseY = e.clientY;
  document.onmousemove = function (e) {
    if (!e) var e = window.event;
    d.drag (e);
    return false;
  };
  document.onmouseup = function (e) {
    if (!e) var e = window.event;
    d.endDrag (e);
  };
  return false;
}

function Draggable (src, dst) {
  this.src = src;
  this.dst = dst;
  this.lastMouseX = 0;
  this.lastMouseY = 0;
  this.top = js_getStyle (this.dst, 'top');
  if (this.top.indexOf ('px') == -1)
    this.top = js_findPosY (this.dst) + 'px';
  this.dst.style.top = this.top;
  this.left = js_getStyle (this.dst, 'left');
  if (this.left.indexOf ('px') == -1)
    this.left = js_findPosX (this.dst) + 'px';
  this.dst.style.left = this.left;
}

Draggable.prototype.drag = function (e) {
  var x = e.clientX;
  var y = e.clientY;
  if (x <= 0 || y <= 5) return;
  var q = parseInt (this.dst.style.top);
  var f = parseInt (this.dst.style.left);
  var g = f + x - this.lastMouseX;
  var h = q + y - this.lastMouseY;
  this.dst.style.left = g + 'px';
  this.dst.style.top = h + 'px';
  this.lastMouseX = x;
  this.lastMouseY = y;
};

Draggable.prototype.endDrag = function () {
  document.onmousemove = null;
  document.onmouseup = null;
};

function startResize (e, dst, cont) {
  if (!e) var e = window.event;
  if (!dst) var dst = this;
  var r = new WResize (dst, cont, dst.minWidth ? dst.minWidth : 250,
		       dst.minHeight ? dst.minHeight : 100);
  r.lastMouseX = e.clientX;
  r.lastMouseY = e.clientY;
  document.onmousemove = function (e) {
    if (!e) var e = window.event;
    r.start (e);
    return false;
  };
  document.onmouseup = function (e) {
    if (!e) var e = window.event;
    r.end (e);
    if (r.dst.afterresize)
      r.dst.afterresize ();
  };
  return false;
}

function WResize (dst, con, minWidth, minHeight) {
  this.dst = dst;
  this.con = con;
  this.minWidth = minWidth;
  this.minHeight = minHeight;
  this.lastMouseX = 0;
  this.lastMouseY = 0;
  this.dstWidth = parseInt (js_getStyle (dst, 'width'));
  this.dstHeight = parseInt (js_getStyle (dst, 'height'));
  if (msie) {
    this.conWidth = con.offsetWidth;
    this.conHeight = con.offsetHeight;
  }
  else {
    this.conWidth = parseInt (js_getStyle (con, 'width'));
    this.conHeight = parseInt (js_getStyle (con, 'height'));
  }
}

WResize.prototype.start = function (e) {
  var x = e.clientX;
  var y = e.clientY;
  var w = x - this.lastMouseX;
  var h = y - this.lastMouseY;
  if ((this.dstWidth + w) > this.minWidth) {
    this.dstWidth += w;
    this.conWidth += w;
    this.dst.style.width = this.dstWidth + 'px';
    this.con.style.width = this.conWidth + 'px';
    this.lastMouseX = x;
  }
  if ((this.dstHeight + h) > this.minHeight) {
    this.dstHeight += h;
    this.conHeight += h;
    this.dst.style.height = this.dstHeight + 'px';
    this.con.style.height = this.conHeight + 'px';
    this.lastMouseY = y;
  }
};

WResize.prototype.end = function () {
  document.onmousemove = null;
  document.onmouseup = null;
};

var WindowSystem = new function () {
  this.lastWindow = null;
  this.lastWindowZ = 0;
  this.focusedWindow = null;
  this.focusedWindowZ = 0;
  this.focus = function (win, zero) {
    if (this.focusedWindow == win)
      return;
    if (this.focusedWindow) {
      if (this.lastWindow) {
	var z = max (this.lastWindowZ, this.focusedWindowZ);
	if (z == this.lastWindowZ) z += 1;
	this.focusedWindow.style.zIndex = z;
	this.focusedWindowZ = z;
      }
      else {
	this.focusedWindow.style.zIndex = this.focusedWindowZ;
      }
      this.lastWindow = this.focusedWindow;
      this.lastWindow.firstChild.className = 'WindowTitleBarInactive';
      this.lastWindowZ = this.focusedWindowZ;
    }
    this.focusedWindow = win;
    if (!this.focusedWindow.lastWindow)
      this.focusedWindow.lastWindow = this.lastWindow;
    this.focusedWindow.firstChild.className = 'WindowTitleBar';
    if (zero)
      this.focusedWindowZ = 0;
    else {
      this.focusedWindowZ = parseInt (js_getStyle (win, msie ? 'zIndex' : 'z-index'));
      win.style.zIndex = 7777;
    }
    js_fin (win);
  };

  this.zerofocus = function (win) {
    WindowSystem.focus (win, true);
  };

  this.lwfocus = function () {
    var w = WindowSystem.focusedWindow.lastWindow;
    WindowSystem.focusedWindow.lastWindow = null;
    if (w && w.style.display != 'none') {
      if (w.className == 'bWindow')
	WindowSystem.focus (w, true);
      else
	WindowSystem.focus (w, false);
    }
  };

  function js_fin (win) {
    if (Modules.WebSearch) {
      if (win.id != 'wsWindow' && Modules.WebSearch.isVisible ())
	GID ('phrase').blur ();
    }
    if (win.className == 'bWindow') {
      cursor = 1;
      js_unhighlightSCursor (sWindowCursor);
      var nfc = win.id.split ('_')[1];
      if (fCursor != nfc) {
	fCursor = nfc;
	js_resetBCursor ();
      }
      js_initAllKShortcuts ();
    }
    else if (win.id == 'sWindow') {
      cursor = 0;
      if (bWindowCursor != null && bWindowTopEntries != null)
	js_unhighlightBCursor (bWindowTopEntries[bWindowCursor]);
      js_initAllKShortcuts ();
    }
    else if (win.className == 'tWindow')
      js_initAllKShortcuts ();
    else
      document.onkeypress = null;
    if (win.id == 'wsWindow')
      js_setCaretToEnd (GID ('phrase'));
  }
};

function js_registerWindow (win) {
  win.style.display = 'block';
  WindowSystem.focus (win);
  win.onmousedown = js_wsIfocus;
}

function js_registerBWindow (win) {
  win.onmousedown = js_wsIzerofocus;
}

function js_wsIfocus (e) {
  if (!e) var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation ();
  WindowSystem.focus (this);
  return true;
}

function js_wsIzerofocus (e) {
  if (!e) var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation ();
  WindowSystem.zerofocus (this);
  return true;
}

function js_getWindowHeight () {
  if (typeof window.innerHeight != 'undefined')
    return window.innerHeight;
  else if (document.documentElement && 
	   typeof document.documentElement.clientHeight != 'undefined' &&
	   document.documentElement.clientHeight != 0)
    return document.documentElement.clientHeight;
  else if (document.body && typeof document.body.clientHeight != 'undefined')
    return document.body.clientHeight;
  return 0;
}

function js_getWindowWidth () {
  if (typeof window.innerWidth != 'undefined')
    return window.innerWidth;
  else if (document.documentElement && 
	   typeof document.documentElement.clientWidth != 'undefined' &&
	   document.documentElement.clientWidth != 0)
    return document.documentElement.clientWidth;
  else if (document.body && typeof document.body.clientWidth != 'undefined')
    return document.body.clientWidth;
  return 0;
}

if (!msie && !opera && typeof Element != 'undefined' &&
    Element.prototype && document.createRange) {
  Element.prototype.__defineGetter__('innerText', function () {
				       var range = document.createRange ();
				       range.selectNodeContents (this);
				       return range.toString (); } );
}

function js_help (file) {
  var w = window.open ('help/' + file, file,
		       'width=640,height=600,toolbar=no,status=no,location=no,resizable=yes,scrollbars=yes');
  if (!w) js_popupBlocked ();
}

function js_openSysLink (name, secure) {
  var file = name;
  if (secure) {
    var pathname = document.location.pathname;
    file = 'https://' + document.location.host +
      pathname.substring (0, pathname.lastIndexOf ('/')) +'/'+ name;
  }
  var w = window.open (file, name,
		       'width=640,height=400,toolbar=no,status=no,location=no,resizable=yes,scrollbars=yes');
  if (!w) js_popupBlocked ();
}

function js_setFooter () {
  if (!footer) return;
  var desc = _('Keyboard shortcuts');
  desc += ': <b>j</b> - ' + _('next item');
  desc += ', <b>k</b> - ' + _('previous item');
  desc += ', <b>J</b> - ' + _('next feed');
  desc += ', <b>K</b> - ' + _('previous feed');
  desc += ', <b>enter</b> - ' + _('open selected feed/entry');
  desc += ', <b>x</b> - ' + _('open feeds from folder/more');
  desc += ', <b>e</b> - ' + _('close feed');
  desc += ', <b>h</b> - ' + _('left');
  desc += ', <b>l</b> - ' + _('right');
  desc += ', <b>a</b> - ' + _('hide/show all active');
  desc += ', <b>A</b> - ' + _('show all loaded');
  if (Modules.Notes)
  desc += ', <b>d</b> - ' + _('save link');
  desc += ', <b>s</b> - ' + _('my stuff');
  desc += ', <b>c</b> - ' + _('collapse');
  desc += ', <b>r</b> - ' + _('refresh visible');
  if (Modules.Marker) {
  desc += ', <b>m</b> - ' + _('mark entry as read');
  desc += ', <b>u</b> - ' + _('mark entry as unread'); }
  if (Modules.Filter)
  desc += ', <b>f</b> - ' + _('filter visible');
  footer.innerHTML = desc + '&nbsp;&nbsp;';

  var h = document.createElement ('SPAN');
  h.onmousedown = function () { js_help ('kshortcuts'); return false; };
  h.className = 'link';
  h.innerHTML = '&raquo;';
  footer.appendChild (h);

  footer.style.display = 'block';
  footer.style.marginTop = '10px';
  footer.style.marginLeft = bwLeft + 'em';
}
