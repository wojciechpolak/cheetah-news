/*
   Cheetah News JS/v1 Core
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

var cheetahData = null;
var errorNotifier = null;
var transformerFeed = null;
var feeds = null;
var topRightInfo = null;
var progressBar = null;
var intv = null;
var reloadIntv = null;
var feedCnt = 0;
var totalFeeds = 0;
var allToggle = false;
var cursor = 0;
var fCursor = null;
var sWindowCursor = null;
var bWindowCursor = null;
var bWindowTopEntries = null;
var Modules = new Object ();

function GID (x) {
  return document.getElementById (x);
}

function js_init () {
  try {
    js_initGui ();
  } catch (e) {
    js_stderr ('initGui Error: ' + e.name +': '+ e.message);
    return;
  }
  js_initAllKShortcuts ();
  js_run ();
  setInterval (js_updateScrollZerofocus, 1000);
  window.status = '';
}

function js_initAllKShortcuts () {
  document.onkeypress = js_kShortcutsHandler;
}

function js_kShortcutsHandler (e) {
  var code;
  if (!e) var e = window.event;
  if (e.keyCode) code = e.keyCode;
  else if (e.which) code = e.which;
  if (e.ctrlKey) return true;

  switch (code) {
    case 101: /* e */
      if (cheetahData != null && fCursor)
	js_closeFeed (fCursor);
      break;
    case 97: /* a */
      if (allToggle) {
	js_hideAll ();
	js_resetBCursor ();
	cursor = 0;
	WindowSystem.focus (sWindow);
      }
      else {
	js_showAllActive ();
	cursor = 1;
      }
      break;
    case 65: /* A */
      js_showAllLoaded ();
      cursor = 1;
      break;
    case 106: /* j */
      if (cursor == 1) {
	if (fCursor) {
	  if (bWindowTopEntries == null)
	    bWindowTopEntries = js_findBWindowEntries (GID ('bWindowContent_' + fCursor));
	  if (bWindowTopEntries.length > 0)
	    js_bWindowCursorForward ();
	  else
	    bWindowTopEntries = null;
	}
      }
      else if (cursor == 0 && sWindow.style.display != 'none') {
	js_sWindowCursorForward ();
	if (sWindowCursor == null) break;
	var sWindowCursorPos = msie ? js_findPosY (sWindowCursor) : sWindowCursor.offsetTop;
	if (sWindowCursorPos > (sWindow.clientHeight - 30))
	  sWindowFeeds.scrollTop = sWindowCursorPos - 200;
	else
	  sWindowFeeds.scrollTop = 0;
      }
      break;
    case 107: /* k */
      if (cursor == 1) {
	if (fCursor) {
	  if (bWindowTopEntries == null)
	    bWindowTopEntries = js_findBWindowEntries (GID ('bWindowContent_' + fCursor));
	  if (bWindowTopEntries.length > 0)
	    js_bWindowCursorBackward ();
	  else
	    bWindowTopEntries = null;
	}
      }
      else if (cursor == 0 && sWindow.style.display != 'none') {
	js_sWindowCursorBackward ();
	if (sWindowCursor == null) break;
	var sWindowCursorPos = msie ? js_findPosY (sWindowCursor) : sWindowCursor.offsetTop;
	if (sWindowCursorPos > (sWindow.clientHeight - 30))
	  sWindowFeeds.scrollTop = sWindowCursorPos - 200;
	else
	  sWindowFeeds.scrollTop = 0;
      }
      break;
    case 104: /* h */
    case 72: /* H */
      if (sWindow.style.display != 'none') {
	WindowSystem.zerofocus (sWindow);
	if (bWindowCursor != null && bWindowTopEntries != null)
	  js_unhighlightBCursor (bWindowTopEntries[bWindowCursor]);
	if (sWindowCursor == null)
	  js_sWindowCursorForward ();
	js_highlightSCursor (sWindowCursor);
	if (js_getStyle (sWindow, 'position') != 'fixed')
	  js_scrollToElement (sWindow);
	cursor = 0;
      }
      break;
    case 108: /* l */
    case 76: /* L */
      if (fCursor) {
	WindowSystem.zerofocus (GID ('bWindow_' + fCursor));
	if (bWindowCursor != null && bWindowTopEntries != null) {
	  js_highlightBCursor (bWindowTopEntries[bWindowCursor]);
	  if (bWindowCursor == 0)
	    js_scrollToElement (GID ('bWindow_' + fCursor));
	  else
	    js_scrollToElement (bWindowTopEntries[bWindowCursor]);
	}
	else
	  js_scrollToElement (GID ('bWindow_' + fCursor));
	cursor = 1;
      }
      break;
    case 74: /* J */
      if (cursor == 1)
	js_fCursorForward ();
      break;
    case 75: /* K */
      if (cursor == 1)
	js_fCursorBackward ();
      break;
    case 100: /* d */
      if (Modules.Notes && cursor == 1) {
	if (fCursor && bWindowCursor != null && bWindowTopEntries != null) {
	  var eid = bWindowTopEntries[bWindowCursor].id.split ('_')[1];
	  var el = GID ('el_' + eid);
	  var link = GID ('linkMore_' + eid);
	  if (el && link)
	    Modules.Notes.js_addBookmark (el.innerHTML, link.href);
	}
	return false;
      }
      break;
    case 120: /* x */
      if (cursor == 1) {
	if (fCursor && bWindowCursor != null && bWindowTopEntries != null) {
	  var link = GID ('linkMore_' + bWindowTopEntries[bWindowCursor].id.split ('_')[1]);
	  if (link) {
	    if (msie)
	      link.click ();
	    else {
	      var w = window.open (link.href, link.href);
	      if (!w) js_popupBlocked ();
	    }
	  }
	}
      }
      else if (cursor == 0 && sWindow.style.display != 'none') {
	js_resetBCursor ();
	js_openCategoryUnderSCursor (false);
	cursor = 1;
      }
      break;
    case 88: /* X */
      if (cursor == 0 && sWindow.style.display != 'none') {
	js_resetBCursor ();
	js_openCategoryUnderSCursor (true);
	cursor = 1;
      }
      break;
    case 13: /* enter */
      if (cursor == 1) {
	if (fCursor)
	  js_toggleItemUnderBCursor ();
      }
      else if (cursor == 0 && sWindow.style.display != 'none')
	js_openItemUnderSCursor (e.shiftKey);
      break;
    case 115: /* s */
      if (sWindow.style.display == 'none')
	js_openSWindow ();
      else
	js_closeSWindow ();
      break;
    case 102: /* f */
      if (Modules.Filter) {
	Modules.Filter.js_shortcut ();
	return false;
      }
      break;
    case 99: /* c */
      if (cursor == 0)
	js_collapseFolders ();
      else if (fCursor) {
	var bw = GID ('bWindowContent_' + fCursor);
	if (bw) js_traverseDOM (bw, js_ecEntries, false);
	js_scrollToElement (GID ('bWindow_' + fCursor));
      }
      break;
    case 114: /* r */
      js_refreshVisible ();
      break;
    case 119: /* w */
      if (Modules.WebSearch) {
	Modules.WebSearch.js_shortcut ();
	return false;
      }
      break;
    case 98: /* b */
      if (Modules.Notes)
 	Modules.Notes.js_shortcut ();
      break;
    case 117: /* u */
      if (Modules.Marker && cursor == 1) {
	if (fCursor && bWindowCursor != null && bWindowTopEntries != null) {
	  var eid = bWindowTopEntries[bWindowCursor].id.split ('_')[1];
	  if (eid)
	    Modules.Marker.markAsUnread (eid);
	}
      }
      break;
    case 109: /* m */
      if (Modules.Marker && cursor == 1) {
	if (fCursor && bWindowCursor != null && bWindowTopEntries != null) {
	  var eid = bWindowTopEntries[bWindowCursor].id.split ('_')[1];
	  if (eid)
	    Modules.Marker.markAsRead (eid);
	}
      }
      break;
  }
  return true;
}

function js_run () {
  try {
    js_fetchUserData (js_initData);
  } catch (e) {
    js_stderr ('Cheetah Runtime Error: ' + e.name +': '+ e.message);
  }
}

function js_isOnline () {
  if (typeof navigator.onLine != 'undefined' && navigator.onLine == false)
    return false;
  return true;
}

function js_checkOnline () {
  if (!js_isOnline ()) {
    alert (_('Your browser is working offline!'));
    return false;
  }
  return true;
}

function js_initHouseholdCleanser () {
  var x = null;
  if (window.XMLHttpRequest)
    x = new XMLHttpRequest ();
  else if (window.ActiveXObject) {
    try { x = new ActiveXObject ("Msxml2.XMLHTTP"); }
    catch (e) {
      try { x = new ActiveXObject ("Microsoft.XMLHTTP"); }
      catch (E) { x = null; }
    }
  }
  if (!x && msie)
    alert (_('You need to enable active scripting and ActiveX controls.'));
  return x;
}

function js_timeoutAXML (xh, feedid) {
  if (xh != null && xh.readyState > 0 && xh.readyState < 4) {
    xh.abort ();
    var fw = GID ('feedWaiting_' + feedid);
    if (fw)
      fw.innerHTML = _('Timeout Error!');
    js_updateProgressBar (js_calcProgress (++feedCnt, totalFeeds));
  }
}

function js_fetchAXML (feedid, latest, expand) {
  var xh = js_initHouseholdCleanser ();
  var to = null;
  if (!xh) return;
  try {
    xh.open ('GET', 'fetch?feedid=' + feedid, true);
    xh.onreadystatechange = function () {
      if (xh.readyState == 4) {
	var xhs = false;
	if (to) clearTimeout (to);
	try { xhs = xh.status ? true : false; } catch (e) {};
	if (xhs) {
	  if (xh.status == 200) {
	    if (xh.responseXML)
	      js_transformFeed (xh.responseXML, feedid, latest, expand);
	    else {
	      var rx = null;
	      if (window.DOMParser) {
		var parser = new DOMParser ();
		rx = parser.parseFromString (xh.responseText, 'text/xml');
	      }
	      else if (window.ActiveXObject) {
		rx = new ActiveXObject ('Microsoft.XMLDOM');
		rx.async = 'false';
		rx.loadXML (xh.responseText);
	      }
	      if (rx)
		js_transformFeed (rx, feedid, latest, expand);
	      else {
		js_rbug ('fetchAXML Error (feed ' + feedid +', null): '
			 + xh.getAllResponseHeaders () +'\n'+ xh.responseText);
		var feedWaiting = GID ('feedWaiting_' + feedid);
		if (feedWaiting) feedWaiting.innerHTML = _('error');
	      }
	    }
	  }
          else if (xh.status == 0); /* IE */
	  else
	    js_stderr ('fetchAXML Error (feed ' + feedid +'): '+ xh.status +': '+ xh.statusText);
	}
	xh = null;
      }
    };
    /* Try to use Gecko 1.8+ due to bug 268844. */
    xh.send (null);
    to = setTimeout (function () { js_timeoutAXML (xh, feedid); }, 60000);
  } catch (e) {
    js_stderr ('fetchAXML Error: ' + e.name +': '+ e.message);
  }
}

var sendIntv = null;
function js_sendX (url, data, ret, cb, fail) {
  var xh = js_initHouseholdCleanser ();
  if (!xh) return null;
  try {
    xh.open (data ? 'POST' : 'GET', url, true);
    xh.onreadystatechange = function() {
      if (xh.readyState == 4) {
	var xhs = false;
	try { xhs = xh.status ? true : false; } catch (e) {};
	if (xhs) {
	  if (xh.status == 200) {
	    if (sendIntv) {
	      clearTimeout (sendIntv);
	      sendIntv = null;
	    }
	    if (cb)
	      cb (ret ? xh.responseXML : xh.responseText);
	  }
	  else if (xh.status == 0); /* IE */
	  else {
	    if (fail)
	      fail (xh.status, xh.statusText);
	    else
	      js_stderr ('sendX Error: ' + xh.status + ': ' + xh.statusText);
	  }
	}
	xh = null;
      }
    }
    xh.setRequestHeader ('Content-Type', 'application/x-www-form-urlencoded');
    xh.send (data);
    return xh;
  } catch (e) {
    js_stderr ('sendX Error: ' + e.name +': '+ e.message);
  }
}

function js_fetchUserData (cb) {
  return js_sendX ('fetch', 'gs=1', 0, cb, null);
}

function js_mdb (data, cb, fail) {
  data += '&sid=' + encodeURIComponent (readCookie ('cheetah'));
  return js_sendX ('mdb', data, 1, cb, fail);
}

function Transformer (xh) {
  if (window.XSLTProcessor) {
    this.xslDocument = xh.responseXML;
    this.processor = new XSLTProcessor ();
    this.processor.importStylesheet (this.xslDocument);
    this.setParameter = function (name, value) {
      this.processor.setParameter (null, name, value);
    };
    this.transform = function (xmlDocument) {
      var output = this.processor.transformToFragment (xmlDocument, document);
      var xmlContainer = document.createElement ('DIV');
      xmlContainer.appendChild (output);
      return xmlContainer.innerHTML;
    };
  }
  else if (window.ActiveXObject) {
    this.xslDocument = new ActiveXObject ("Msxml2.FreeThreadedDOMDocument.3.0");
    this.xslDocument.loadXML (xh.responseText);
    this.xsltEngine = new ActiveXObject ("Msxml2.XSLTemplate.3.0");
    this.xsltEngine.stylesheet = this.xslDocument;
    this.processor = this.xsltEngine.createProcessor ();
    this.setParameter = function (name, value) {
      this.processor.addParameter (name, value);
    };
    this.transform = function (xmlDocument) {
      this.processor.input = xmlDocument;
      this.processor.transform ();
      return this.processor.output;
    };
  }
  else {
    throw (_("Your browser can't handle this script."));
  }
}

function js_initXSLT (cb) {
  var xh = js_initHouseholdCleanser ();
  if (!xh) return;
  try {
    xh.open ('GET', 'd?q=tr', true);
    xh.setRequestHeader ('X-Referer', 'CNA');
    xh.onreadystatechange = function () {
      if (xh.readyState == 4) {
	if (xh.status == 200) {
	  transformerFeed = new Transformer (xh);
	  cb ();
	}
	else {
	  js_stderr ('initXSLT Error: ' + xh.status + ': ' + xh.statusText);
	}
	xh = null;
      }
    };
    xh.send (null);
  } catch (e) {
    js_stderr ('initXSLT Error: ' + e.name +': '+ e.message);
  }
}

function js_transformFeed (xmlDocument, feedid, latest, expand) {
  try {
    var bWindowContent = GID ('bWindowContent_' + feedid);
    transformerFeed.setParameter ('FEEDID', feedid);
    transformerFeed.setParameter ('LATEST', latest);
    transformerFeed.setParameter ('EXPAND', expand);
    transformerFeed.setParameter ('ORDERBY', cheetahData.oldf ? 'descending' : 'ascending');
    if (msie) {
      var x = js_decodeEntities (transformerFeed.transform (xmlDocument));
      x = x.replace (new RegExp ('(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)', 'img'), '');
      x = x.replace (new RegExp ('(?:<style.*?>)((\n|\r|.)*?)(?:<\/style>)', 'img'), '');
      x = x.replace (/<iframe/ig, '&#60;iframe');
      x = x.replace (/<\/iframe/ig, '&#60;/iframe');
      x = x.replace (/<textarea/ig, '&#60;textarea');
      x = x.replace (/href=\"\//ig, 'relative="yes" href="/');
      x = x.replace (/osrc=\"\//g, 'relative="yes" osrc="/');
      bWindowContent.innerHTML = x;
      x = null;
    }
    else {
      var x = js_decodeEntities (transformerFeed.transform (xmlDocument));
      x = x.replace (new RegExp ('(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)', 'img'), '');
      x = x.replace (new RegExp ('(?:<style.*?>)((\n|\r|.)*?)(?:<\/style>)', 'img'), '');
      x = x.replace (/<textarea/ig, '&#60;textarea');
      bWindowContent.innerHTML = x;
      var clr = document.createElement ('DIV');
      clr.style.clear = 'both';
      bWindowContent.appendChild (clr);
    }

    GID ('bWindowFiltered_' + feedid).style.display = 'none';
    js_updateProgressBar (js_calcProgress (++feedCnt, totalFeeds));
    var feedWaiting = GID ('feedWaiting_' + feedid);

    if (js_xmlStatus (xmlDocument)) {
      feedWaiting.innerHTML = _('error');
    }
    else {
      feedWaiting.style.display = 'none';
      GID ('aps_' + feedid).className = 'feedLoaded';
      js_traverseDOM (bWindowContent, prepareEntry, feedid);
    }
  }
  catch (e) {
    var feedWaiting = GID ('feedWaiting_' + feedid);
    if (feedWaiting) feedWaiting.innerHTML = _('error');
    js_rbug ('transformFeed Error (feed ' + feedid +'): '+ e.name +': '+ e.message);
  }
}

function js_setRefreshRate () {
  if (reloadIntv)
    clearInterval (reloadIntv);
  if (cheetahData.frequency > 0)
    reloadIntv = setInterval (js_refresh, 60000 * cheetahData.frequency);
}

function js_initData (data) {
  try {
    eval (data);
  } catch (e) {
    js_stderr ('initData: ' + e.name +': '+ e.message);
  }
  if (cheetahData != null) {
    progressBar.style.display = 'none';
    if (Modules.Invite)
      Modules.Invite.js_setup ();
    js_setRefreshRate ();
    js_initXSLT (js_loadFeeds);
  }
}

function js_reinitData (data) {
  var cdp = cheetahData;
  try {
    eval (data);
  } catch (e) {
    js_stderr ('reinitData: ' + e.name +': '+ e.message);
  }
  if (cheetahData != null) {
    js_setRefreshRate ();
    js_loadSWindow ();

    if (cdp && cdp.feeds) {
      for (var feedid in cdp.feeds) {
	if (!cheetahData.feeds[feedid])
	  feeds.removeChild (GID ('bWindow_' + feedid));
      }
    }
    var previousFeedid = -1;
    for (var feedid in cheetahData.feeds) {
      var bWindow = GID ('bWindow_' + feedid);
      if (previousFeedid != -1) {
	var bWPSID = bWindow.previousSibling.id.split ('_')[1];
	if (bWPSID != previousFeedid) {
	  feeds.insertBefore (bWindow, GID ('bWindow_' + previousFeedid).nextSibling);
	}
      }
      else {
	if (bWindow.previousSibling != null) {
	  feeds.insertBefore (bWindow, feeds.firstChild);
	}
      }
      previousFeedid = feedid;
    }

    for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
      var feedid = cheetahData.feedOrder[foi];
      var desc = cheetahData.feeds[feedid][0];
      GID ('open_' + feedid).innerHTML = desc;
      GID ('bWindowTitle_' + feedid).innerHTML = desc;
      if (cdp && cdp.feeds && cdp.feeds[feedid]) {
	if (cdp.feeds[feedid][4]) {
	  if (cheetahData.feeds[feedid][4] == 0)
	    cheetahData.feeds[feedid][4] = 2;
	  GID ('aps_' + feedid).className = 'feedLoaded';
	}
	else if (cdp.feeds[feedid][4] == 0 && cheetahData.feeds[feedid][4] == 1) {
	  var latest = cheetahData.feeds[feedid][2];
	  var expand = cheetahData.feeds[feedid][3];
	  js_feedWaiting (feedid);
	  js_fetchAXML (feedid, latest, expand);
	}
      }
    }

    totalFeeds = js_countActiveFeeds (cheetahData.feeds);
    if (feedCnt > totalFeeds)
      feedCnt = totalFeeds;

    if (Modules.Invite)
      Modules.Invite.js_setup ();
  }
  cdp = null;
}

function js_feedWaiting (feedid) {
  var fw = GID ('feedWaiting_' + feedid);
  if (fw) {
    fw.innerHTML = _('fetching data...');
    fw.style.display = 'block';
  }
}

function js_clearSelection () {
  try {
    if (window.getSelection)
      window.getSelection().removeAllRanges ();
    else if (document.selection)
      document.selection.empty ();
  } catch (e) {}
}

function js_length (obj) {
  var c = 0;
  for (var i in obj) c++;
  return c;
}

function js_countActiveFeeds (cfeeds) {
  var c = 0;
  for (var feedid in cfeeds) {
    if (cfeeds[feedid][4]) c++;
  }
  return c;
}

var lastFolder = null;

function js_appendFolder (id, desc, itr) {
  var cont = document.createElement ('DIV');
  cont.id = 'sWindowFolder_' + id;
  cont.className = 'sWindowFolder';
  var link = document.createElement ('SPAN');
  link.id  = 'ec_' + id;
  link.innerHTML = desc;
  link.className = 'link';
  var ef = document.createElement ('SPAN');
  ef.id = 'ef_' + id;
  ef.innerHTML = '&raquo;';
  ef.className = 'ilink';
  ef.title = _('Open feeds from this folder');
  ef.onmousedown = js_openICategoryFeed;
  ef.onmouseover = js_styleLink;
  ef.onmouseout  = js_styleILink;
  cont.innerHTML = '<img id="fImage_'+
    id +'" src="images/folderclose.png" width="16" height="16" alt="(F)">&nbsp;';
  cont.appendChild (link);
  var space = document.createElement ('SPAN');
  space.innerHTML = '&nbsp;&nbsp;';
  cont.appendChild (space);
  cont.appendChild (ef);
  var folder = document.createElement ('DIV');
  folder.id = 'folder_' + id;
  folder.className = 'folderCollapsed';
  cont.appendChild (folder);
  if (!itr) {
    sWindowFeeds.appendChild (cont);
  }
  else {
    GID ('sWindowOptions').style.display = 'block';
    var rfs = GID ('rfs');
    if (rfs) {
      sWindowFeeds.insertBefore (cont, rfs);
    }
    else {
      var rfs = document.createElement ('P');
      rfs.id = 'rfs';
      rfs.style.fontSize = '1px';
      rfs.style.marginTop = '5px';
      if (sWindowFeeds.firstChild)
	sWindowFeeds.insertBefore (rfs, sWindowFeeds.firstChild);
      else
	sWindowFeeds.appendChild (rfs);
      sWindowFeeds.insertBefore (cont, rfs);
    }
  }
  GID ('fImage_' + id).onmousedown = js_ecIFolder;
  GID ('ec_' + id).onmousedown = js_ecIFolder;
}

function js_ecIFolder () {
  js_unhighlightSCursor (sWindowCursor);
  js_ecFolder (this.id.split ('_')[1]);
  return false;
}

function js_ecFolder (folderid) {
  if (msie) js_clearSelection ();
  var folder = GID ('folder_' + folderid);
  if (folder.className == 'folderCollapsed') {
    folder.className = 'folderExpanded';
    folder.style.display = 'block';
    GID ('fImage_' + folderid).src = 'images/folderopen.png';
  }
  else {
    folder.className = 'folderCollapsed';
    folder.style.display = 'none';
    GID ('fImage_' + folderid).src = 'images/folderclose.png';
  }
}

function js_collapseFolders () {
  if (msie) js_clearSelection ();
  js_unhighlightSCursor (sWindowCursor);
  if (!cheetahData) return;
  for (var id in cheetahData.folders) {
    var folder = GID ('folder_' + id);
    if (folder.className != 'folderCollapsed') {
      folder.className = 'folderCollapsed';
      folder.style.display = 'none';
      GID ('fImage_' + id).src = 'images/folderclose.png';
    }
  }
  sWindowFeeds.scrollTop = 0;
  return false;
}

function js_expandFolders () {
  if (msie) js_clearSelection ();
  js_unhighlightSCursor (sWindowCursor);
  if (!cheetahData) return;
  for (var id in cheetahData.folders) {
    var folder = GID ('folder_' + id);
    if (folder.className != 'folderExpanded') {
      folder.className = 'folderExpanded';
      folder.style.display = 'block';
      GID ('fImage_' + id).src = 'images/folderopen.png';
    }
  }
  return false;
}

function js_collapseEntries () {
  var feedid = this.id.split ('_')[1];
  var bw = GID ('bWindowContent_' + feedid);
  if (bw)
    js_traverseDOM (bw, js_ecEntries, false);
  return false;
}

function js_expandEntries () {
  var feedid = this.id.split ('_')[1];
  var bw = GID ('bWindowContent_' + feedid);
  if (bw) {
    js_traverseDOM (bw, prepareImages, feedid);
    js_traverseDOM (bw, js_ecEntries, true);
    js_scrollToElement (GID ('bWindow_' + feedid));
  }
  return false;
}

function js_ecEntries (n, expand) {
  if (n.tagName == 'DIV' && n.className == 'entryBody') {
    if (expand) {
      n.style.display = 'block';
      if (Modules.Marker)
	Modules.Marker.markAsRead (n.id.split ('_')[1]);
    }
    else
      n.style.display = 'none';
  }
}

function js_appendSWindow (feedid, desc, folderid) {
  var cont = document.createElement ('DIV');
  cont.id = 'sWindowFeed_' + feedid;
  cont.className = 'sWindowFeed';
  var link = document.createElement ('SPAN');
  link.id  = 'open_' + feedid;
  link.innerHTML = desc;
  link.className = 'link';
  cont.innerHTML = '&#8226;&nbsp;';
  cont.appendChild (link);
  cont.innerHTML += '&nbsp;<span id="aps_' +feedid+ '" class="feedEmpty">&raquo;</span><br />';
  if (folderid != '0') {
    var folder = GID ('folder_' + folderid);
    if (folder)
      folder.appendChild (cont);
    else {
      sWindowFeeds.appendChild (cont);
      cheetahData.feeds[feedid][1] = '0';
    }
  }
  else {
    sWindowFeeds.appendChild (cont);
  }
  GID ('open_' + feedid).onmousedown = js_openIFeed;
}

function js_loadSWindow () {
  sWindowFeeds.innerHTML = '';
  sWindowCursor = null;
  if (cheetahData != null) {
    var fldCounter = 0;
    for (var foi = 0; foi < cheetahData.folderOrder.length; foi++) {
      var name = cheetahData.folders[cheetahData.folderOrder[foi]];
      js_appendFolder (cheetahData.folderOrder[foi], name, false);
      fldCounter++;
    }
    if (fldCounter == 0)
      GID ('sWindowOptions').style.display = 'none';
    if (js_length (cheetahData.folders)) {
      var rfs = document.createElement ('P');
      rfs.id = 'rfs';
      rfs.style.fontSize = '1px';
      rfs.style.marginTop = '5px';
      sWindowFeeds.appendChild (rfs);
    }
    totalFeeds = js_countActiveFeeds (cheetahData.feeds);
    for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
      var feedid = cheetahData.feedOrder[foi];
      var feed = cheetahData.feeds[feedid];
      js_appendSWindow (feedid, feed[0], feed[1]);
    }
  }
}

function js_loadFeeds () {
  js_loadSWindow ();
  for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
    var feedid = cheetahData.feedOrder[foi];
    var feed = cheetahData.feeds[feedid];
    js_createBWindow (feedid, feed[0]);
  }
  if (cheetahData.feedAddSid) {
    totalFeeds++;
    js_openFeed (cheetahData.feedAddSid, false);
    js_refresh ();
  }
  else if (cheetahData.feedAddUrl) {
    js_addFeedUrl (cheetahData.feedAddUrl);
    js_refresh ();
  }
  else if (totalFeeds) {
    js_refresh ();
    if (cheetahData.safs) {
      cursor = 1;
      allToggle = true;
      for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
	var feedid = cheetahData.feedOrder[foi];
	var feed = cheetahData.feeds[feedid];
	if (feed[4] == 1) { /* only active */
	  GID ('bWindow_' + feedid).style.display = 'block';
	  var open = GID ('open_' + feedid);
	  open.className = 'linkb';
	  open.setAttribute ('pclassName', 'linkb');
	}
      }
      fCursor = js_findTopOpenFeed ();
      js_highlightFCursor ();
    }
  }
  else
    progressBar.style.display = 'none';
}

var cgIntv = null;
function js_refresh () {
  if (!js_isOnline ()) return;
  feedCnt = 0;
  top.document.title = _('loading...');
  js_resetBCursor ();
  for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
    var feedid = cheetahData.feedOrder[foi];
    var latest = cheetahData.feeds[feedid][2];
    var expand = cheetahData.feeds[feedid][3];
    var active = cheetahData.feeds[feedid][4];
    if (active == 1) {
      js_feedWaiting (feedid);
      js_fetchAXML (feedid, latest, expand);
    }
    else if (active == 2)
      feedCnt++;
  }
  if (msie && window.CollectGarbage) {
    if (cgIntv) clearTimeout (cgIntv);
    cgIntv = setTimeout (CollectGarbage, 1000);
  }
}

function js_refreshVisible () {
  if (msie) js_clearSelection ();
  if (!js_checkOnline ()) return;
  js_resetBCursor ();
  if (cheetahData != null) {
    for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
      var feedid = cheetahData.feedOrder[foi];
      var latest = cheetahData.feeds[feedid][2];
      var expand = cheetahData.feeds[feedid][3];
      var active = cheetahData.feeds[feedid][4];
      if (GID ('bWindow_' + feedid).style.display == 'block' && active) {
	feedCnt--;
	js_feedWaiting (feedid);
	js_fetchAXML (feedid, latest, expand);
      }
    }
  }
  if (msie && window.CollectGarbage) {
    if (cgIntv) clearTimeout (cgIntv);
    cgIntv = setTimeout (CollectGarbage, 1000);
  }
  return false;
}

function js_reloadFeed () {
  if (!js_checkOnline ()) return;
  var feedid = this.id.split ('_')[1];
  var fw = GID ('feedWaiting_' + feedid);
  if (fw && fw.style.display == 'none')
    feedCnt--;
  js_feedWaiting (feedid);
  var feed = cheetahData.feeds[feedid];
  js_fetchAXML (feedid, feed[2], feed[3]);
}

function js_lookupNode (node, searchFor) {
  for (var i = 0; i < node.childNodes.length; i++) {
    var n = node.childNodes[i];
    if (n.nodeType != 1)
      continue;
    if (n.nodeName == searchFor) {
      return n;
    }
    else if (n.childNodes.length) {
      var d = js_lookupNode (n, searchFor);
      if (d != null)
	return d;
    }
  }
}

function js_traverseDOM (node, cb, args) {
  for (var i = 0; i < node.childNodes.length; i++) {
    var n = node.childNodes[i];
    if (n.tagName != undefined) {
      if (n.childNodes.length) {
        cb (n, args);
        js_traverseDOM (n, cb, args);
      } else {
        cb (n, args);
      }
    }
  }
}

function js_findParentContainer (n, stop) {
  while (n.parentNode) {
    if (n.className == stop)
      return n;
    n = n.parentNode;
  }
  return n;
}

function js_xmlStatus (xml) {
  var node = null;
  if (xml && xml.firstChild) {
    if (msie && xml.firstChild.nextSibling)
      node = xml.firstChild.nextSibling;
    else if (opera && xml.firstChild.nextSibling && xml.firstChild.nextSibling.nextSibling)
      node = xml.firstChild.nextSibling.nextSibling;
    else
      node = xml.firstChild;
  }
  if (node && node.nodeName == 'error') {
    var msg = _('Unknown error');
    node = js_lookupNode (xml, 'message');
    if (node && node.firstChild && node.firstChild.nodeValue &&
	node.firstChild.nodeValue.length) {
      msg = node.firstChild.nodeValue;
    }
    return msg;
  }
  else
    return null;
}

function js_moveUp (me) {
  var me   = me;
  var prev = me.previousSibling;
  if (prev) {
    me.parentNode.insertBefore (me, prev);
    js_sChanged ();
  }
}

function js_moveDown (me) {
  var me   = me;
  var next = me.nextSibling;
  if (next) {
    me.parentNode.insertBefore (next, me);
    js_sChanged ();
  }
}

function js_blur () {
  this.blur ();
}

function prepareFeed (n, feedid) {
  if (n.tagName == 'SPAN') {
    var id = n.getAttribute ('id');
    if (id == 'bWindowReload_' + feedid)
      n.onclick = js_reloadFeed;
    else if (id == 'bWindowClose_' + feedid) {
      js_prepareWindowClose (n, function (obj) {
	  js_closeFeed (obj.id.split ('_')[1]);
	});
    }
  }
}

function prepareEntry (n, feedid) {
  if (n.tagName == 'SPAN') {
    if (n.className == 'entryLink') {
      var id = n.getAttribute ('id').split('_')[1];
      n.onmousedown = function () {
	if (msie) js_clearSelection ();
	js_ecItem (this, id); return false;
      };
    }
    else if (n.className == 'linkSave') {
      if (Modules.Notes)
	Modules.Notes.js_attach (n);
      else
	n.parentNode.removeChild (n);
    }
    else if (n.className == 'linkTranslate') {
      if (Modules.Translate)
	Modules.Translate.js_attach (n);
      else
	n.parentNode.removeChild (n);
    }
    else if (n.className == 'emax') {
      n.id = 'emax_' + feedid;
      n.style.marginLeft = '1em';
      var count = parseInt (n.getAttribute ('count'));
      var crcnt = parseInt (cheetahData.feeds[feedid][2]);
      var el = document.createElement ('SELECT');
      el.id = 'lChanger_' + feedid;
      el.style.fontSize = '95%';
      el.style.verticalAlign = 'middle';
      if (crcnt > count) crcnt = count;
      for (var i = 0; i < count; i++) {
	var ch = (crcnt == (i + 1)) ? true : false;
	el.options[i] = new Option (i+1, i+1, ch, ch);
      }
      el.onchange = function () {
	this.blur ();
	feedCnt--;
	js_feedWaiting (feedid);
	var feed = cheetahData.feeds[feedid];
	if (typeof feed[6] == 'undefined')
	  feed[6] = feed[2]; /* bck */
	feed[2] = this.options[this.selectedIndex].value;
	js_fetchAXML (feedid, feed[2], feed[3]);
	js_resetBCursor ();
      };
      n.appendChild (document.createTextNode (_('stories') + ': '));
      n.appendChild (el);
      var expEntries = document.createElement ('SPAN');
      expEntries.id = 'expandEntries_' + feedid;
      expEntries.innerHTML = _('Expand');
      expEntries.className = 'ilink';
      expEntries.title = _('Expand entries');
      expEntries.onmouseover = js_styleLink;
      expEntries.onmouseout  = js_styleILink;
      expEntries.onmousedown = js_expandEntries;
      var colEntries = document.createElement ('SPAN');
      colEntries.id = 'collapseEntries_' + feedid;
      colEntries.innerHTML = _('Collapse');
      colEntries.title = _('Collapse entries');
      colEntries.className = 'ilink';
      colEntries.onmouseover = js_styleLink;
      colEntries.onmouseout  = js_styleILink;
      colEntries.onmousedown = js_collapseEntries;
      n.appendChild (document.createTextNode (' | '));
      n.appendChild (expEntries);
      n.appendChild (document.createTextNode (' | '));
      n.appendChild (colEntries);
      if (Modules.Marker) {
	var mr = document.createElement ('SPAN');
	mr.id = 'markAsReadEntries_' + feedid;
	mr.innerHTML = _('Mark as read');
	mr.title = _('Mark all entries as read');
	mr.className = 'ilink';
	mr.onmouseover = js_styleLink;
	mr.onmouseout  = js_styleILink;
	mr.onmousedown = Modules.Marker.js_markEntriesAsRead;
	var mu = document.createElement ('SPAN');
	mu.id = 'markAsUnreadEntries_' + feedid;
	mu.innerHTML = _('Mark as unread');
	mu.title = _('Mark all entries as unread');
	mu.className = 'ilink';
	mu.onmouseover = js_styleLink;
	mu.onmouseout  = js_styleILink;
	mu.onmousedown = Modules.Marker.js_markEntriesAsUnread;
	n.appendChild (document.createTextNode (' | '));
	n.appendChild (mr);
	n.appendChild (document.createTextNode (' | '));
	n.appendChild (mu);
      }
      n.style.display = 'inline';
      n.style.visibility = 'hidden';
    }
    else if (n.className == 'linkThumbnail') {
      if (Modules.Media) {
	var src = n.getAttribute ('src');
	var flash = n.getAttribute ('flash');
	if (flash) {
	  n.title = _('See enclosed multimedia');
	  n.onmousedown = function () {
	    Modules.Media.playShockwaveFlash (src);
	    return false;
	  };
	}
	else {
	  n.title = _('See enclosed image');
	  n.onmousedown = function () {
	    Modules.Media.showThumbnail (src);
	    return false;
	  };
	}
      }
    }
  }
  else if (n.tagName == 'DIV') {
    if (n.className == 'entryTitle') {
      var dir = n.getAttribute ('dir');
      if (dir && dir == 'rtl') {
	n.style.textAlign = 'right';
	n.style.direction = 'rtl';
      }
    }
    else if (n.className == 'entryBody') {
      var dir = n.getAttribute ('dir');
      if (dir && dir == 'rtl') {
	n.style.textAlign = 'right';
	n.style.direction = 'rtl';
      }
      if (n.style.display != 'none') {
	if (Modules.Marker)
	  Modules.Marker.markAsRead (n.id.split ('_')[1]);
	js_traverseDOM (n, prepareImages, feedid);
      }
      else {
	if (Modules.Marker)
	  Modules.Marker.markIfUnread (n.id.split ('_')[1]);
      }
    }
    else if (n.className == 'channelOptions') {
      n.onmouseover = function (e) {
	var el = GID ('emax_' + feedid);
	if (el && el.style.visibility == 'hidden')
	  el.style.visibility = 'visible';
      };
      n.onmouseout = function (e) {
	if (!e) var e = window.event;
	var tg = (window.event) ? e.srcElement : e.target;
	if (tg.nodeName != 'SELECT' && tg.className != 'channelOptions' &&
	    tg.nodeName != 'IMG' && tg.nodeName != 'OPTION' &&
	    tg.nodeName != 'SPAN') return;
	try {
	  var reltg = (e.relatedTarget) ? e.relatedTarget : e.toElement;
	  if (typeof reltg == 'undefined' || reltg == null ||
	      typeof reltg.nodeName == 'undefined' ||
	      typeof reltg.parentNode == 'undefined') return;
	  while (reltg != tg && reltg.nodeName != 'BODY')
	    reltg = reltg.parentNode;
	  if (reltg == tg) return;
	} catch (e) {
	  return;
	}
	var el = GID ('emax_' + feedid);
	if (el) el.style.visibility = 'hidden';
      };
    }
  }
  else if (n.tagName == 'A') {
    if (n.className == 'channelLink') {
      n.title = '[' + _('External link') + ']';
      n.onmouseup = js_blur;
      if (n.firstChild.tagName == 'IMG') {
	if (n.firstChild.complete)
	  js_scaleLogo (n.firstChild);
	else
	  n.firstChild.onload = function () { js_scaleLogo (this); };
      }
    }
    else if (n.className == 'linkMore') {
      if (n.href) {
	n.style.color = 'gray'; /* Gecko bug workaround */
	n.innerHTML = _('more') + ' &raquo;';
	n.title = '[' + _('External link') + ']';
	n.onmouseup = js_blur;
      }
      else
	n.parentNode.removeChild (n);
    }
    else if (n.className == 'linkEmail') {
      if (n.href) {
	n.style.color = 'gray';
	n.innerHTML = _('email this');
	n.title = _('Email this to a friend');
	n.href = 'mailto:?subject=' + encodeURIComponent ('[Cheetah News] ' + n.getAttribute ('desc'))
	  + '&body=' + encodeURIComponent (n.getAttribute ('desc') +':\n'+ n.href);
	n.onmouseup   = js_blur;
	n.onmousedown = function () { return false; };
	n.onmouseover = function () { window.status = 'mailto:...'; return true; };
	n.onmouseout  = function () { window.status = ''; return true; };
      }
      else
	n.parentNode.removeChild (n);
    }
    else {
      var anchor = n.getAttribute ('href');
      if (anchor) {
	var rel = n.getAttribute ('relative');
	if (anchor.charAt (0) == '/' || (rel && rel == 'yes')) {
	  var cl = GID ('cl_' + feedid);
	  if (cl) {
	    var pathname = '';
	    if (msie && rel && n.pathname)
	      pathname = n.pathname;
	    else
	      pathname = anchor.substr (1);
	    n.href = js_getUrlDomain (cl.href) + pathname;
	  }
	}
	else if (anchor.indexOf ('http://') != 0 && anchor.indexOf ('https://') != 0) {
	  var rel = n.getAttribute ('relative');
	  var cl = GID ('cl_' + feedid);
	  if (cl) {
	    var pathname = '';
	    if (msie && rel && n.pathname)
	      pathname = n.pathname;
	    else
	      pathname = anchor;
	    n.href = js_getUrlDomain (cl.href) + pathname;
	  }
	}
      }
      if (n.href.indexOf ('.mp3') == -1 &&
	  n.href.indexOf ('.ogg') == -1 &&
	  n.href.indexOf ('.m4b') == -1 &&
	  n.href.indexOf ('.avi') == -1 &&
	  n.href.indexOf ('.mpg') == -1 &&
	  n.href.indexOf ('.mov') == -1 &&
	  n.href.indexOf ('.mp4') == -1 &&
	  n.href.indexOf ('.zip') == -1 &&
	  n.href.indexOf ('.tar.gz') == -1 &&
	  n.href.indexOf ('.tar.bz2') == -1)
	  n.target = n.href;
      n.onmouseup = js_blur;
    }
  }
}

function js_getUrlDomain (url) {
  var i = 0;
  if (url.indexOf ('http://') == 0)
    i = 7;
  else if (url.indexOf ('https://') == 0)
    i = 8;
  var urlDomain = url.substring (0, url.indexOf ('/', i));
  if (!urlDomain) urlDomain = url;
  return urlDomain + '/';
}

function js_scaleLogo (img) {
  var maxHeight = 65;
  if (img.height > maxHeight)
    img.height = maxHeight;
}

function js_ecItem (el, id) {
  var eb = GID ('eb_' + id);
  if (eb) {
    if (eb.style.display == 'none') {
      var feedid = eb.parentNode.parentNode.id.split ('_')[1];
      if (Modules.Marker)
	Modules.Marker.markAsRead (id);
      js_traverseDOM (eb, prepareImages, feedid);
      eb.style.display = 'block';
      js_scrollToElement (el);
    }
    else
      eb.style.display = 'none';
  }
}

function js_scrollToElement (el) {
  clearTimeout (scrollIntv);
  var dst = js_findPosY (el) - 4;
  var frms = 25;
  var time = 10;
  if (js_getStyle (sWindow, 'position') == 'fixed') {
    dst -= 46; frms = 10; time = 10;
  }
  var src = 0;
  if (document.body && document.body.scrollTop)
    src = document.body.scrollTop;
  else if (document.documentElement && document.documentElement.scrollTop)
    src = document.documentElement.scrollTop;
  var dist = Math.abs (dst - src);
  js_smoothScroll (src, dst, frms, parseInt (dist / frms), (dist < 150) ? time : (time + 10));
}

function js_jumpToTop () {
  if (document.body && document.body.scrollTop)
    document.body.scrollTop = 0;
  else if (document.documentElement && document.documentElement.scrollTop)
    document.documentElement.scrollTop = 0;
}

function prepareImages (n, feedid) {
  if (n.tagName == 'IMG') {
    var osrc = n.getAttribute ('osrc');
    if (osrc) {
      var rel = n.getAttribute ('relative');
      if (osrc.charAt (0) == '/' || (rel && rel == 'yes')) {
	var cl = GID ('cl_' + feedid);
	if (cl) {
	  var pathname = '';
	  if (msie && rel && n.pathname)
	    pathname = n.pathname;
	  else
	    pathname = osrc.substr (1);
	  osrc = js_getUrlDomain (cl.href) + pathname;
	}
      }
      else if (osrc.indexOf ('http://') != 0 && osrc.indexOf ('https://') != 0) {
	var rel = n.getAttribute ('relative');
	var cl = GID ('cl_' + feedid);
	if (cl) {
	  var pathname = '';
	  if (msie && rel && n.pathname)
	    pathname = n.pathname;
	  else
	    pathname = osrc;
	  osrc = js_getUrlDomain (cl.href) + pathname;
	}
      }
      n.src = osrc;
      n.removeAttribute ('osrc');
    }
  }
}

var scrollIntv = null;
var scrollCnt = 0;
function js_smoothScroll (src, dst, frms, step, time) {
  if (scrollCnt > (frms - 1)) {
    clearTimeout (scrollIntv);
    window.scrollTo (0, dst);
    lastScrollTop = document.body.scrollTop;
    scrollCnt = 0;
    return;
  }
  var t = 0;
  t = (src < dst) ? (src + step) : (src - step);
  window.scrollTo (0, t);
  scrollCnt++;
  scrollIntv = setTimeout (function () { js_smoothScroll (t, dst, frms, step, time); }, time);
}

function js_openIFeed (e) {
  if (!e) var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation ();
  js_resetBCursor ();
  js_openFeed (this.id.split ('_')[1], e.shiftKey);
  return false;
}

function js_openFeed (feedid, append) {
  if (!js_checkOnline ()) return;
  js_unhighlightSCursor (sWindowCursor);
  /* check for passive feeds */
  var feed = cheetahData.feeds[feedid];
  if (feed[4] == 0) {
    js_feedWaiting (feedid);
    totalFeeds++;
    feed[4] = 2; /* semi-active */
    js_fetchAXML (feedid, feed[2], feed[3]);
  }
  var bWindow = GID ('bWindow_' + feedid);
  if (!bWindow) {
    js_createBWindow (feedid, feed[0]);
    bWindow = GID ('bWindow_' + feedid);
  }
  if (!append)
    js_hideAll ();
  fCursor = feedid;
  bWindow.style.display = 'block';
  var open = GID ('open_' + feedid);
  open.className = 'linkb';
  open.setAttribute ('pclassName', 'linkb');
  js_highlightFCursor (bWindow);
  if (append)
    js_scrollToElement (bWindow);
  else
    js_jumpToTop ();
  cursor = 1;
  return false;
}

function js_closeFeed (feedid) {
  if (!feedid) return;
  GID ('bWindow_' + feedid).style.display = 'none';
  var open = GID ('open_' + feedid);
  open.className = 'link';
  open.setAttribute ('pclassName', 'link');
  if (feedid == fCursor)
    js_fCursorForward ();
  var openedFeedsCnt = 0;
  for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
    var feedid = cheetahData.feedOrder[foi];
    if (GID ('bWindow_' + feedid).style.display == 'block')
      openedFeedsCnt++;
  }
  if (openedFeedsCnt == 0) {
    allToggle = false;
    cursor = 0;
    WindowSystem.focus (sWindow);
  }
}

function js_openICategoryFeed (e) {
  if (!e) var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation ();
  js_openCategoryFeed (this.id.split ('_')[1], e.shiftKey);
  return false;
}

function js_openCategoryFeed (folderid, append) {
  if (!js_checkOnline ()) return;
  js_unhighlightSCursor (sWindowCursor);
  if (!append)
    js_hideAll ();
  var first = null;
  for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
    var feedid = cheetahData.feedOrder[foi];
    var feed = cheetahData.feeds[feedid];    
    if (feed[1] == folderid) {
      if (!first)
	first = feedid;
      /* check for passive feeds */
      if (feed[4] == 0) {
	js_feedWaiting (feedid);
	totalFeeds++;
	feed[4] = 2; /* semi-active */
	js_fetchAXML (feedid, feed[2], feed[3]);
      }
      GID ('bWindow_' + feedid).style.display = 'block';
      var open = GID ('open_' + feedid);
      open.className = 'linkb';
      open.setAttribute ('pclassName', 'linkb');
    }
  }
  if (!append) {
    js_jumpToTop ();
    fCursor = js_findTopOpenFeed ();
  }
  else if (first) {
    fCursor = first;
    js_scrollToElement (GID ('bWindow_' + fCursor));
  }
  js_highlightFCursor ();
  cursor = 1;
  return false;
}

function js_calcProgress (i, totalFeeds) {
  if (totalFeeds > 0)
    return parseInt (100 * i / totalFeeds);
  else
    return 0;
}

function js_updateProgressBar (s) {
  if (progressBar.style.display == 'none') {
    progressBar.style.display = 'inline';
    if (js_getStyle (sWindow, 'position') != 'fixed')
      js_stickyTopRightInfo ();
    if (intv) clearInterval (intv);
    intv = setInterval (js_hideProgressBar, 90000);
  }
  if (feedCnt >= totalFeeds) {
    if (intv) clearInterval (intv);
    intv = setInterval (js_hideProgressBar, 5000);
  }
  if (s < 0) s = 0;
  else if (s > 100) s = 100;
  progressBar.innerHTML = top.document.title = _('progress') +' '+ s + '%';
  if (feedCnt >= totalFeeds) js_resetTitle ();
}

function js_hideProgressBar () {
  progressBar.style.display = 'none';
  clearInterval (intv);
  js_resetTitle ();
}

function js_resetTitle () {
  top.document.title = 'Cheetah News';
}

var topRightInfoTop = 7;
var topRightInfoOld = topRightInfoTop;
function js_stickyTopRightInfo () {
  var pos = js_getScrollY ();
  if (pos < topRightInfoTop)
    pos = topRightInfoTop;
  else
    pos += topRightInfoTop;
  if (pos == topRightInfoOld)
    topRightInfo.style.top = pos;
  topRightInfoOld = pos;
  if (progressBar.style.display != 'none')
    setTimeout (js_stickyTopRightInfo, 100);
}

var lastScrollTop = 0;
function js_updateScrollZerofocus () {
  var y = 0;
  if (scrollCnt == 0 && bWindowCursor == null &&
      document.body.scrollTop != lastScrollTop) {
    lastScrollTop = document.body.scrollTop;
    if (js_getStyle (sWindow, 'position') == 'fixed')
      y = 35;
    for (var i = 0; i < feeds.childNodes.length; i++) {
      var bWindow = feeds.childNodes[i];
      if (bWindow.style.display != 'none' &&
	  (bWindow.offsetTop - y + 15) >= lastScrollTop &&
	  (bWindow.offsetTop - y + 40)  < (lastScrollTop + js_getWindowHeight ())) {
	WindowSystem.zerofocus (bWindow);
	break;
      }
    }
  }
}

function js_showAllActive () {
  if (msie) js_clearSelection ();
  js_hideAll ();
  js_unhighlightSCursor (sWindowCursor);
  cursor = 1;
  allToggle = true;
  if (cheetahData != null) {
    for (var feedid in cheetahData.feeds) {
      var feed = cheetahData.feeds[feedid];
      if (feed[4] == 1) { /* only active */
	GID ('bWindow_' + feedid).style.display = 'block';
	var open = GID ('open_' + feedid);
	open.className = 'linkb';
	open.setAttribute ('pclassName', 'linkb');
      }
    }
  }
  fCursor = js_findTopOpenFeed ();
  if (!fCursor) {
    alert (_("You don't have any active feeds."));
    allToggle = false;
  }
  else
    js_highlightFCursor ();
  js_jumpToTop ();
  return false;
}

function js_showAllLoaded () {
  if (msie) js_clearSelection ();
  js_unhighlightSCursor (sWindowCursor);
  cursor = 1;
  allToggle = true;
  if (cheetahData != null) {
    for (var feedid in cheetahData.feeds) {
      var feed = cheetahData.feeds[feedid];
      if (feed[4]) { /* active and semi-active */
	GID ('bWindow_' + feedid).style.display = 'block';
	var open = GID ('open_' + feedid);
	open.className = 'linkb';
	open.setAttribute ('pclassName', 'linkb');
      }
    }
  }
  fCursor = js_findTopOpenFeed ();
  js_highlightFCursor ();
  js_jumpToTop ();
  return false;
}

function js_hideAll () {
  if (msie) js_clearSelection ();
  js_resetBCursor ();
  fCursor = null;
  cursor = 0;
  allToggle = false;
  if (cheetahData != null) {
    for (var feedid in cheetahData.feeds) {
      GID ('bWindow_' + feedid).style.display = 'none';
      var open = GID ('open_' + feedid);
      open.className = 'link';
      open.setAttribute ('pclassName', 'link');
    }
  }
  return false;
}

function js_findTopOpenFeed () {
  for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
    var feedid = cheetahData.feedOrder[foi];
    if (GID ('bWindow_' + feedid).style.display == 'block')
      return feedid;
  }
  return null;
}

function js_sWindowCursorForward () {
  if (sWindowCursor == null) {
    sWindowCursor = sWindowFeeds.firstChild;
    js_highlightSCursor (sWindowCursor);
  }
  else {
    var prePos = sWindowCursor;
    if (sWindowCursor.className == 'sWindowFolder') {
      var folder = GID ('folder_' + sWindowCursor.id.split ('_')[1]);
      if (folder.className == 'folderExpanded' && folder.childNodes.length > 0)
	sWindowCursor = folder.firstChild;
      else if (sWindowCursor.nextSibling)
	sWindowCursor = sWindowCursor.nextSibling;
    }
    else {
      if (sWindowCursor.parentNode.className == 'folderCollapsed')
	sWindowCursor = sWindowCursor.parentNode.parentNode;
      else if (sWindowCursor.nextSibling)
	sWindowCursor = sWindowCursor.nextSibling;
      else if (sWindowCursor.parentNode.className == 'folderExpanded')
	sWindowCursor = sWindowCursor.parentNode.parentNode.nextSibling;
      else
	sWindowCursor = sWindowFeeds.firstChild;
    }
    if (sWindowCursor.tagName == 'P') {
      if (sWindowCursor.nextSibling)
	sWindowCursor = sWindowCursor.nextSibling;
      else
	sWindowCursor = folder.firstChild;
    }
    js_unhighlightSCursor (prePos);
    js_highlightSCursor (sWindowCursor);
  }
}

function js_sWindowCursorBackward () {
  if (sWindowCursor == null) {
    sWindowCursor = sWindowFeeds.lastChild;
    js_highlightSCursor (sWindowCursor);
  }
  else {
    var prePos = sWindowCursor;
    if (sWindowCursor.className == 'sWindowFolder') {
      if (sWindowCursor.previousSibling) {
	var folder = GID ('folder_' + sWindowCursor.previousSibling.id.split ('_')[1]);
	if (folder.className == 'folderExpanded' && folder.childNodes.length > 0)
	  sWindowCursor = folder.lastChild;
	else
	  sWindowCursor = sWindowCursor.previousSibling;
      }
      else
	sWindowCursor = sWindowFeeds.lastChild;
    }
    else {
      if (sWindowCursor.parentNode.className == 'folderCollapsed')
	sWindowCursor = sWindowCursor.parentNode.parentNode;
      else if (sWindowCursor.previousSibling)
	sWindowCursor = sWindowCursor.previousSibling;
      else if (sWindowCursor.parentNode.className == 'folderExpanded')
	sWindowCursor = sWindowCursor.parentNode.parentNode;
      else
	sWindowCursor = sWindowFeeds.lastChild;
    }
    if (sWindowCursor.tagName == 'P') {
      if (sWindowCursor.previousSibling) {
	if (sWindowCursor.previousSibling.className == 'sWindowFolder') {
	  var folder = GID ('folder_' + sWindowCursor.previousSibling.id.split ('_')[1]);
	  if (folder.className == 'folderExpanded' && folder.childNodes.length > 0)
	    sWindowCursor = folder.lastChild;
	  else
	    sWindowCursor = sWindowCursor.previousSibling;
	}
	else
	  sWindowCursor = sWindowCursor.previousSibling;
      }
      else
	sWindowCursor = sWindowFeeds.lastChild;
    }
    js_unhighlightSCursor (prePos);
    js_highlightSCursor (sWindowCursor);
  }
}

function js_openItemUnderSCursor (append) {
  if (sWindowCursor == null) return;
  if (sWindowCursor.className == 'sWindowFeed') {
    js_resetBCursor ();
    js_openFeed (sWindowCursor.id.split ('_')[1], append);
  }
  else if (sWindowCursor.className == 'sWindowFolder') {
    js_ecFolder (sWindowCursor.id.split ('_')[1]);
  }
}

function js_openCategoryUnderSCursor (append) {
  if (sWindowCursor == null) return;
  if (sWindowCursor.className == 'sWindowFolder') {
    js_openCategoryFeed (sWindowCursor.id.split ('_')[1], append);
  }
  else /* uhm */
    js_openItemUnderSCursor (append);
}

function js_highlightSCursor (cur) {
  if (cur && cur.nodeType == 1) {
    cur.style.backgroundColor = 'Highlight';
    if (cur.className == 'sWindowFeed') {
      var open = GID ('open_' + cur.id.split ('_')[1]);
      open.setAttribute ('pclassName', open.className == 'linkb' ? 'linkb' : 'link');
      open.className = 'highlight';
    }
    else
      GID ('ec_' + cur.id.split ('_')[1]).className = 'highlight';
  }
}

function js_unhighlightSCursor (cur) {
  if (cur && cur.nodeType == 1) {
    cur.style.backgroundColor = '';
    if (cur.className == 'sWindowFeed') {
      var open = GID ('open_' + cur.id.split ('_')[1]);
      var pclassName = open.getAttribute ('pclassName');
      open.className = pclassName ? pclassName : 'link';
    }
    else
      GID ('ec_' + cur.id.split ('_')[1]).className = 'link';
  }
}

function js_highlightBCursor (cur) {
  if (cur) {
    cur.style.backgroundColor = 'Highlight';
    cur.style.color = 'HighlightText';
  }
}

function js_unhighlightBCursor (cur) {
  if (cur) {
    cur.style.backgroundColor = 'white';
    cur.style.color = 'black';
  }
}

function js_resetBCursor () {
  if (bWindowCursor != null && bWindowTopEntries != null)
    js_unhighlightBCursor (bWindowTopEntries[bWindowCursor]);
  bWindowCursor = null;
  bWindowTopEntries = null;
}

function js_bWindowCursorForward () {
  var prePos = bWindowCursor;
  if (bWindowCursor != null && bWindowCursor >= (bWindowTopEntries.length - 1)) {
    bWindowCursor = null;
    js_unhighlightBCursor (bWindowTopEntries[prePos]);
    prePos = null;
  }
  if (bWindowCursor == null)
    bWindowCursor = 0;
  if (prePos != null) {
    js_unhighlightBCursor (bWindowTopEntries[prePos]);
    bWindowCursor++;
  }
  js_highlightBCursor (bWindowTopEntries[bWindowCursor]);
  if (bWindowCursor == 0)
    js_scrollToElement (GID ('bWindow_' + fCursor));
  else
    js_scrollToElement (bWindowTopEntries[bWindowCursor]);
}

function js_bWindowCursorBackward () {
  var prePos = bWindowCursor;
  if (bWindowCursor != null && bWindowCursor <= 0) {
    bWindowCursor = null;
    js_unhighlightBCursor (bWindowTopEntries[prePos]);
    prePos = null;
  }
  if (bWindowCursor == null)
    bWindowCursor = bWindowTopEntries.length - 1;
  if (prePos != null) {
    js_unhighlightBCursor (bWindowTopEntries[prePos]);
    bWindowCursor--;
  }
  js_highlightBCursor (bWindowTopEntries[bWindowCursor]);
  js_scrollToElement (bWindowTopEntries[bWindowCursor]);
}

function js_toggleItemUnderBCursor () {
  if (bWindowCursor != null && bWindowTopEntries != null) {
    js_ecItem (bWindowTopEntries[bWindowCursor],
	       bWindowTopEntries[bWindowCursor].id.split ('_')[1]);
  }
}

function js_fCursorForward () {
  var from = fCursor;
  var next = null;
  var bWindowContent = GID ('bWindowContent_' + from);
  if (bWindowContent)
    bWindowContent.style.borderLeftColor = 'white';
  var bWindow = GID ('bWindow_' + fCursor);
  while (bWindow && bWindow.nextSibling) {
    if (bWindow.nextSibling.style.display == 'block') {
      next = bWindow.nextSibling;
      break;
    }
    bWindow = bWindow.nextSibling;
  }
  if (next) {
    fCursor = next.id.split ('_')[1];
    js_highlightFCursor (next);
    js_scrollToElement (next);
  }
  else {
    fCursor = js_findTopOpenFeed ();
    if (fCursor) {
      js_highlightFCursor ();
      js_scrollToElement (GID ('bWindow_' + fCursor));
    }
  }
  if (from != fCursor)
    js_resetBCursor ();
}

function js_fCursorBackward () {
  var from = fCursor;
  var previous = null;
  var bWindowContent = GID ('bWindowContent_' + from);
  if (bWindowContent)
    bWindowContent.style.borderLeftColor = 'white';
  var bWindow = GID ('bWindow_' + fCursor);
  while (bWindow && bWindow.previousSibling) {
    if (bWindow.previousSibling.style.display == 'block') {
      previous = bWindow.previousSibling;
      break;
    }
    bWindow = bWindow.previousSibling;
  }
  if (previous) {
    fCursor = previous.id.split ('_')[1];
    js_highlightFCursor (previous);
    js_scrollToElement (previous);
  }
  else {
    var last = feeds.lastChild;
    if (last && last.style.display != 'block') {
      while (last.previousSibling) {
	last = last.previousSibling;
	if (last.style.display == 'block')
	  break;
      }
    }
    if (last) {
      fCursor = last.id.split ('_')[1];
      js_highlightFCursor ();
      js_scrollToElement (GID ('bWindow_' + fCursor));
    }
  }
  if (from != fCursor)
    js_resetBCursor ();
}

function js_highlightFCursor (win) {
  if (win)
    WindowSystem.zerofocus (win);
  else if (fCursor)
    WindowSystem.zerofocus (GID ('bWindow_' + fCursor));
}

function js_findBWindowEntries (node) {
  var children = node.getElementsByTagName ('*');
  var elems = new Array ();
  for (var i = 0; i < children.length; i++) {
    if (children[i].className == 'entryLink' &&
	children[i].parentNode.parentNode.style.display != 'none') {
      elems[elems.length] = children[i];
    }
  }
  return elems;
}

function js_findActiveModules (node) {
  var children = node.getElementsByTagName ('*');
  var elems = new Array ();
  for (var i = 0; i < children.length; i++) {
    if (children[i].className == 'module' &&
	children[i].style.display != 'none') {
      elems[elems.length] = children[i];
    }
  }
  return elems;
}

function js_decodeEntities (s) {
  s = s.replace (/&amp;lt;/g, '&#60;');
  s = s.replace (/&amp;gt;/g, '&#62;');
  s = s.replace (/&amp;/g, '&');
  s = s.replace (/&lt;/g, '<');
  s = s.replace (/&gt;/g, '>');
  s = s.replace (/&rsquo;/g, "'");
  return s;
}

function js_encodeSD (s) {
  s = s.replace (/:/g, '&colon;');
  s = s.replace (/\'/g, '&rsquo;');
  return s;
}

function js_writeCookie (name, value, days) {
  var expires = '';
  if (days) {
    var date = new Date ();
    date.setTime (date.getTime () + (days * 86400000));
    var expires = '; expires=' + date.toGMTString ();
  }
  document.cookie = name +'='+ value + expires + '; path=/';
}

function js_readCookie (name) {
  var nameEq = name + '=';
  var ca = document.cookie.split (';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt (0) == ' ')
      c = c.substring (1, c.length);
    if (c.indexOf (nameEq) == 0)
      return c.substring (nameEq.length, c.length);
  }
  return null;
}

function js_rbug (msg) {
  var xh = js_initHouseholdCleanser ();
  if (!xh) return null;
  try {
    xh.open ('POST', 'bug', true);
    xh.onreadystatechange = function () {
      if (xh.readyState == 4) xh = null;
    }
    xh.setRequestHeader ('Content-Type', 'application/x-www-form-urlencoded');
    xh.send ('msg=' + encodeURIComponent (msg));
  } catch (e) {}
}

function js_error (e) {
  alert (js_decodeEntities (e));
}

function js_stderr (e) {
  js_rbug (e);
  if (!errorNotifier) {
    errorNotifier = GID ('errorNotifier');
    if (errorNotifier) {
      errorNotifier.innerHTML = '<img src="images/notifier.png" alt="!" />';
      errorNotifier.onclick = js_openEWindow;
    }
  }
  if (errorNotifier && errorNotifier.style.display == 'none')
    errorNotifier.style.display = 'inline';
  if (!eWindowContent)
    eWindowContent = GID ('eWindowContent');
  if (eWindowContent) {
    eWindowContent.innerHTML += ('> ' + e + '<br>');
    eWindowContent.scrollTop = eWindowContent.scrollHeight;
  }
}

String.prototype.trim = function () {
  return this.replace (/^\s+|\s+$/g, '');
};

function js_popupBlocked () {
  alert (_('A popup blocker may be preventing Cheetah News from opening the page.')+'\n'+
	 _('If you have a popup blocker, try disabling it to open the window.'));
}

function js_sprintf () {
  if (!arguments || arguments.length < 1 || !RegExp)
    return;

  var str = arguments[0];
  var re = /([^%]*)%(.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|d|s)(.*)/;
  var a = [], nsubsts = 0;
  while (a = re.exec (str)) {
    var leftpart = a[1], pPad = a[2], pJustify = a[3], pMinLength = a[4];
    var pPrecision = a[5], pType = a[6], rightPart = a[7];

    if (pType == '%')
      subst = '%';
    else {
      nsubsts++;
      if (nsubsts >= arguments.length)
	alert ('sprintf error: not enough function arguments');

      var param = arguments[nsubsts];
      var pad = '';
      if (pPad && pPad.substr (0, 1) == "'")
	pad = leftpart.substr (1, 1);
      else if (pPad)
	pad = pPad;
      var justifyRight = true;
      if (pJustify && pJustify === '-')
	justifyRight = false;
      var minLength = -1;
      if (pMinLength)
	minLength = parseInt (pMinLength);

      var subst = param;
      if (pType == 'd')
	subst = parseInt (param) ? parseInt (param) : 0;
      else if (pType == 's')
	subst = param;
    }
    str = leftpart + subst + rightPart;
  }
  return str;
}
