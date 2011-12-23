/*
   Cheetah News JS/v2 GUI
   Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010, 2012 Wojciech Polak.

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

var sWindow = null;
var sWindowFeeds = null;
var cWindowSaveChanges = null;
var openedLabel = null;
var movContainer = null;
var folderListMenu = null;
var menu = null;
var menuLink = null;
var menuInvt = null;
var sChanged = false;
var mFeed = null;
var con = null;

var reader = null;
var settings = null;
var main = null;

function initGui () {

  reader = GID ('reader');

  folderListMenu = DCE ('div', {id:'folderListMenu', className:'contextMenu'});
  document.body.appendChild (folderListMenu);

  topRightInfo = GID ('topRightInfo');
  progressBar  = GID ('progressBar');
  movContainer = GID ('movContainer');

  sWindow = createEmptyWindow ('s', null, _('My Stuff'));
  var sWindowOptions = GID ('sWindowOptions');
  sWindowOptions.style.marginTop = '3px';
  sWindowFeeds = document.createElement ('DIV');
  sWindowFeeds.id = 'sWindowFeeds';
  sWindowFeeds.innerHTML = _('Loading...');
  sWindow.appendChild (sWindowOptions);
  sWindow.appendChild (DCE ('div', {id: 'sWindowSocial'}));
  sWindow.appendChild (sWindowFeeds);
  sWindowOptions.style.display = 'block';
  sWindowFeeds.style.display = 'block';

  registerWindow (sWindow);
  prepareWindowClose (GID ('sWindowClose'), closeSWindow);

  main = document.createElement ('DIV');
  main.id = 'main';
  feeds = document.createElement ('DIV');
  feeds.id = 'feeds';
  var footer = document.createElement ('DIV');
  footer.id = 'footer';
  footer.style.display = 'none';

  main.appendChild (feeds);
  main.appendChild (footer);
  var aboutLink = DCE ('span', {className: 'link'}, [_('About')]);
  aboutLink.onmousedown = openAWindow;
  main.appendChild (DCE ('div', {id: 'copyright'},
			 [DCE ('span', {}, ['&copy; 2005-2010 The Cheetah News Team - ']),
			  aboutLink]));
  reader.appendChild (main);

  GID ('welcome').innerHTML = _('Welcome');
  prepareLink ('about', 'Cheetah News', _('About Cheetah News'), openAWindow);
  prepareBLink ('showAllActive', _('show active'), _('Show all active feeds'), showAllActive);
  prepareBLink ('showAllLoaded', _('show loaded'), _('Show all loaded feeds'), showAllLoaded);
  prepareBLink ('hideAll', _('hide all'), _('Hide all feeds'), function () {
      hideAll ();
      WindowSystem.focus (sWindow);
    });
  prepareBLink ('refreshAll', _('refresh visible'), _('Refresh all visible feeds'), refreshVisible);
  if (Modules.Filter) {
    prepareBLink ('filterVisible', _('filter visible'), _('Filter visible feeds'), Modules.Filter.shortcut);
    GID ('filterVisible').onclick = function (e) {
      if (!e) var e = window.event;
      e.cancelBubble = true;
      if (e.stopPropagation) e.stopPropagation ();
      if (msie)
	setTimeout (function () { setCaretToEnd (GID ('filterInput')); }, 250);
      return false;
    };
  }
  GID ('header').style.display = 'block';
  
  var expFolders = GID ('expandFolders');
  expFolders.innerHTML = _('Expand');
  expFolders.title = _('Expand folders');
  expFolders.onmousedown = expandFolders;
  expFolders.onmouseover = styleLink;
  expFolders.onmouseout  = styleILink;
  var cpsFolders = GID ('collapseFolders');
  cpsFolders.innerHTML = _('Collapse');
  cpsFolders.title = _('Collapse folders');
  cpsFolders.onmousedown = collapseFolders;
  cpsFolders.onmouseover = styleLink;
  cpsFolders.onmouseout  = styleILink;

  SIH ({'menuOpenSWindow'  : '&nbsp;' + _('Show My Stuff') + '&nbsp;',
	'menuOpenCWindow1' : '&nbsp;' + _('Add New Feed') + '&nbsp;',
	'menuOpenCWindow2' : '&nbsp;' + _('Manage Subscriptions') + '&nbsp;',
	'menuOpenCWindow3' : '&nbsp;' + _('Manage Folders') + '&nbsp;',
	'menuOpenCWindow4' : '&nbsp;' + _('User Settings') + '&nbsp;',
	'menuOpenFacebook': '&nbsp;' + _('Facebook News Feed') + '&nbsp;',
	'menuOpenFanbox': '&nbsp;' + _('Facebook Fanbox') + '&nbsp;',
	'logout' : '&nbsp;' + _('Logout') + '&nbsp;'}, true);

  initMenu ();
  resizeChrome ();
  window.onresize = resizeChrome;

  setFooter ();
  if (linux)
    $('.cWindowLabel').css ('margin-top', '5px');
  $('#addURLForm,#addFolderForm,#weLocationForm,#nbForm').attr ('autocomplete', 'off');

  var whatsnew = GID ('whatsnew');
  if (CONF.whatsnew && whatsnew) {
    whatsnew.className = 'link';
    whatsnew.onmousedown = function () {
      openFeedPreview ('http://blog.cheetah-news.com/feed', 'Cheetah News Blog');
      return false;
    };
  }

  $(reader).delegate ('div.play-video', 'click', play_video);
  try { window.focus (); } catch (E) {}
}

function createEmptyWindow (id, classTitle, title) {
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
    + '"><img class="img-12-remove" src="images/t.gif" width="12" height="12" />'
    + '</span></td></tr></table>';
  win.appendChild (wtb);
  reader.appendChild (win);
  return win;
}

function createBWindow (id, desc) {
  var win = document.createElement ('DIV');
  win.id = 'bWindow_' + id;
  win.className = 'bWindow';
  win.style.display = 'none';
  var wtb = document.createElement ('DIV');
  wtb.className = 'WindowTitleBarInactive';
  wtb.innerHTML = '<table width="100%"><tr><td align="left" style="cursor:default"><span id="bWindowTitle_' + id
    + '">' + desc + '</span>&nbsp;&nbsp;<span id="bWindowReload_' + id
    + '" class="link" title="' + _('Reload this feed') +'">'
    + '<img class="img-12-reload" src="images/t.gif" width="12" height="12" /></span><span id="bWindowFiltered_' + id
    + '" class="feedFiltered"></span></td><td align="right"><span id="bWindowClose_' + id
    + '" class="link" title="' + _('Close Window') + '">'
    + '<img class="img-12-remove" src="images/t.gif" width="12" height="12" /></span></td></tr></table>';
  wtb.ondblclick = function () {
    clearSelection ();
    scrollToElement (win);
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
  traverseDOM (win, prepareFeed, id);
  registerBWindow (win);
  feeds.appendChild (win);
}

function prepareWindowClose (obj, cb) {
  if (obj) {
    obj.onmousedown = function (e) {
      if (!e) var e = window.event;
      e.cancelBubble = true;
      if (e.stopPropagation) e.stopPropagation ();
      return false;
    };
    obj.onclick = function () {
      cb (this);
    };
  }
}

function prepareLink (id, text, title, fnc) {
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

function prepareBLink (id, text, title, fnc) {
  prepareLink (id, text, title, fnc);
  var link = GID (id);
  if (link) {
    link.onmouseover = styleLButtonB;
    link.onmouseout  = styleLButton;
  }
}

function styleLink () { this.className = 'link'; }
function styleILink () { this.className = 'ilink'; }
function styleIFocus () { this.className = 'ifocus'; document.onkeypress = null; }
function styleLinkCM () { this.className = 'linkCM'; }
function styleLinkCMH () { this.className = 'linkCMH'; }
function styleLButton () { this.className = 'lbutton'; }
function styleLButtonB () { this.className = 'lbuttonb'; }
function styleIEmpty () { this.className = ''; document.onkeypress = kShortcutsHandler; }
function styleEmpty () { this.className = ''; }

function prepareInput (obj) {
  obj.onfocus = styleIFocus;
  obj.onblur  = styleIEmpty;
}

function prepareInputWithDefault (obj, dv) {
  obj.value = obj._defaultvalue = dv;
  obj.style.color = '#999999';
  obj.onfocus = function () {
    if (this.value == this._defaultvalue) {
      this.style.color = '#000000';
      this.value = '';
    }
    styleIFocus.call (this);
  }
  obj.onblur = function () {
    if (this.value == '') {
      this.style.color = '#999999';
      this.value = this._defaultvalue;
    }
    styleIEmpty.call (this);
  }
}

function initFolderListMenu (curFolder) {
  folderListMenu.innerHTML = '';
  if (curFolder != 0) {
    var fo = DCE ('span', {id:'fo_0', className:'linkCM'},
		  ['&nbsp;&raquo;&nbsp;' + _('Root folder') + '&nbsp;']);
    setCmhLink (fo, function () { moveFeed (mFeed, this.id.split('_')[1]); } );
    folderListMenu.appendChild (fo);
  }
  if (cheetahData) {
    for (var foi = 0; foi < cheetahData.folderOrder.length; foi++) {
      var folderid = cheetahData.folderOrder[foi];
      var name = cheetahData.folders[folderid]; /* folder name */
      if (folderid != curFolder) {
	var fo = DCE ('span', {id:'fo_' + folderid, className:'linkCM'},
		      ['&nbsp;&raquo;&nbsp;' + name + '&nbsp;']);
	setCmhLink (fo, function () { moveFeed (mFeed, this.id.split('_')[1]); } );
	folderListMenu.appendChild (fo);
      }
    }
  }
}

function showFolderListMenu (e) {
  var link = this;
  if (!folderListMenu) return false;
  mFeed = findParentContainer (link, 'movContainer');
  var cw_folderSelect = GID ('cw_folderSelect');
  var curFolder = cw_folderSelect.options[cw_folderSelect.selectedIndex].value;
  initFolderListMenu (curFolder);
  if (!e) var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation ();
  var x = findPosX (link);
  folderListMenu.style.left = (x + 14) + 'px';
  var y = findPosY (link);
  y -= GID ('moveBox_' + curFolder).scrollTop;
  folderListMenu.style.top = y + 'px';
  folderListMenu.style.display = 'inline';

  var yBottom = y + parseInt (folderListMenu.clientHeight);
  var yDiff = yBottom - getWindowHeight () - getScrollY ();
  if (yDiff > 0)
    folderListMenu.style.top = (y - yDiff - 5) + 'px';

  $(document).bind ('click', hideFolderListMenu);
}

function hideFolderListMenu () {
  $(document).unbind ('click', hideFolderListMenu);
  folderListMenu.style.display = 'none';
  mFeed = null;
}

function moveFeed (src, dst) {
  var moveBox = GID ('moveBox_' + dst);
  moveBox.appendChild (src);
  fnc_sChanged ();
}

function initMenu () {
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
    menuLink.onclick = showMenu;
    menuLink.oncontextmenu = showMenu;
  }

  setCmhLink (GID ('logout'), function () {
      if (cheetahData.fbUID && typeof FB != 'undefined' &&
	  readCookie ('cheetahFBL')) {
	if (confirm (_('Log out also from Facebook?'))) {
	  FB.getLoginStatus (function (res) {
	      if (res.authResponse)
		FB.logout (function (r) {
		    writeCookie ('cheetahFBL', '', -1);
		    window.location = 'logout';
		  });
	      else
		window.location = 'logout';
	    });
	  return;
	}
      }
      window.location = 'logout';
    });
  setCmhLink (GID ('menuOpenFanbox'),   function () { this.className = 'linkCM'; openFanbox (); });
  setCmhLink (GID ('menuOpenCWindow1'), function () { this.className = 'linkCM'; openCWindow (1); });
  setCmhLink (GID ('menuOpenCWindow2'), function () { this.className = 'linkCM'; openCWindow (2); });
  setCmhLink (GID ('menuOpenCWindow3'), function () { this.className = 'linkCM'; openCWindow (3); });
  setCmhLink (GID ('menuOpenCWindow4'), function () { this.className = 'linkCM'; openCWindow (4); });
  menu.style.width = (menuLength * 0.55 + 1) + 'em';
}

function max (a, b) {
  return a > b ? a : b;
}

var menuLength = 24;
function setCmhLink (el, fnc) {
  if (!el) return;
  el.onclick = fnc;
  el.onmouseover = styleLinkCMH;
  el.onmouseout  = styleLinkCM;
  if (el.innerText)
    menuLength = max (el.innerText.length, menuLength);
}

function showMenu (e) {
  clearSelection ();
  if (!menuLink || !menu) return false;
  if (!e) var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation ();
  menuLink.onclick = null;
  var x = findPosX (menuLink);
  menu.style.left = x + 'px';
  menu.style.top  = (findPosY (menuLink) + 17) + 'px';
  menu.style.display = 'inline';
  $(document).bind ('click', hideMenu);
  return false;
}

function hideMenu () {
  $(document).unbind ('click', hideMenu);
  menu.style.display = 'none';
  menuLink.onclick = showMenu;
}

function findPosX (obj) {
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

function findPosY (obj) {
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

function getStyle (x, styleProp) {
  if (document.defaultView && document.defaultView.getComputedStyle)
    return document.defaultView.getComputedStyle (x, null).getPropertyValue (styleProp);
  else if (x.currentStyle)
    return x.currentStyle[styleProp];
  return null;
}

function setCaretToEnd (input) {
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

function updateCStatusBar (color, msg, el) {
  var statusBar = el ? GID (el) : GID ('addURLStatusBar');
  if (statusBar) {
    statusBar.style.backgroundColor = color;
    statusBar.innerHTML = '&nbsp;' + msg + '&nbsp;';
    $(statusBar).fadeIn ();
  }
}

function validateFeed (url) {
  if (!checkOnline ()) return;
  if (sendIntv) return;
  GID ('addURLStatusBar').style.display = 'none';
  if (url == '' || url == _('feed URL or search term')) {
    updateCStatusBar ('red', _('Invalid URL'));
  }
  else if (/^(https?:\/\/|feed:\/\/)?([a-zA-Z0-9_]+:[a-zA-Z0-9\-_]+@)?[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+.*$/.test (url)) {
    GID ('addURLAdd').disabled = true;
    openFeedPreview (url);
    GID ('addURLAdd').disabled = false;
  }
  else {
    Modules.OPML.findFeeds (url);
  }
}

function subscribePreviewFeed () {
  GID ('bWindow_0_subscribe').disabled = true;
  var snd = 'add=' + encodeURIComponent (previewUrl);
  updateCStatusBar ('green', _('Validating URL...'), 'bWindow_0_substatus');
  var xhs = mdb (snd, addNewFeed, subscribePreviewFeedRecover);
  sendIntv = setTimeout (function () {
      if (xhs && xhs.readyState != 0) xhs.abort ();
      updateCStatusBar ('red', _('Timeout Error!'), 'bWindow_0_substatus');
      GID ('bWindow_0_subscribe').disabled = false;
      sendIntv = null; }, 30000);
}

function addNewFeed (xml) {
  var sts = xmlStatus (xml);
  if (sts) {
    updateCStatusBar ('red', sts, 'bWindow_0_substatus');
    GID ('bWindow_0_subscribe').disabled = false;
  }
  else {
    var feedid = null;
    var desc   = null;
    updateCStatusBar ('green', _('OK'), 'bWindow_0_substatus');
    $('#bWindow_0_unsubscribed').fadeOut ('slow');

    var node = lookupNode (xml, 'feedid');
    if (node)
      feedid = node.firstChild.nodeValue;
    node = lookupNode (xml, 'description');
    if (node)
      desc = node.firstChild.nodeValue;
    if (feedid && desc) {
      appendSWindow (feedid, desc, '0');
      createBWindow (feedid, desc);
      fetchUserData (reinitData);
    }
  }
}

function subscribePreviewFeedRecover (status, statusText) {
  stderr ('addNewFeed Error: ' + status +': '+ statusText);
  GID ('bWindow_0_subscribe').disabled = false;
}

function addFeedUrl (url) {
  if (url == '') {
    updateCStatusBar ('red', _('Invalid URL'));
    resetTitle ();
  }
}

function addSwitcher () {
  var addURL = GID ('addURL');
  var addOPML = GID ('addOPML');
  if (addURL.style.display != 'none') {
    GID ('uploadStatusBar').style.display = 'none';
    addURL.style.display = 'none';
    addOPML.style.display = 'block';
    GID ('addSwitcher').innerHTML = _('Add feed by URL');
  }
  else {
    GID ('addURLStatusBar').style.display = 'none';
    addOPML.style.display = 'none';
    addURL.style.display = 'block';
    GID ('addSwitcher').innerHTML = _('Import an OPML file');
    GID ('addURLInput').focus ();
  }
}

function uploadOPML () {
  if (!checkOnline ()) return false;
  updateCStatusBar ('green', _('Importing file...'), 'uploadStatusBar');
  var uploadResult = GID ('uploadResult');
  if (msie) {
    uploadResult.attachEvent ('onload', getUploadResult);
  }
  else
    uploadResult.onload = getUploadResult;
  return true;
}

function getUploadResult () {
  var xml = null;
  var uploadResult = GID ('uploadResult');
  if (uploadResult.contentDocument)
    xml = uploadResult.contentDocument;
  else if (uploadResult.contentWindow && uploadResult.contentWindow.document)
    xml = uploadResult.contentWindow.document;
  if (msie)
    xml = xml.XMLDocument;
  var sts = xmlStatus (xml);
  if (sts) {
    updateCStatusBar ('red', sts, 'uploadStatusBar');
  }
  else {
    updateCStatusBar ('green', _('OK'), 'uploadStatusBar');
    setTimeout (function () { $('#uploadStatusBar').fadeOut (); }, 3000);
    sWindowFeeds.innerHTML = _('Loading...');
    feeds.innerHTML = '';
    run ();
  }
  if (msie) {
    uploadResult.detachEvent ('onload', getUploadResult);
  }
  else
    uploadResult.onload = null;
}

function validateFolder () {
  if (!checkOnline ()) return;
  var folder = GID ('addFolderInput').value;
  if (folder == '') {
    updateCStatusBar ('red', _('Invalid folder name'), 'addFolderStatusBar');
  }
  else {
    GID ('addFolderAdd').disabled = true;
    settings.style.cursor = 'wait';
    var snd = 'add=1&folder=' + encodeURIComponent (folder);
    updateCStatusBar ('green', _('Adding folder...'), 'addFolderStatusBar');
    mdb (snd, addNewFolder, validateFolderRecover);
  }
}

function addNewFolder (xml) {
  var sts = xmlStatus (xml);
  if (sts) {
    updateCStatusBar ('red', sts, 'addFolderStatusBar');
  }
  else {
    var folderid = null;
    var fname    = null;
    updateCStatusBar ('green', _('OK'), 'addFolderStatusBar');
    setTimeout (function () { $('#addFolderStatusBar').fadeOut (); }, 3000);
    var node = lookupNode (xml, 'folderid');
    if (node)
      folderid = node.firstChild.nodeValue;
    node = lookupNode (xml, 'name');
    if (node)
      fname = node.firstChild.nodeValue;
    if (folderid && fname) {
      appendFolder (folderid, fname, true);
      fetchUserData (function (data) { reinitData (data); openCWindowLabel (3); });
      var input = GID ('addFolderInput');
      input.value = '';
      input.focus ();
    }
  }
  settings.style.cursor = 'auto';
  GID ('addFolderAdd').disabled = false;
}

function validateFolderRecover (status, statusText) {
  stderr ('addFolderFeed Error: ' + status +': '+ statusText);
  settings.style.cursor = 'auto';
  GID ('addFolderAdd').disabled = false;
}

function fnc_sChanged () {
  sChanged = true;
  cWindowSaveChanges.disabled = false;
}

function changeRefreshRate () {
  var val = parseInt (this.value);
  if (isNaN (val)) val = 0;
  if (val < 0 || val > 9999) this.value = '0';
  else if (val > 0 && val < 15) this.value = '15';
  else this.value = val;
  fnc_sChanged ();
}

function saveChanges2 () {
  if (!checkOnline ()) return;
  cWindowSaveChanges.disabled = true;
  settings.style.cursor = 'wait';
  var activeCounter = 0;
  var feeds_order = '';
  var moveBox = GID ('moveBox_0');
  for (var j = 0; j < moveBox.childNodes.length; j++) {
    var feedid = moveBox.childNodes[j].id.split ('_')[1]; /* [1] feedid */
    var desc   = encodeSD (GID ('desc_' + feedid).value);
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
	var desc   = encodeSD (GID ('desc_' + feedid).value);
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
  if (activeCounter > 15) {
    proceed = confirm
      (sprintf (ngettext ('You have checked more than %d active feed.\nThis might slow down the startup process.\nWould you like to proceed?',
			  'You have checked more than %d active feeds.\nThis might slow down the startup process.\nWould you like to proceed?',
			  15), 15));
  }

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
    var xhs = mdb (snd, checkSave2, saveChangesRecover);
    sendIntv = setTimeout (function () {
			     if (xhs && xhs.readyState != 0) xhs.abort ();
			     settings.style.cursor = 'auto';
			     alert (_('Timeout Error!'));
			     cWindowSaveChanges.disabled = false;
			     sendIntv = null; }, 15000);
  }
  else {
    cWindowSaveChanges.disabled = false;
    settings.style.cursor = 'auto';
  }
}

function checkSave2 (xml) {
  settings.style.cursor = 'auto';
  var sts = xmlStatus (xml);
  if (sts) {
    error (sts);
    cWindowSaveChanges.disabled = false;
  }
  else {
    sWindowFeeds.innerHTML = _('Loading...');
    fetchUserData (reinitData);
    updateCStatusBar ('green', _('OK'), 'controlPanelStatusBar');
    setTimeout (function () { $('#controlPanelStatusBar').fadeOut (); }, 3000);
    cWindowSaveChanges.disabled = true;
    sChanged = false;
  }
}

function saveChangesRecover (status, statusText) {
  stderr ('saveChanges Error: ' + status +': '+ statusText);
  settings.style.cursor = 'auto';
  cWindowSaveChanges.disabled = false;
}

function saveChanges3 () {
  if (!checkOnline ()) return;
  cWindowSaveChanges.disabled = true;
  settings.style.cursor = 'wait';
  var folders_order = '';
  if (cheetahData) {
    var fmoveBoxes = GID ('fmoveBoxes');
    for (var i = 0; i < fmoveBoxes.childNodes.length; i++) {
      var folderid = fmoveBoxes.childNodes[i].id.split ('_')[1]; /* [1] folderid */
      var desc = encodeSD (GID ('fdesc_' + folderid).value);
      if (!desc) desc = 'Nameless';
      folders_order += folderid +','+ desc + ':';
    }
  }
  folders_order = folders_order.substr (0, folders_order.length - 1);
  if (folders_order == '') folders_order = 'flushAll';
  var snd = 'save=1&lucid=' + (cheetahData ? cheetahData.lucid : '');
  snd += '&folders=' + encodeURIComponent (folders_order);
  var xhs = mdb (snd, checkSave3, saveChangesRecover);
  sendIntv = setTimeout (function () {
			   if (xhs && xhs.readyState != 0) xhs.abort ();
			   settings.style.cursor = 'auto';
			   alert (_('Timeout Error!'));
			   cWindowSaveChanges.disabled = false;
			   sendIntv = null; }, 15000);
}

function checkSave3 (xml) {
  settings.style.cursor = 'auto';
  var sts = xmlStatus (xml);
  if (sts) {
    error (sts);
    cWindowSaveChanges.disabled = false;
  }
  else {
    sWindowFeeds.innerHTML = _('Loading...');
    fetchUserData (reinitData);
    updateCStatusBar ('green', _('OK'), 'controlPanelStatusBar');
    setTimeout (function () { $('#controlPanelStatusBar').fadeOut (); }, 3000);
    sChanged = false;
  }
}

function saveChanges4 () {
  if (!checkOnline ()) return;
  cWindowSaveChanges.disabled = true;
  if (sChanged) {
    settings.style.cursor = 'wait';
    var changeLangOptions = GID ('changeLangOptions');
    var snd = 'save=1&lang=' + changeLangOptions.options[changeLangOptions.selectedIndex].value;
    var xhs = mdb (snd, checkSave4, saveChangesRecover);
    sendIntv = setTimeout (function () {
			     if (xhs && xhs.readyState != 0) xhs.abort ();
			     settings.style.cursor = 'auto';
			     alert (_('Timeout Error!'));
			     cWindowSaveChanges.disabled = false;
			     sendIntv = null; }, 15000);
  }
}

function checkSave4 (xml) {
  settings.style.cursor = 'auto';
  var sts = xmlStatus (xml);
  if (sts) {
    error (sts);
    cWindowSaveChanges.disabled = false;
  }
  else
    window.location.reload ();
}

function openSWindow () {
  hideMenu ();
  registerWindow (sWindow);
  resizeSWindow ();
  var menuOpenSWindow = GID ('menuOpenSWindow');
  menuOpenSWindow.onclick = null;
  menuOpenSWindow.className = 'ilinkCM';
  menuOpenSWindow.onmouseover = null;
  menuOpenSWindow.onmouseout = null;
}

function closeSWindow () {
  sWindow.style.display = 'none';
  var menuOpenSWindow = GID ('menuOpenSWindow');
  menuOpenSWindow.className = 'linkCM';
  setCmhLink (menuOpenSWindow, function () { this.className = 'linkCM'; openSWindow (); });
}

function resizeChrome () {
  resizeFeeds ();
  resizeSWindow ();
}

function resizeFeeds () {
  if (main.style.display != 'none' && !iphone) {
    var ys = findPosY (main);
    var wh = getWindowHeight ();
    if (wh > 0) {
      var dh = wh - ys - 15;
      if (dh > 0) main.style.height = dh + 'px';
    }
  }
}

function resizeSWindow () {
  if (sWindow.style.display != 'none') {
    var ys = findPosY (sWindow);
    var h = findPosY (sWindowFeeds) - ys;
    var wh = getWindowHeight ();
    if (wh > 0) {
      var dh = wh - ys - 15;
      if (dh > 0) sWindow.style.height = dh + 'px';
      sWindowFeeds.style.height = (sWindow.clientHeight - h - 10) + 'px';
    }
  }
}

function openAWindow () {
  Greybox.open ({type: 'inline', content: 'aboutContentWrap',
	width:'44em', height:'26em', title: _('About Cheetah News')});
  return false;
}

function openFanbox () {
  hideMenu ();
  Greybox.open ({type: 'inline', content: 'fbFanbox',
	width:500, height:300, title: 'Facebook Fanbox'});
  return false;
}

function initCWindow () {
  settings = GID ('settings');
  if (!msie && !iphone)
    Nifty ('div#settings');

  GID ('cWindowTitle').innerHTML = _('Settings');

  var cWindowClose1 = GID ('cWindowClose1');
  cWindowClose1.innerHTML = _('&laquo; return to reader');
  prepareWindowClose (cWindowClose1, checkWindowClose);
  var cWindowClose2 = GID ('cWindowClose2');
  cWindowClose2.title = _('Close');
  prepareWindowClose (cWindowClose2, checkWindowClose);

  cWindowSaveChanges = GID ('cWindowSaveChanges');
  cWindowSaveChanges.value = _('Save changes');
  var cWindowCloseSettings = GID ('cWindowCloseSettings');
  cWindowCloseSettings.value = _('Cancel');
  cWindowCloseSettings.onclick = function () {
    if (settings.style.cursor != 'wait') {
      closeCWindow ();
    }
  }

  GID ('cWindowLabel_1DescURL').innerHTML = _('Open a specific feed by entering the URL below (Autodiscovery supported) or enter a search term.');
  GID ('cWindowLabel_1DescOPML').innerHTML = _('Import your subscriptions from an OPML file.');
  GID ('cWindowLabel_2Desc').innerHTML  = _('Refresh rate (active feeds)') + ':';
  GID ('cWindowLabel_2Desc2').innerHTML = _('Show active feeds on startup') + ':';
  GID ('cWindowLabel_2Desc3').innerHTML = _('Oldest entries first') + ':';
  GID ('cWindowLabel_3Desc').innerHTML  = _('Add new folder.');
  GID ('cWindowLabel_4_Language').innerHTML = _('Display language:');
  GID ('cWindowLabel_4_System').innerHTML = _('System:');
  GID ('cWindowLabel_4_Goodies').innerHTML = _('Goodies:');

  prepareInputWithDefault (GID ('addURLInput'), _('feed URL or search term'));
  prepareInput (GID ('addFolderInput'));
  var cWindowRefreshRate = GID ('cWindowRefreshRate');
  cWindowRefreshRate.onchange = changeRefreshRate;
  prepareInput (cWindowRefreshRate);
  GID ('cWindowShowActive').onclick = fnc_sChanged;
  GID ('cWindowOldestFirst').onclick = fnc_sChanged;
  GID ('addURLAdd').value = _('open');
  GID ('addURLForm').onsubmit = function () { validateFeed (GID ('addURLInput').value); return false; };
  var uploadOPMLb = GID ('uploadOPML');
  uploadOPMLb.value = _('Import');
  uploadOPMLb.onclick = uploadOPML;
  GID ('addFolderAdd').value = _('add');
  GID ('addFolderForm').onsubmit = function () { validateFolder (); return false; };

  prepareLink ('cWindowLabelLink_1', _('Add New Feed'), '', function () { openCWindowLabel (1); return false; });
  prepareLink ('cWindowLabelLink_2', _('Manage Subscriptions'), '', function () { openCWindowLabel (2); return false; });
  prepareLink ('cWindowLabelLink_3', _('Manage Folders'), '', function () { openCWindowLabel (3); return false; });
  prepareLink ('cWindowLabelLink_4', _('User Settings'), '', function () { openCWindowLabel (4); return false; });
  prepareLink ('addSwitcher', _('Import an OPML file'), '', addSwitcher);
  prepareLink ('cWindowLabel_4_AddHandler', _('Register Cheetah News as feed handler in your browser'),
	       '', registerCheetahHandler);
  prepareLink ('cWindowLabel_4_LinkedAccounts', _('Linked Accounts'), '',
	       function () { openSysLink ('linked-accounts', false); });
  prepareLink ('cWindowLabel_4_ChangePassword', _('Change Password'), '',
	       function () { openSysLink ('changepassword', true); });

  GID ('mStories').innerHTML = _('stories');
  GID ('mExpand').innerHTML  = _('expand');
  GID ('mActive').innerHTML  = _('active');
  GID ('minutes').innerHTML  = _('minutes');

  if (msie)
    GID ('cWindowLabels').style.marginTop = '10px';
}

function checkWindowClose () {
  if (settings.style.cursor != 'wait') {
    var res = true;
    if (sChanged) res = confirm (_('Close without saving?'));
    if (res) closeCWindow ();
  }
}

function openCWindow (label) {
  hideMenu ();

  if (Modules.Weather)
    Modules.Weather.fastclose ();
  if (Modules.Notes)
    Modules.Notes.fastclose ();

  if (!settings)
    initCWindow ();

  if (label > 0 && label < 5)
    openCWindowLabel (label);

  main.style.height = 'auto';
  setTimeout (function () {
      $(settings).slideDown ('normal');
    }, 50);
}

function closeCWindow () {
  $(settings).slideUp ('normal', function () {
      resizeChrome ();
      $('#popularFeeds').hide ();
    });
  document.onkeypress = kShortcutsHandler;
  sChanged = false;
}

function fastcloseCWindow () {
  if (settings) {
    $(settings).hide ();
    sChanged = false;
  }
}

function openCWindowLabel (label) {
  if (msie) clearSelection ();
  if (settings.style.cursor == 'wait')
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
  }

  GID ('controlPanelStatusBar').style.display = 'none';
  if (label == 1) {
    openedLabel = label;
    sChanged = false;
    GID ('cWindowLabel_1').style.display = 'block';
    GID ('cWindowLabelLink_1').className = 'dLinkb';
    GID ('addURLStatusBar').style.display = 'none';
    GID ('uploadStatusBar').style.display = 'none';
    if (settings.style.display == 'block') {
      if (GID ('addURL').style.display != 'none')
	GID ('addURLInput').focus ();
    }
  }
  else if (label == 2) {
    openedLabel = label;
    sChanged = false;
    cWindowSaveChanges.disabled = true;
    cWindowSaveChanges.onclick = saveChanges2;

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
    selectFolder.onchange = changeMoveBoxFolder;
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
      window.location = 'export?fid=' + selectFolder.value;
      return false;
    };
    var exportAll = document.createElement ('SPAN');
    exportAll.className = 'link';
    exportAll.innerHTML = _('Export all feeds');
    exportAll.title = _('Export all feeds to OPML');
    exportAll.onmousedown = function () {
      window.location = 'export';
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
	  traverseDOM (mClone, prepareMovContainer, feedid);
	  mClone.style.display = 'block';
	  moveBox.style.display = 'block';
	  moveBox.appendChild (mClone);
	}
      }
    }
    moveBoxes.appendChild (moveBox);
    $(moveBox).sortable ({items: '.movContainer', distance:4,
	  axis:'y', containment:'parent', update: fnc_sChanged});

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
	    traverseDOM (mClone, prepareMovContainer, feedid);
	    mClone.style.display = 'block';
	    moveBox.appendChild (mClone);
	  }
	}
	moveBox.style.display = 'none';
	moveBoxes.appendChild (moveBox);
	$(moveBox).sortable ({items: '.movContainer', distance:4,
	      axis:'y', containment:'parent', update: fnc_sChanged});
      }
    }
  }
  else if (label == 3) {
    openedLabel = label;
    sChanged = false;
    cWindowSaveChanges.disabled = true;
    cWindowSaveChanges.onclick = saveChanges3;

    var cWindowLabel_3 = GID ('cWindowLabel_3');
    var controlPanel = GID ('controlPanel')
    cWindowLabel_3.insertBefore (controlPanel, GID ('separator3'));
    controlPanel.style.display = 'block';

    cWindowLabel_3.style.display = 'block';
    GID ('cWindowLabelLink_3').className = 'dLinkb';
    GID ('addFolderStatusBar').style.display = 'none';
    if (settings.style.display == 'block')
      GID ('addFolderInput').focus ();
    var fmovContainer = GID ('fmovContainer');
    var fmoveBoxes = GID ('fmoveBoxes');
    fmoveBoxes.innerHTML = '';

    if (cheetahData) {
      for (var foi = 0; foi < cheetahData.folderOrder.length; foi++) {
	var folderid = cheetahData.folderOrder[foi];
	var mClone = fmovContainer.cloneNode (true);
	mClone.id  = 'mFolder_' + folderid;
	traverseDOM (mClone, prepareFmovContainer, folderid);
	mClone.style.display = 'block';
	fmoveBoxes.appendChild (mClone);
      }
      $(fmoveBoxes).sortable ({items: '.fmovContainer', distance:4,
	    axis:'y', containment:'parent', update: fnc_sChanged});
    }
  }
  else if (label == 4) {
    openedLabel = label;
    sChanged = false;
    cWindowSaveChanges.disabled = true;
    cWindowSaveChanges.onclick = saveChanges4;

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
    changeLangOptions.onchange = fnc_sChanged;
    GID ('cWindowLabelLink_4').className = 'dLinkb';
  }
  else
    openedLabel = null;
}

function changeMoveBoxFolder () {
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

function moveUpICmov () {
  moveUp (findParentContainer (this, 'movContainer'));
}

function moveDownICmov () {
  moveDown (findParentContainer (this, 'movContainer'));
}

function moveUpICfmov () {
  moveUp (findParentContainer (this, 'fmovContainer'));
}

function moveDownICfmov () {
  moveDown (findParentContainer (this, 'fmovContainer'));
}

function remICmovFnc () {
  var mb = GID ('moveBox_' + GID ('cw_folderSelect').value);
  if (mb && con) mb.removeChild (con);
  con = null;
  fnc_sChanged ();
}

function remICmov () {
  con = findParentContainer (this, 'movContainer');
  con.style.backgroundColor = 'gray';
  window.setTimeout (remICmovFnc, 200);
}

function remICfmovFnc () {
  var fmb = GID ('fmoveBoxes');
  if (fmb && con) fmb.removeChild (con);
  con = null;
  fnc_sChanged ();
}

function remICfmov () {
  con = findParentContainer (this, 'fmovContainer');
  con.style.backgroundColor = 'gray';
  window.setTimeout (remICfmovFnc, 200);
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
      n.value = decodeEntities (desc);
      n.onchange = fnc_sChanged;
      prepareInput (n);
    }
    else if (n.getAttribute ('name') == 'latest') {
      n.id = 'latest_' + feedid;
      if (latest < 1 || latest > 99)
	latest = '1';
      n.value = latest;
      n.onchange = fnc_sChanged;
      prepareInput (n);
    }
    else if (n.getAttribute ('name') == 'expand') {
      n.id = 'expand_' + feedid;
      if (expand < 0 || expand > 99)
	expand = '1';
      n.value = expand;
      n.onchange = fnc_sChanged;
      prepareInput (n);
    }
    else if (n.getAttribute ('name') == 'active') {
      n.id = 'active_' + feedid;
      if (active == 1)
	n.defaultChecked = true;
      n.onclick = fnc_sChanged;
    }
  }
  else if (n.tagName == 'SPAN')
  {
    var action = n.getAttribute ('action');
    if (action != null) {
      if (action.indexOf ('moveUp') != -1) {
	n.title = _('Move up');
	n.onclick = moveUpICmov;
      }
      else if (action.indexOf ('moveDown') != -1) {
	n.title = _('Move down');
	n.onclick = moveDownICmov;
      }
      else if (action.indexOf ('moveRight') != -1) {
	n.title = _('Move to other folder');
	n.onclick = showFolderListMenu;
      }
      else if (action.indexOf ('rem') != -1) {
	n.title = _('Remove');
	n.onclick = remICmov;
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
      n.value = decodeEntities (desc);
      n.onchange = fnc_sChanged;
      prepareInput (n);
    }
  }
  else if (n.tagName == 'SPAN')
  {
    var action = n.getAttribute ('action');
    if (action != null) {
      if (action.indexOf ('moveUp') != -1) {
	n.title = _('Move up');
	n.onclick = moveUpICfmov;
      }
      else if (action.indexOf ('moveDown') != -1) {
	n.title = _('Move down');
	n.onclick = moveDownICfmov;
      }
      else if (action.indexOf ('rem') != -1) {
	n.title = _('Remove');
	n.onclick = remICfmov;
      }
    }
  }
}

function getScrollY () {
  if (document.body && document.body.scrollTop) /* DOM */
    return document.body.scrollTop;
  else if (document.documentElement && document.documentElement.scrollTop) /* IE */
    return document.documentElement.scrollTop;
  return 0;
}

function popUp (obj) {
  var innerWidth = 0;
  var innerHeight = 0;
  if (opera || safari)
    obj.style.display = 'block';
  var objWidth  = getStyle (obj, 'width');
  var objHeight = getStyle (obj, 'height');
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
  obj.style.top  = getScrollY () + innerHeight - (objHeight / 2) + 'px';
  if (parseInt (obj.style.top) < 1)
    obj.style.top = '1px';
}

var WindowSystem = new function () {
  this.lastWindow = null;
  this.lastWindowZ = 0;
  this.focusedWindow = null;
  this.focusedWindowZ = 0;
  this.focus = function (win, zero) {
    if (this.focusedWindow == win)
      return;
    if (this.focusedWindow) {
      this.lastWindow = this.focusedWindow;
      this.lastWindow.firstChild.className = 'WindowTitleBarInactive';
    }
    this.focusedWindow = win;
    if (!this.focusedWindow.lastWindow)
      this.focusedWindow.lastWindow = this.lastWindow;
    this.focusedWindow.firstChild.className = 'WindowTitleBar';
    fin (win);
  };

  this.zerofocus = function (win) {
    WindowSystem.focus (win, true);
  };

  function fin (win) {
    if (win.className == 'bWindow') {
      cursor = 1;
      unhighlightSCursor (sWindowCursor);
      var nfc = win.id.split ('_')[1];
      if (fCursor != nfc) {
	fCursor = nfc;
	resetBCursor ();
      }
    }
    else if (win.id == 'sWindow') {
      cursor = 0;
      if (bWindowCursor != null && bWindowTopEntries != null)
	unhighlightBCursor (bWindowTopEntries[bWindowCursor]);
    }
  }
};

function registerWindow (win) {
  win.style.display = 'block';
  WindowSystem.focus (win);
  win.onmousedown = wsIfocus;
}

function registerBWindow (win) {
  win.onmousedown = wsIzerofocus;
}

function wsIfocus (e) {
  if (!e) var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation ();
  WindowSystem.focus (this);
  return true;
}

function wsIzerofocus (e) {
  if (!e) var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation ();
  WindowSystem.zerofocus (this);
  return true;
}

function getWindowHeight () {
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

function getWindowWidth () {
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

function help (file) {
  var p = getWinPosition (640, 650);
  var w = window.open ('help/' + file, file,
		       'width='+ p.width +',height='+ p.height
		       + ',left='+ p.left +',top='+ p.top
		       + ',toolbar=no,status=no,location=no,resizable=yes,scrollbars=yes');
  if (!w) popupBlocked ();
}

function openSysLink (name, secure) {
  var file = name;
  if (secure) {
    var pathname = window.location.pathname;
    file = 'https://' + window.location.host +
      pathname.substring (0, pathname.lastIndexOf ('/')) +'/'+ name;
  }
  var p = getWinPosition (640, 400);
  var w = window.open (file, name,
		       'width='+ p.width +',height='+ p.height
		       + ',left='+ p.left +',top='+ p.top
		       + ',toolbar=no,status=no,location=no,resizable=yes,scrollbars=yes');
  if (!w) popupBlocked ();
}

function getWinPosition (width, height) {
  var screenX = typeof window.screenX != 'undefined' ? window.screenX : window.screenLeft;
  var screenY = typeof window.screenY != 'undefined' ? window.screenY : window.screenTop;
  var outerWidth = typeof window.outerWidth != 'undefined' ? window.outerWidth : document.body.clientWidth;
  var outerHeight = typeof window.outerHeight != 'undefined' ? window.outerHeight : (document.body.clientHeight - 22);
  return {
    width: width,
    height: height,
    left: parseInt (screenX + ((outerWidth - width) / 2), 10),
    top: parseInt (screenY + ((outerHeight - height) / 2.5), 10)
  };
}

function setFooter () {
  var footer = GID ('footer');
  if (!footer) return;
  var desc = '<b>' + _('Keyboard shortcuts');
  desc += ':</b> <b>j</b> - ' + _('next item');
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
  h.onmousedown = function () { help ('kshortcuts'); return false; };
  h.className = 'link';
  h.innerHTML = _('more');
  footer.appendChild (h);
  footer.style.display = 'block';
}
