/*
   Cheetah News JS/v2 Core
   Copyright (C) 2005-2011, 2013 Wojciech Polak.

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
var previewUrl = null;
var allToggle = false;
var cursor = 0;
var fCursor = null;
var sWindowCursor = null;
var bWindowCursor = null;
var bWindowTopEntries = null;
var Modules = {};

function GID (x) {
  return document.getElementById (x);
}

function init () {
  try {
    initGui ();
  } catch (e) {
    stderr ('initGui Error: ' + e.name +': '+ e.message);
    return;
  }
  document.onkeypress = kShortcutsHandler;
  run ();
  setInterval (updateScrollZerofocus, 1000);
  window.status = '';
}

function kShortcutsHandler (e) {
  var code;
  if (!e) var e = window.event;
  if (e.keyCode) code = e.keyCode;
  else if (e.which) code = e.which;
  if (e.ctrlKey || e.metaKey || e.altKey)
    return true;

  switch (code) {
    case 101: /* e */
      if (cheetahData != null && fCursor !== null)
	closeFeed (fCursor);
      break;
    case 97: /* a */
      if (allToggle) {
	hideAll ();
	resetBCursor ();
	cursor = 0;
	WindowSystem.focus (sWindow);
      }
      else {
	showAllActive ();
	cursor = 1;
      }
      break;
    case 65: /* A */
      showAllLoaded ();
      cursor = 1;
      break;
    case 106: /* j */
      if (cursor == 1) {
	if (fCursor !== null) {
	  if (bWindowTopEntries == null)
	    bWindowTopEntries = findBWindowEntries (GID ('bWindowContent_' + fCursor));
	  if (bWindowTopEntries.length > 0)
	    bWindowCursorForward ();
	  else
	    bWindowTopEntries = null;
	}
      }
      else if (cursor == 0 && sWindow.style.display != 'none') {
	sWindowCursorForward ();
	if (sWindowCursor == null) break;
	var sWindowCursorPos = msie ? findPosY (sWindowCursor) : sWindowCursor.offsetTop;
	if (sWindowCursorPos > (sWindow.clientHeight - 30))
	  sWindowFeeds.scrollTop = sWindowCursorPos - 200;
	else
	  sWindowFeeds.scrollTop = 0;
      }
      break;
    case 107: /* k */
      if (cursor == 1) {
	if (fCursor !== null) {
	  if (bWindowTopEntries == null)
	    bWindowTopEntries = findBWindowEntries (GID ('bWindowContent_' + fCursor));
	  if (bWindowTopEntries.length > 0)
	    bWindowCursorBackward ();
	  else
	    bWindowTopEntries = null;
	}
      }
      else if (cursor == 0 && sWindow.style.display != 'none') {
	sWindowCursorBackward ();
	if (sWindowCursor == null) break;
	var sWindowCursorPos = msie ? findPosY (sWindowCursor) : sWindowCursor.offsetTop;
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
	  unhighlightBCursor (bWindowTopEntries[bWindowCursor]);
	if (sWindowCursor == null)
	  sWindowCursorForward ();
	highlightSCursor (sWindowCursor);
	if (main.style.height == 'auto')
	  scrollToElement (sWindow);
	cursor = 0;
      }
      break;
    case 108: /* l */
    case 76: /* L */
      if (fCursor !== null) {
	WindowSystem.zerofocus (GID ('bWindow_' + fCursor));
	if (bWindowCursor != null && bWindowTopEntries != null) {
	  highlightBCursor (bWindowTopEntries[bWindowCursor]);
	  if (bWindowCursor == 0)
	    scrollToElement (GID ('bWindow_' + fCursor));
	  else
	    scrollToElement (bWindowTopEntries[bWindowCursor]);
	}
	else
	  scrollToElement (GID ('bWindow_' + fCursor));
	cursor = 1;
      }
      break;
    case 74: /* J */
      if (cursor == 1)
	fCursorForward ();
      break;
    case 75: /* K */
      if (cursor == 1)
	fCursorBackward ();
      break;
    case 100: /* d */
      if (Modules.Notes && cursor == 1) {
	if (fCursor !== null && bWindowCursor != null && bWindowTopEntries != null) {
	  var eid = bWindowTopEntries[bWindowCursor].id.split ('_')[1];
	  var el = GID ('el_' + eid);
	  var link = GID ('linkMore_' + eid);
	  if (el && link)
	    Modules.Notes.addBookmark (el.innerHTML, link.href);
	}
	return false;
      }
      break;
    case 120: /* x */
      if (cursor == 1) {
	if (fCursor !== null && bWindowCursor != null && bWindowTopEntries != null) {
	  var link = GID ('linkMore_' + bWindowTopEntries[bWindowCursor].id.split ('_')[1]);
	  if (link) {
	    if (msie)
	      link.click ();
	    else {
	      var w = window.open (link.href, link.href);
	      if (!w) popupBlocked ();
	    }
	  }
	}
      }
      else if (cursor == 0 && sWindow.style.display != 'none') {
	resetBCursor ();
	openCategoryUnderSCursor (false);
	cursor = 1;
      }
      break;
    case 88: /* X */
      if (cursor == 0 && sWindow.style.display != 'none') {
	resetBCursor ();
	openCategoryUnderSCursor (true);
	cursor = 1;
      }
      break;
    case 13: /* enter */
      if (cursor == 1) {
	if (fCursor !== null)
	  toggleItemUnderBCursor ();
      }
      else if (cursor == 0 && sWindow.style.display != 'none')
	openItemUnderSCursor (e.shiftKey);
      break;
    case 115: /* s */
      if (sWindow.style.display == 'none')
	openSWindow ();
      else
	closeSWindow ();
      break;
    case 102: /* f */
      if (Modules.Filter) {
	Modules.Filter.shortcut ();
	return false;
      }
      break;
    case 99: /* c */
      if (cursor == 0)
	collapseFolders ();
      else if (fCursor !== null) {
	var bw = GID ('bWindowContent_' + fCursor);
	if (bw && fCursor != 'fb')
	  traverseDOM (bw, ecEntries, false);
	scrollToElement (GID ('bWindow_' + fCursor));
      }
      break;
    case 114: /* r */
      refreshVisible ();
      break;
    case 98: /* b */
      if (Modules.Notes)
 	Modules.Notes.shortcut ();
      break;
    case 119: /* w */
      if (Modules.Weather)
 	Modules.Weather.shortcut ();
      break;
    case 117: /* u */
      if (Modules.Marker && cursor == 1) {
	if (fCursor !== null && bWindowCursor != null && bWindowTopEntries != null) {
	  var eid = bWindowTopEntries[bWindowCursor].id.split ('_')[1];
	  if (eid)
	    Modules.Marker.markAsUnread (eid);
	}
      }
      break;
    case 109: /* m */
      if (Modules.Marker && cursor == 1) {
	if (fCursor !== null && bWindowCursor != null && bWindowTopEntries != null) {
	  var eid = bWindowTopEntries[bWindowCursor].id.split ('_')[1];
	  if (eid)
	    Modules.Marker.markAsRead (eid);
	}
      }
      break;
    case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56:
      if (Modules.Weather.isVisible ()) {
	var nbr = code - 49;
	$('#weLocationsNames .weatherLocationTitle:eq('+ nbr +')').click ();
      }
      break;
  }
  return true;
}

function run () {
  try {
    fetchUserData (initData);
  } catch (e) {
    stderr ('Cheetah Runtime Error: ' + e.name +': '+ e.message);
  }
}

function isOnline () {
  if (typeof navigator.onLine != 'undefined' && navigator.onLine == false)
    return false;
  return true;
}

function checkOnline () {
  if (!isOnline ()) {
    alert (_('Your browser is working offline!'));
    return false;
  }
  return true;
}

function initHouseholdCleanser () {
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

function timeoutAXML (xh, feedid) {
  if (xh != null && xh.readyState > 0 && xh.readyState < 4) {
    xh.abort ();
    var fw = GID ('feedWaiting_' + feedid);
    if (fw)
      fw.innerHTML = _('Timeout Error!');
    if (feedid != 0)
      updateProgressBar (calcProgress (++feedCnt, totalFeeds));
  }
}

if ((!hasXSLT || CONF.fbe == 'google') && typeof google != 'undefined')  {
  var fetchAXML = function (feedid, latest, expand, url) {
    var feed = new google.feeds.Feed (url);
    feed.setNumEntries (20);
    if (hasXSLT) {
      feed.setResultFormat (google.feeds.Feed.XML_FORMAT);
      feed.load (function (result) {
	  if (!result.error) {
	    $(result.xmlDocument).find ('content, encoded, content\\:encoded, description').
	      each (function () {
		  $(this).text ($(this).text().replace (/src=\"/g, 'osrc="'));
		});
	    transformFeed (result.xmlDocument, feedid, latest, expand);
	  }
	  else {
	    var feedWaiting = GID ('feedWaiting_' + feedid);
	    if (feedWaiting) feedWaiting.innerHTML = _('error');
	  }
	});
    }
    else {
      feed.setResultFormat (google.feeds.Feed.JSON_FORMAT);
      feed.load (function (result) {
	  if (!result.error) {
	    transformJsonFeed (result.feed, feedid, latest, expand);
	  }
	  else {
	    var feedWaiting = GID ('feedWaiting_' + feedid);
	    if (feedWaiting) feedWaiting.innerHTML = _('error');
	  }
	});
    }
  }
}
else {
  var fetchAXML = function (feedid, latest, expand, url) {
    var xh = initHouseholdCleanser ();
    var to = null;
    if (!xh) return;
    try {
      if (feedid != 0)
	xh.open ('GET', 'fetch?feedid=' + feedid, true);
      else {
	xh.open ('GET', 'fetch?feedurl=' + encodeURIComponent (url), true);
      }
      xh.onreadystatechange = function () {
	if (xh.readyState == 4) {
	  var xhs = false;
	  if (to) clearTimeout (to);
	  try { xhs = xh.status ? true : false; } catch (e) {};
	  if (xhs) {
	    if (xh.status == 200) {
	      if (xh.responseXML)
		transformFeed (xh.responseXML, feedid, latest, expand);
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
		  transformFeed (rx, feedid, latest, expand);
		else {
		  rbug ('fetchAXML Error (feed ' + feedid +', null): '
			   + xh.getAllResponseHeaders () +'\n'+ xh.responseText);
		  var feedWaiting = GID ('feedWaiting_' + feedid);
		  if (feedWaiting) feedWaiting.innerHTML = _('error');
		}
	      }
	    }
	    else if (xh.status == 0); /* IE */
	    else
	      stderr ('fetchAXML Error (feed ' + feedid +'): '+
			 xh.status +': '+ xh.statusText);
	  }
	  xh = null;
	}
      };
      xh.send (null);
      to = setTimeout (function () { timeoutAXML (xh, feedid); }, 60000);
    } catch (e) {
      stderr ('fetchAXML Error: ' + e.name +': '+ e.message);
    }
  }
}

var sendIntv = null;
function sendX (url, data, ret, cb, fail) {
  var xh = initHouseholdCleanser ();
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
	      stderr ('sendX Error: ' + xh.status + ': ' + xh.statusText);
	  }
	}
	xh = null;
      }
    }
    xh.setRequestHeader ('Content-Type', 'application/x-www-form-urlencoded');
    xh.send (data);
    return xh;
  } catch (e) {
    stderr ('sendX Error: ' + e.name +': '+ e.message);
  }
}

function fetchUserData (cb) {
  return sendX ('fetch', 'gs=1', 0, cb, null);
}

function mdb (data, cb, fail) {
  data += '&sid=' + encodeURIComponent (readCookie ('cheetah'));
  return sendX ('mdb', data, 1, cb, fail);
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
    this.transform = function (data, cb) {
      return cb (data);
    }
  }
}

function initXSLT (cb) {
  var xh = initHouseholdCleanser ();
  if (!xh) return;
  try {
    xh.open ('GET', dsp ('tr'), true);
    xh.onreadystatechange = function () {
      if (xh.readyState == 4) {
	if (xh.status == 200) {
	  transformerFeed = new Transformer (xh);
	  cb ();
	}
	else {
	  stderr ('initXSLT Error: ' + xh.status + ': ' + xh.statusText);
	}
	xh = null;
      }
    };
    xh.send (null);
  } catch (e) {
    stderr ('initXSLT Error: ' + e.name +': '+ e.message);
  }
}

function transformFeed (xmlDocument, feedid, latest, expand) {
  try {
    var bWindowContent = GID ('bWindowContent_' + feedid);
    transformerFeed.setParameter ('FEEDID', feedid);
    transformerFeed.setParameter ('LATEST', latest);
    transformerFeed.setParameter ('EXPAND', expand);
    transformerFeed.setParameter ('ORDERBY', cheetahData.oldf ? 'descending' : 'ascending');
    if (msie) {
      var x = decodeEntities (transformerFeed.transform (xmlDocument));
      x = x.replace (new RegExp ('(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)', 'img'), '');
      x = x.replace (new RegExp ('(?:<style.*?>)((\n|\r|.)*?)(?:<\/style>)', 'img'), '');
      x = x.replace (/<iframe/ig, '&#60;iframe');
      x = x.replace (/<\/iframe/ig, '&#60;/iframe');
      x = x.replace (/<textarea/ig, '&#60;textarea');
      x = x.replace (/href=\"\//ig, 'relative="yes" href="/');
      x = x.replace (/osrc=\"\//g, 'relative="yes" osrc="/');
      bWindowContent.innerHTML = hParser.slice_and_fix (x, 'span', 'id="ebi_', '<!--/span_ebi-->');
      x = null;
    }
    else {
      var x = decodeEntities (transformerFeed.transform (xmlDocument));
      x = x.replace (new RegExp ('(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)', 'img'), '');
      x = x.replace (new RegExp ('(?:<style.*?>)((\n|\r|.)*?)(?:<\/style>)', 'img'), '');
      x = x.replace (/<textarea/ig, '&#60;textarea');
      bWindowContent.innerHTML = hParser.slice_and_fix (x, 'span', 'id="ebi_', '<!--/span_ebi-->');
      var clr = document.createElement ('DIV');
      clr.style.clear = 'both';
      bWindowContent.appendChild (clr);
    }

    GID ('bWindowFiltered_' + feedid).style.display = 'none';
    if (feedid != 0)
      updateProgressBar (calcProgress (++feedCnt, totalFeeds));
    var feedWaiting = GID ('feedWaiting_' + feedid);

    if (xmlStatus (xmlDocument)) {
      feedWaiting.innerHTML = _('error');
    }
    else {
      feedWaiting.style.display = 'none';
      if (feedid != 0)
	GID ('aps_' + feedid).className = 'feedLoaded';
      traverseDOM (bWindowContent, prepareEntry, feedid);
      convertMediaLinks (bWindowContent);

      if (feedid == 0) {
	var subd = false;
	if (previewUrl.charAt (previewUrl.length - 1) == '/')
	  previewUrl = previewUrl.substring (0, previewUrl.length - 1);
	for (var id in cheetahData.feeds) {
	  if (cheetahData.feeds[id][5] == previewUrl)
	    subd = true;
	}
	if (!subd) {
	  var subs_button = DCE ('button', {id: 'bWindow_0_subscribe'}, [_('Subscribe')]);
	  subs_button.onclick = subscribePreviewFeed;
	  var subs_status = DCE ('span', {id: 'bWindow_0_substatus', className: 'statusBar'});
	  subs_status.style.display = 'none';
	  var subs = DCE ('div', {id: 'bWindow_0_unsubscribed', className:'unsubscribed'},
			  [DCE ('span', {}, [_('You are not subscribed to this feed.')]),
			   document.createTextNode (' '),
			   subs_button,
			   document.createTextNode (' '),
			   subs_status]);
	  $('.channelOptions', bWindowContent).after (subs);
	}
      }

      $(bWindowContent).delegate ('span.entryLink', 'mousedown', ecItem);
    }
  }
  catch (e) {
    var feedWaiting = GID ('feedWaiting_' + feedid);
    if (feedWaiting) feedWaiting.innerHTML = _('error');
    rbug ('transformFeed Error (feed ' + feedid +'): '+ e.name +': '+ e.message);
  }
}

function transformJsonFeed (json, feedid, latest, expand) {
  if (json) {
    var bWindowContent = GID ('bWindowContent_' + feedid);
    bWindowContent.innerHTML = '';

    bWindowContent.appendChild (DCE ('div', {className:'channelOptions'},
				     [DCE ('a', {id:'cl_'+feedid, className:'channelLink',
					     href:json.link, target:json.link,
					     title:'[External link]'},
					 [DCE ('img', {className:'img-elink', src:'images/t.gif'})]),
				       DCE ('span', {id:'emax_'+feedid, className:'emax',
					     count:json.entries.length})]));

    for (var i = 0; i < json.entries.length; i++) {
      if (i >= latest) continue;
      var entry = json.entries[i];
      var entryId = feedid + i;
      entry.content = entry.content.replace (/src=\"/g, 'osrc="');

      var linkSave = DCE ('span', {eid:entryId, className:'linkSave',
				   desc:entry.title});
      linkSave.setAttribute ('href', entry.link);

      var body = DCE ('div', {className:'entryBody', id:'eb_'+entryId},
		      [DCE ('span', {id:'ebi_'+entryId}, [entry.content]),
		       DCE ('div', {className:'entryMeta'},
			    [DCE ('span', {className:'entryMore'},
				  [DCE ('a', {id:'linkMore_'+entryId, className:'linkMore',
					    href:entry.link, target:entry.link})]),
			     document.createTextNode (String.fromCharCode (160) +
						      String.fromCharCode (160) +
						      String.fromCharCode (160)),
			     DCE ('span', {eid:entryId, className:'linkShare',
				      href:entry.link, desc:entry.title}),
			     document.createTextNode (String.fromCharCode (160) +
						      String.fromCharCode (160) +
						      String.fromCharCode (160)),
			     linkSave])]);

      if (i >= expand) body.style.display = 'none';
      bWindowContent.appendChild (DCE ('div', {id:'entry_'+entryId, entrylang:'en'},
       [DCE ('div', {className:'entryTitle'},
	     [DCE ('span', {className:'entryLink', id:'el_'+entryId},
		   [entry.title.stripTags ()]),
	      document.createTextNode (' '),
	      DCE ('span', {className:'entryDate'},
		   ['('+ entry.publishedDate +')'])]),
	body]));
    }

    GID ('bWindowFiltered_' + feedid).style.display = 'none';
    if (feedid != 0)
      updateProgressBar (calcProgress (++feedCnt, totalFeeds));
    var feedWaiting = GID ('feedWaiting_' + feedid);
    feedWaiting.style.display = 'none';
    if (feedid != 0)
      GID ('aps_' + feedid).className = 'feedLoaded';
    traverseDOM (bWindowContent, prepareEntry, feedid);

    if (feedid == 0) {
      var subd = false;
      for (var id in cheetahData.feeds) {
	if (cheetahData.feeds[id][5] == previewUrl)
	  subd = true;
      }
      if (!subd) {
	var subs_button = DCE ('button', {id: 'bWindow_0_subscribe'}, [_('Subscribe')]);
	subs_button.onclick = subscribePreviewFeed;
	var subs_status = DCE ('span', {id: 'bWindow_0_substatus', className: 'statusBar'});
	subs_status.style.display = 'none';
	var subs = DCE ('div', {id: 'bWindow_0_unsubscribed', className:'unsubscribed'},
			[DCE ('span', {}, [_('You are not subscribed to this feed.')]),
			 document.createTextNode (' '),
			 subs_button,
			 document.createTextNode (' '),
			 subs_status]);
	$('.channelOptions', bWindowContent).after (subs);
      }
    }

    $(bWindowContent).delegate ('span.entryLink', 'mousedown', ecItem);
  }
}

function setRefreshRate () {
  if (reloadIntv)
    clearInterval (reloadIntv);
  if (cheetahData.frequency > 0)
    reloadIntv = setInterval (refresh, 60000 * cheetahData.frequency);
}

function initData (data) {
  try {
    eval (data);
  } catch (e) {
    stderr ('initData: ' + e.name +': '+ e.message);
  }

  if (cheetahData != null) {
    progressBar.style.display = 'none';
    setRefreshRate ();
    initXSLT (loadFeeds);
  }
  for (var module in Modules) {
    var rs = Modules[module].init ();
    if (!rs)
      delete Modules[module];
  }
}

function reinitData (data) {
  var cdp = cheetahData;
  try {
    eval (data);
  } catch (e) {
    stderr ('reinitData: ' + e.name +': '+ e.message);
  }
  if (cheetahData != null) {
    setRefreshRate ();
    loadSWindow ();

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

    var previewfeed = GID ('bWindow_0');
    feeds.insertBefore (previewfeed, feeds.firstChild);

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
	  var latest  = cheetahData.feeds[feedid][2];
	  var expand  = cheetahData.feeds[feedid][3];
	  var feedurl = cheetahData.feeds[feedid][5];
	  feedWaiting (feedid);
	  fetchAXML (feedid, latest, expand, feedurl);
	}
      }
    }

    totalFeeds = countActiveFeeds (cheetahData.feeds);
    if (feedCnt > totalFeeds)
      feedCnt = totalFeeds;
  }
  cdp = null;
}

function feedWaiting (feedid) {
  var fw = GID ('feedWaiting_' + feedid);
  if (fw) {
    fw.innerHTML = _('fetching data...');
    fw.style.display = 'block';
  }
}

function clearSelection () {
  try {
    if (window.getSelection)
      window.getSelection().removeAllRanges ();
    else if (document.selection)
      document.selection.empty ();
  } catch (e) {}
}

function length (obj) {
  var c = 0;
  for (var i in obj) c++;
  return c;
}

function countActiveFeeds (cfeeds) {
  var c = 0;
  for (var feedid in cfeeds) {
    if (cfeeds[feedid][4]) c++;
  }
  return c;
}

var lastFolder = null;

function appendFolder (id, desc, itr) {
  var cont = document.createElement ('DIV');
  cont.id = 'sWindowFolder_' + id;
  cont.className = 'sWindowFolder';
  var link = document.createElement ('SPAN');
  link.id  = 'ec_' + id;
  link.innerHTML = desc;
  link.className = 'link';
  var ef = document.createElement ('SPAN');
  ef.id = 'ef_' + id;
  ef.innerHTML = msie ? '&raquo;' : '&rArr;';
  ef.className = 'ilink';
  ef.title = _('Open feeds from this folder');
  ef.onmousedown = openICategoryFeed;
  ef.onmouseover = styleLink;
  ef.onmouseout  = styleILink;
  cont.innerHTML = '<img id="fImage_'+
    id +'" class="img-16-folderclose" src="images/t.gif" width="16" height="16" alt="(F)">&nbsp;';
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
  GID ('fImage_' + id).onmousedown = ecIFolder;
  GID ('ec_' + id).onmousedown = ecIFolder;
}

function ecIFolder () {
  unhighlightSCursor (sWindowCursor);
  ecFolder (this.id.split ('_')[1]);
  return false;
}

function ecFolder (folderid) {
  if (msie) clearSelection ();
  var folder = GID ('folder_' + folderid);
  if (folder.className == 'folderCollapsed') {
    folder.className = 'folderExpanded';
    folder.style.display = 'block';
    GID ('fImage_' + folderid).className = 'img-16-folderopen';
  }
  else {
    folder.className = 'folderCollapsed';
    folder.style.display = 'none';
    GID ('fImage_' + folderid).className = 'img-16-folderclose';
  }
}

function collapseFolders () {
  if (msie) clearSelection ();
  unhighlightSCursor (sWindowCursor);
  if (!cheetahData) return;
  for (var id in cheetahData.folders) {
    var folder = GID ('folder_' + id);
    if (folder.className != 'folderCollapsed') {
      folder.className = 'folderCollapsed';
      folder.style.display = 'none';
      GID ('fImage_' + id).className = 'img-16-folderclose';
    }
  }
  sWindowFeeds.scrollTop = 0;
  return false;
}

function expandFolders () {
  if (msie) clearSelection ();
  unhighlightSCursor (sWindowCursor);
  if (!cheetahData) return;
  for (var id in cheetahData.folders) {
    var folder = GID ('folder_' + id);
    if (folder.className != 'folderExpanded') {
      folder.className = 'folderExpanded';
      folder.style.display = 'block';
      GID ('fImage_' + id).className = 'img-16-folderopen';
    }
  }
  return false;
}

function collapseEntries () {
  var feedid = this.id.split ('_')[1];
  var bw = GID ('bWindowContent_' + feedid);
  if (bw)
    traverseDOM (bw, ecEntries, false);
  return false;
}

function expandEntries () {
  var feedid = this.id.split ('_')[1];
  var bw = GID ('bWindowContent_' + feedid);
  if (bw) {
    traverseDOM (bw, prepareImages, feedid);
    traverseDOM (bw, ecEntries, true);
    scrollToElement (GID ('bWindow_' + feedid));
  }
  return false;
}

function ecEntries (n, expand) {
  if (n.tagName == 'DIV' && n.className.indexOf ('entryBody') != -1) {
    if (expand) {
      n.style.display = 'block';
      if (Modules.Marker)
	Modules.Marker.markAsRead (n.id.split ('_')[1]);
    }
    else
      n.style.display = 'none';
  }
}

function appendSWindow (feedid, desc, folderid) {
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
  GID ('open_' + feedid).onmousedown = openIFeed;
}

function loadSWindow () {
  sWindowFeeds.innerHTML = '';
  sWindowCursor = null;
  if (cheetahData != null) {
    var fldCounter = 0;
    for (var foi = 0; foi < cheetahData.folderOrder.length; foi++) {
      var name = cheetahData.folders[cheetahData.folderOrder[foi]];
      appendFolder (cheetahData.folderOrder[foi], name, false);
      fldCounter++;
    }
    if (fldCounter == 0)
      GID ('sWindowOptions').style.display = 'none';
    if (length (cheetahData.folders)) {
      var rfs = document.createElement ('P');
      rfs.id = 'rfs';
      rfs.style.fontSize = '1px';
      rfs.style.marginTop = '5px';
      sWindowFeeds.appendChild (rfs);
    }
    totalFeeds = countActiveFeeds (cheetahData.feeds);

    if (cheetahData.feedOrder.length) {
      for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
	var feedid = cheetahData.feedOrder[foi];
	var feed = cheetahData.feeds[feedid];
	appendSWindow (feedid, feed[0], feed[1]);
      }
    }
    else {
      sWindowFeeds.innerHTML = '<h4>' +
	_('No subscriptions yet?! Add new subscriptions or import them by visiting Menu/Add New Feed.') + '</h4>';
      openCWindow (1);
    }
  }
}

function loadFeeds () {
  loadSWindow ();
  createBWindow ('fb', _('Facebook News Feed'));
  createBWindow (0, _('Feed Preview'));
  for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
    var feedid = cheetahData.feedOrder[foi];
    var feed = cheetahData.feeds[feedid];
    createBWindow (feedid, feed[0]);
  }
  if (readCookie ('cheetahFeedUrl')) {
    openFeedPreview (decodeURIComponent (readCookie ('cheetahFeedUrl')));
    writeCookie ('cheetahFeedUrl', '', -1);
    refresh ();
    resetTitle ();
  }
  else if (totalFeeds) {
    refresh ();
    try {
      var hsh = window.parent.location.hash;
    } catch (e) { var hsh = ''; }
    if (hsh == '#weather' || hsh == '#' + _('weather'))
      setTimeout (Modules.Weather.shortcut, 700);
    else if (hsh == '#notes' || hsh == '#' + _('notes'))
      setTimeout (Modules.Notes.shortcut, 700);
    else if (cheetahData.safs) {
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
      fCursor = findTopOpenFeed ();
      highlightFCursor ();
    }
  }
  else
    progressBar.style.display = 'none';
}

var cgIntv = null;
function refresh () {
  if (!isOnline ()) return;
  var rc = 0;
  feedCnt = 0;
  try { top.document.title = _('loading...'); } catch (e) {}
  resetBCursor ();
  for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
    var feedid = cheetahData.feedOrder[foi];
    var latest = cheetahData.feeds[feedid][2];
    var expand = cheetahData.feeds[feedid][3];
    var active = cheetahData.feeds[feedid][4];
    if (active == 1) {
      rc++;
      feedWaiting (feedid);
      fetchAXML (feedid, latest, expand, cheetahData.feeds[feedid][5]);
    }
    else if (active == 2)
      feedCnt++;
  }
  if (!rc) resetTitle ();
  if (typeof tracker != 'undefined')
    tracker._trackEvent ('Reader', 'Refresh');
  if (msie && window.CollectGarbage) {
    if (cgIntv) clearTimeout (cgIntv);
    cgIntv = setTimeout (CollectGarbage, 1000);
  }
}

function refreshVisible () {
  if (msie) clearSelection ();
  if (!checkOnline ()) return;
  resetBCursor ();
  if (cheetahData != null) {
    for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
      var feedid = cheetahData.feedOrder[foi];
      var latest = cheetahData.feeds[feedid][2];
      var expand = cheetahData.feeds[feedid][3];
      var active = cheetahData.feeds[feedid][4];
      if (GID ('bWindow_' + feedid).style.display == 'block' && active) {
	feedCnt--;
	feedWaiting (feedid);
	fetchAXML (feedid, latest, expand, cheetahData.feeds[feedid][5]);
      }
    }
  }
  if (msie && window.CollectGarbage) {
    if (cgIntv) clearTimeout (cgIntv);
    cgIntv = setTimeout (CollectGarbage, 1000);
  }
  return false;
}

function reloadFeed () {
  if (!checkOnline ()) return;
  var feedid = this.id.split ('_')[1];
  if (feedid == 'fb') {
    Modules.Social.openFBStream ();
    return;
  }
  var fw = GID ('feedWaiting_' + feedid);
  if (fw && fw.style.display == 'none')
    feedCnt--;
  feedWaiting (feedid);
  if (feedid != 0) {
    var feed = cheetahData.feeds[feedid];
    fetchAXML (feedid, feed[2], feed[3], feed[5]);
  }
  else {
    fetchAXML (0, 10, 0, previewUrl);
  }
}

function lookupNode (node, searchFor) {
  for (var i = 0; i < node.childNodes.length; i++) {
    var n = node.childNodes[i];
    if (n.nodeType != 1)
      continue;
    if (n.nodeName == searchFor) {
      return n;
    }
    else if (n.childNodes.length) {
      var d = lookupNode (n, searchFor);
      if (d != null)
	return d;
    }
  }
}

function traverseDOM (node, cb, args) {
  for (var i = 0; i < node.childNodes.length; i++) {
    var n = node.childNodes[i];
    if (n.tagName != undefined) {
      if (n.childNodes.length) {
        cb (n, args);
        traverseDOM (n, cb, args);
      } else {
        cb (n, args);
      }
    }
  }
}

function findParentContainer (n, stop) {
  while (n.parentNode) {
    if (n.className == stop)
      return n;
    n = n.parentNode;
  }
  return n;
}

function xmlStatus (xml) {
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
    node = lookupNode (xml, 'message');
    if (node && node.firstChild && node.firstChild.nodeValue &&
	node.firstChild.nodeValue.length) {
      msg = node.firstChild.nodeValue;
    }
    return msg;
  }
  else
    return null;
}

function moveUp (me) {
  var me   = me;
  var prev = me.previousSibling;
  if (prev) {
    me.parentNode.insertBefore (me, prev);
    fnc_sChanged ();
  }
}

function moveDown (me) {
  var me   = me;
  var next = me.nextSibling;
  if (next) {
    me.parentNode.insertBefore (next, me);
    fnc_sChanged ();
  }
}

function blur () {
  this.blur ();
}

function prepareFeed (n, feedid) {
  if (n.tagName == 'SPAN') {
    var id = n.getAttribute ('id');
    if (id == 'bWindowReload_' + feedid)
      n.onclick = reloadFeed;
    else if (id == 'bWindowClose_' + feedid) {
      prepareWindowClose (n, function (obj) {
	  closeFeed (obj.id.split ('_')[1]);
	});
    }
  }
}

function prepareEntry (n, feedid) {
  if (n.tagName == 'SPAN') {
    if (n.className == 'entryLink') {
      if (n.parentNode.className.indexOf ('entryTitleTwitter') == -1)
	n.innerHTML = n.innerHTML.stripTags ();
      else
	n.innerHTML = n.innerHTML.stripTags ().createLinks ();
    }
    else if (n.className == 'linkShare') {
      if (Modules.Share)
	Modules.Share.attach (n);
      else
	n.parentNode.removeChild (n);
    }
    else if (n.className == 'linkSave') {
      if (Modules.Notes)
	Modules.Notes.attach (n);
      else
	n.parentNode.removeChild (n);
    }
    else if (n.className == 'emax') {
      n.id = 'emax_' + feedid;
      n.style.marginLeft = '1em';
      var count = parseInt (n.getAttribute ('count'));
      var crcnt = feedid != 0 ? parseInt (cheetahData.feeds[feedid][2]) : 10;
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
	feedWaiting (feedid);
	if (feedid != 0) {
	  var feed = cheetahData.feeds[feedid];
	  if (typeof feed[6] == 'undefined')
	    feed[6] = feed[2]; /* bck */
	  feed[2] = this.options[this.selectedIndex].value;
	  fetchAXML (feedid, feed[2], feed[3], feed[5]);
	}
	else {
	  fetchAXML (0, this.options[this.selectedIndex].value, 0, previewUrl);
	}
	resetBCursor ();
      };
      n.appendChild (document.createTextNode (_('stories') + ': '));
      n.appendChild (el);
      var expEntries = document.createElement ('SPAN');
      expEntries.id = 'expandEntries_' + feedid;
      expEntries.innerHTML = _('Expand');
      expEntries.className = 'ilink';
      expEntries.title = _('Expand entries');
      expEntries.onmouseover = styleLink;
      expEntries.onmouseout  = styleILink;
      expEntries.onmousedown = expandEntries;
      var colEntries = document.createElement ('SPAN');
      colEntries.id = 'collapseEntries_' + feedid;
      colEntries.innerHTML = _('Collapse');
      colEntries.title = _('Collapse entries');
      colEntries.className = 'ilink';
      colEntries.onmouseover = styleLink;
      colEntries.onmouseout  = styleILink;
      colEntries.onmousedown = collapseEntries;
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
	mr.onmouseover = styleLink;
	mr.onmouseout  = styleILink;
	mr.onmousedown = Modules.Marker.markEntriesAsRead;
	var mu = document.createElement ('SPAN');
	mu.id = 'markAsUnreadEntries_' + feedid;
	mu.innerHTML = _('Mark as unread');
	mu.title = _('Mark all entries as unread');
	mu.className = 'ilink';
	mu.onmouseover = styleLink;
	mu.onmouseout  = styleILink;
	mu.onmousedown = Modules.Marker.markEntriesAsUnread;
	n.appendChild (document.createTextNode (' | '));
	n.appendChild (mr);
	n.appendChild (document.createTextNode (' | '));
	n.appendChild (mu);
      }
      n.style.display = 'inline';
      n.style.visibility = 'hidden';
    }
  }
  else if (n.tagName == 'DIV') {
    if (n.className.indexOf ('entryTitle') != -1) {
      var dir = n.getAttribute ('dir');
      if (dir && dir == 'rtl') {
	n.style.textAlign = 'right';
	n.style.direction = 'rtl';
      }
    }
    else if (n.className.indexOf ('entryBody') != -1) {
      var dir = n.getAttribute ('dir');
      if (dir && dir == 'rtl') {
	n.style.textAlign = 'right';
	n.style.direction = 'rtl';
      }
      if (n.style.display != 'none') {
	if (Modules.Marker)
	  Modules.Marker.markAsRead (n.id.split ('_')[1]);
	traverseDOM (n, prepareImages, feedid);
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
      n.onmouseup = blur;
      if (n.firstChild.tagName == 'IMG') {
	if (n.firstChild.complete)
	  scaleLogo (n.firstChild);
	else
	  n.firstChild.onload = function () { scaleLogo (this); };
      }
    }
    else if (n.className == 'linkMore') {
      if (n.href) {
	n.href = n.href.replace (/[&\?]from=rss/, '');
	n.style.color = 'gray'; /* Gecko bug workaround */
	n.innerHTML = _('more');
	n.title = '[' + _('External link') + ']';
	n.onmouseup = blur;
      }
      else
	n.parentNode.removeChild (n);
    }
    else if (n.className == 'twitterMore') {
      n.style.color = 'gray'; /* Gecko bug workaround */
      n.innerHTML = _('more');
      n.title = '[' + _('External link') + ']';
      n.target = n.href;
      n.onmouseup = blur;
    }
    else if (n.className == 'linkThumbnail') {
      var flash = n.getAttribute ('flash');
      if (flash) {
	n.title = _('See enclosed multimedia');
	n.onclick = function () {
	  Greybox.open ({src: n.href, width:560, height:340, type:'swf'});
	  this.blur ();
	  return false;
	};
      }
      else {
	if (/^http:\/\/.*\.static.flickr.com\/.*$/.test (n.href)) {
	  n.href = n.href.replace (/_s\.jpg$/, '_d.jpg');
	}
	n.title = _('See enclosed image');
	n.onclick = function () {
	  Greybox.open ({src: n.href});
	  this.blur ();
	  return false;
	};
      }
    }
    else {
      var anchor = n.getAttribute ('href');
      if (anchor) {
	var rel = n.getAttribute ('relative');
	if (anchor.indexOf ('//') == 0) {
	  /* continue */
	}
	else if (anchor.charAt (0) == '/' || (rel && rel == 'yes')) {
	  var cl = GID ('cl_' + feedid);
	  if (cl) {
	    var pathname = '';
	    if (msie && rel && n.pathname)
	      pathname = n.pathname;
	    else
	      pathname = anchor.substr (1);
	    n.href = getUrlDomain (cl.href) + pathname;
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
	    n.href = getUrlDomain (cl.href) + pathname;
	  }
	}
      }
      n.onfocus = null;
      n.onblur = null;
      n.onclick = null;
      n.ondblclick = null;
      n.onmouseup = null;
      n.onmousedown = null;
      n.onmouseover = null;
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
      n.onmouseup = blur;
    }
  }
}

function getUrlDomain (url) {
  var i = 0;
  if (url.indexOf ('http://') == 0)
    i = 7;
  else if (url.indexOf ('https://') == 0)
    i = 8;
  var urlDomain = url.substring (0, url.indexOf ('/', i));
  if (!urlDomain) urlDomain = url;
  return urlDomain + '/';
}

function scaleLogo (img) {
  var maxHeight = 65;
  if (img.height > maxHeight)
    img.height = maxHeight;
}

function ecItem (e) {
  if (!e) var e = window.event;
  if (msie) clearSelection ();
  var id = this.id.split('_')[1];
  var eb = GID ('eb_' + id);
  if (eb) {
    if (eb.style.display == 'none') {
      var feedid = eb.parentNode.parentNode.id.split ('_')[1];
      if (Modules.Marker)
	Modules.Marker.markAsRead (id);
      traverseDOM (eb, prepareImages, feedid);
      if (typeof e != 'undefined' && e.ctrlKey) {
	var link = GID ('linkMore_' + id);
	if (link) {
	  if (msie)
	    link.click ();
	  else {
	    var w = window.open (link.href, link.href);
	    if (!w) popupBlocked ();
	  }
	}
      }
      else {
	eb.style.display = 'block';
	scrollToElement (this);
      }
    }
    else
      eb.style.display = 'none';
  }
  return false;
}

function scrollToElement (t, obj) {
  if (main.style.height == 'auto' && !obj)
    obj = document.documentElement;
  else if (!obj)
    obj = main;
  if (obj != document.documentElement) {
    var divOffset = $(obj).offset().top;
    var pOffset = $(t).offset().top - 15;
    var pScroll = pOffset - divOffset;
    $(obj).animate ({scrollTop: '+=' + pScroll + 'px'}, 200);
  }
  else {
    var tOffset = $(t).offset().top;
    $('html,body').animate ({scrollTop: tOffset}, 200);
  }
}

function jumpToTop () {
  main.scrollTop = 0;
}

function prepareImages (n, feedid) {
  if (n.tagName == 'IMG' || n.tagName == 'EMBED') {
    var osrc = n.getAttribute ('osrc');
    if (osrc) {
      var rel = n.getAttribute ('relative');
      if (osrc.indexOf ('//') == 0) {
	/* continue */
      }
      else if (osrc.charAt (0) == '/' || (rel && rel == 'yes')) {
	var cl = GID ('cl_' + feedid);
	if (cl) {
	  var pathname = '';
	  if (msie && rel && n.pathname)
	    pathname = n.pathname;
	  else
	    pathname = osrc.substr (1);
	  osrc = getUrlDomain (cl.href) + pathname;
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
	  osrc = getUrlDomain (cl.href) + pathname;
	}
      }
      n.src = osrc;
      if (n.parentNode.tagName == 'A' &&
	  n.parentNode.href.match (/(\.jpg$|\.png$|\.gif$)/i)) {
	if (n.parentNode.href.indexOf ('blogspot.com') == -1) {
	  n.parentNode.onclick = function () {
	    var s = n.parentNode.href;
	    if (n.parentNode.href.indexOf ('wojciechpolak.org') != -1)
	      s = s.replace (/photos\//, 'photos/data/');
	    n.parentNode.title = _('See enclosed image');
	    Greybox.open ({src: s});
	    this.blur ();
	    return false;
	  };
	}
      }
      n.removeAttribute ('osrc');
    }
  }
  else if (n.tagName == 'IFRAME') {
    var osrc = n.getAttribute ('osrc');
    if (osrc)
      n.src = osrc;
  }
}

function openIFeed (e) {
  if (!e) var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation ();
  resetBCursor ();
  openFeed (this.id.split ('_')[1], e.shiftKey);
  return false;
}

function openFeed (feedid, append) {
  if (!checkOnline ()) return;
  unhighlightSCursor (sWindowCursor);
  /* check for passive feeds */
  var feed = cheetahData.feeds[feedid];
  if (feed[4] == 0) {
    feedWaiting (feedid);
    totalFeeds++;
    feed[4] = 2; /* semi-active */
    fetchAXML (feedid, feed[2], feed[3], feed[5]);
  }
  var bWindow = GID ('bWindow_' + feedid);
  if (!bWindow) {
    createBWindow (feedid, feed[0]);
    bWindow = GID ('bWindow_' + feedid);
  }
  if (!append)
    hideAll ();
  fCursor = feedid;
  bWindow.style.display = 'block';
  var open = GID ('open_' + feedid);
  if (open) {
    open.className = 'linkb';
    open.setAttribute ('pclassName', 'linkb');
  }
  highlightFCursor (bWindow);
  if (append)
    scrollToElement (bWindow);
  else
    jumpToTop ();
  cursor = 1;
  return false;
}

function closeFeed (feedid) {
  if (feedid === null) return;
  GID ('bWindow_' + feedid).style.display = 'none';
  var openedFeedsCnt = 0;
  if (feedid == fCursor)
    fCursorForward ();
  if (feedid !== 0) {
    var open = GID ('open_' + feedid);
    if (open) {
      open.className = 'link';
      open.setAttribute ('pclassName', 'link');
    }
    for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
      var feedid = cheetahData.feedOrder[foi];
      if (GID ('bWindow_' + feedid).style.display == 'block')
	openedFeedsCnt++;
    }
  }
  if (openedFeedsCnt == 0) {
    allToggle = false;
    cursor = 0;
    WindowSystem.focus (sWindow);
  }
}

function openFeedPreview (url, title) {
  if (!checkOnline ()) return;
  unhighlightSCursor (sWindowCursor);
  hideAll ();
  previewUrl = url;
  GID ('bWindowContent_0').innerHTML = '';
  feedWaiting (0);
  if (!title)
    title = url;
  if (title.length > 80)
    title = title.substr (0, 80) + '...';
  title = title.replace (/:[a-zA-Z0-9\-_]+@/, ':***@');
  GID ('bWindowTitle_0').innerHTML = sprintf (_('Feed Preview: %s'), title);
  var bWindow = GID ('bWindow_0');
  bWindow.style.display = 'block';
  fetchAXML (0, 10, 0, url);
  fCursor = 0;
  highlightFCursor (bWindow);
  scrollToElement (bWindow);
  cursor = 1;
}

function openICategoryFeed (e) {
  if (!e) var e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation ();
  openCategoryFeed (this.id.split ('_')[1], e.shiftKey);
  return false;
}

function openCategoryFeed (folderid, append) {
  if (!checkOnline ()) return;
  unhighlightSCursor (sWindowCursor);
  if (!append)
    hideAll ();
  var first = null;
  for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
    var feedid = cheetahData.feedOrder[foi];
    var feed = cheetahData.feeds[feedid];    
    if (feed[1] == folderid) {
      if (!first)
	first = feedid;
      /* check for passive feeds */
      if (feed[4] == 0) {
	feedWaiting (feedid);
	totalFeeds++;
	feed[4] = 2; /* semi-active */
	fetchAXML (feedid, feed[2], feed[3], feed[5]);
      }
      GID ('bWindow_' + feedid).style.display = 'block';
      var open = GID ('open_' + feedid);
      open.className = 'linkb';
      open.setAttribute ('pclassName', 'linkb');
    }
  }
  if (!append) {
    jumpToTop ();
    fCursor = findTopOpenFeed ();
  }
  else if (first) {
    fCursor = first;
    scrollToElement (GID ('bWindow_' + fCursor));
  }
  highlightFCursor ();
  cursor = 1;
  return false;
}

function calcProgress (i, totalFeeds) {
  if (totalFeeds > 0)
    return parseInt (100 * i / totalFeeds);
  else
    return 0;
}

function updateProgressBar (s) {
  if (progressBar.style.display == 'none') {
    progressBar.style.display = 'inline';
    if (intv) clearInterval (intv);
    intv = setInterval (hideProgressBar, 90000);
  }
  if (feedCnt >= totalFeeds) {
    if (intv) clearInterval (intv);
    intv = setInterval (hideProgressBar, 5000);
  }
  if (s < 0) s = 0;
  else if (s > 100) s = 100;
  try { progressBar.innerHTML = top.document.title = _('progress') +' '+ s + '%'; } catch (e) {}
  if (feedCnt >= totalFeeds) resetTitle ();
}

function hideProgressBar () {
  progressBar.style.display = 'none';
  clearInterval (intv);
  resetTitle ();
}

function resetTitle () {
  try { top.document.title = 'Cheetah News'; } catch (e) {}
}

var lastScrollTop = 0;
function updateScrollZerofocus () {
  var y = 0;
  if (bWindowCursor == null &&
      main.scrollTop != lastScrollTop) {
    lastScrollTop = main.scrollTop;
    for (var i = 0; i < feeds.childNodes.length; i++) {
      var bWindow = feeds.childNodes[i];
      if (bWindow.style.display != 'none' &&
	  (bWindow.offsetTop - y + 15) >= lastScrollTop &&
	  (bWindow.offsetTop - y + 40) < (lastScrollTop + getWindowHeight ())) {
	WindowSystem.zerofocus (bWindow);
	break;
      }
    }
  }
}

function showAllActive () {
  if (msie) clearSelection ();
  hideAll ();
  unhighlightSCursor (sWindowCursor);
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
  fCursor = findTopOpenFeed ();
  if (!fCursor) {
    alert (_("You don't have any active feeds. Active feeds are automatically loaded at startup. You can set them in Menu/Manage Subscriptions."));
    allToggle = false;
  }
  else
    highlightFCursor ();
  jumpToTop ();
  return false;
}

function showAllLoaded () {
  if (msie) clearSelection ();
  unhighlightSCursor (sWindowCursor);
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
  fCursor = findTopOpenFeed ();
  highlightFCursor ();
  jumpToTop ();
  return false;
}

function hideAll () {
  if (msie) clearSelection ();
  resetBCursor ();
  fCursor = null;
  cursor = 0;
  allToggle = false;
  Modules.Social.hideAll ();
  GID ('bWindow_0').style.display = 'none'; /* preview */
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

function findTopOpenFeed () {
  for (var foi = 0; foi < cheetahData.feedOrder.length; foi++) {
    var feedid = cheetahData.feedOrder[foi];
    if (GID ('bWindow_' + feedid).style.display == 'block')
      return feedid;
  }
  return null;
}

function sWindowCursorForward () {
  if (sWindowCursor == null) {
    sWindowCursor = sWindowFeeds.firstChild;
    highlightSCursor (sWindowCursor);
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
    unhighlightSCursor (prePos);
    highlightSCursor (sWindowCursor);
  }
}

function sWindowCursorBackward () {
  if (sWindowCursor == null) {
    sWindowCursor = sWindowFeeds.lastChild;
    highlightSCursor (sWindowCursor);
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
    unhighlightSCursor (prePos);
    highlightSCursor (sWindowCursor);
  }
}

function openItemUnderSCursor (append) {
  if (sWindowCursor == null) return;
  if (sWindowCursor.className == 'sWindowFeed') {
    resetBCursor ();
    openFeed (sWindowCursor.id.split ('_')[1], append);
  }
  else if (sWindowCursor.className == 'sWindowFolder') {
    ecFolder (sWindowCursor.id.split ('_')[1]);
  }
}

function openCategoryUnderSCursor (append) {
  if (sWindowCursor == null) return;
  if (sWindowCursor.className == 'sWindowFolder') {
    openCategoryFeed (sWindowCursor.id.split ('_')[1], append);
  }
  else /* uhm */
    openItemUnderSCursor (append);
}

function highlightSCursor (cur) {
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

function unhighlightSCursor (cur) {
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

function highlightBCursor (cur) {
  if (cur) {
    cur.style.backgroundColor = 'Highlight';
    cur.style.color = 'HighlightText';
  }
}

function unhighlightBCursor (cur) {
  if (cur) {
    cur.style.backgroundColor = 'white';
    cur.style.color = 'black';
  }
}

function resetBCursor () {
  if (bWindowCursor != null && bWindowTopEntries != null)
    unhighlightBCursor (bWindowTopEntries[bWindowCursor]);
  bWindowCursor = null;
  bWindowTopEntries = null;
}

function bWindowCursorForward () {
  var prePos = bWindowCursor;
  if (bWindowCursor != null && bWindowCursor >= (bWindowTopEntries.length - 1)) {
    bWindowCursor = null;
    unhighlightBCursor (bWindowTopEntries[prePos]);
    prePos = null;
  }
  if (bWindowCursor == null)
    bWindowCursor = 0;
  if (prePos != null) {
    unhighlightBCursor (bWindowTopEntries[prePos]);
    bWindowCursor++;
  }
  highlightBCursor (bWindowTopEntries[bWindowCursor]);
  if (bWindowCursor == 0)
    scrollToElement (GID ('bWindow_' + fCursor));
  else
    scrollToElement (bWindowTopEntries[bWindowCursor]);
}

function bWindowCursorBackward () {
  var prePos = bWindowCursor;
  if (bWindowCursor != null && bWindowCursor <= 0) {
    bWindowCursor = null;
    unhighlightBCursor (bWindowTopEntries[prePos]);
    prePos = null;
  }
  if (bWindowCursor == null)
    bWindowCursor = bWindowTopEntries.length - 1;
  if (prePos != null) {
    unhighlightBCursor (bWindowTopEntries[prePos]);
    bWindowCursor--;
  }
  highlightBCursor (bWindowTopEntries[bWindowCursor]);
  scrollToElement (bWindowTopEntries[bWindowCursor]);
}

function toggleItemUnderBCursor () {
  if (bWindowCursor != null && bWindowTopEntries != null) {
    ecItem.call (bWindowTopEntries[bWindowCursor]);
  }
}

function fCursorForward () {
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
    highlightFCursor (next);
    scrollToElement (next);
  }
  else {
    fCursor = findTopOpenFeed ();
    if (fCursor) {
      highlightFCursor ();
      scrollToElement (GID ('bWindow_' + fCursor));
    }
  }
  if (from != fCursor)
    resetBCursor ();
}

function fCursorBackward () {
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
    highlightFCursor (previous);
    scrollToElement (previous);
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
      highlightFCursor ();
      scrollToElement (GID ('bWindow_' + fCursor));
    }
  }
  if (from != fCursor)
    resetBCursor ();
}

function highlightFCursor (win) {
  if (win)
    WindowSystem.zerofocus (win);
  else if (fCursor)
    WindowSystem.zerofocus (GID ('bWindow_' + fCursor));
}

function findBWindowEntries (node) {
  var children = node.getElementsByTagName ('span');
  var elems = [];
  for (var i = 0; i < children.length; i++) {
    if (children[i].className == 'entryLink' &&
	children[i].parentNode.parentNode.style.display != 'none') {
      elems[elems.length] = children[i];
    }
  }
  return elems;
}

function decodeEntities (s) {
  s = s.replace (/&amp;lt;/g, '&#60;');
  s = s.replace (/&amp;gt;/g, '&#62;');
  s = s.replace (/&amp;/g, '&');
  s = s.replace (/&lt;/g, '<');
  s = s.replace (/&gt;/g, '>');
  s = s.replace (/&rsquo;/g, "'");
  return s;
}

function encodeSD (s) {
  s = s.replace (/:/g, '&colon;');
  s = s.replace (/\'/g, '&rsquo;');
  return s;
}

function writeCookie (name, value, days) {
  var expires = '';
  if (days) {
    var date = new Date ();
    date.setTime (date.getTime () + (days * 86400000));
    var expires = '; expires=' + date.toGMTString ();
  }
  document.cookie = name +'='+ value + expires + '; path=/';
}

function readCookie (name) {
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

function rbug (msg) {
  var xh = initHouseholdCleanser ();
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

function error (e) {
  alert (decodeEntities (e));
}

function stderr (e) {
  rbug (e);
  if (!errorNotifier) {
    errorNotifier = GID ('errorNotifier');
    if (errorNotifier) {
      errorNotifier.innerHTML = '<img class="img-16-notifier" src="images/t.gif" width="16" height="16" alt="!" />';
    }
  }
  if (errorNotifier && errorNotifier.style.display == 'none')
    errorNotifier.style.display = 'inline';
}

String.prototype.trim = function () {
  return this.replace (/^\s+|\s+$/g, '');
};

String.prototype.stripTags = function () {
  return this.replace (/<\/?[^>]+>/gi, '');
}

function popupBlocked () {
  alert (_('A popup blocker may be preventing Cheetah News from opening the page.')+'\n'+
	 _('If you have a popup blocker, try disabling it to open the window.'));
}

function sprintf () {
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

var MDOM = {
  'getWindowHeight' : function () {
    if (typeof window.innerHeight != 'undefined')
      return window.innerHeight;
    else if (document.documentElement && 
	     typeof document.documentElement.clientHeight != 'undefined' &&
	     document.documentElement.clientHeight != 0)
      return document.documentElement.clientHeight;
    else if (document.body && typeof document.body.clientHeight != 'undefined')
      return document.body.clientHeight;
    return 0;
  },
  'getDocumentHeight' : function () {
    if (document.documentElement && 
	typeof document.documentElement.scrollHeight != 'undefined' &&
	document.documentElement.scrollHeight != 0)
      return document.documentElement.scrollHeight;
    return 0;
  },
  'getScrollY' : function () {
    if (document.body && document.body.scrollTop)
      return document.body.scrollTop;
    else if (document.documentElement && document.documentElement.scrollTop)
      return document.documentElement.scrollTop;
    return 0;
  },
  'getStyle' : function (x, styleProp) {
    if (document.defaultView && document.defaultView.getComputedStyle)
      return document.defaultView.getComputedStyle (x, null).getPropertyValue (styleProp);
    else if (x.currentStyle)
      return x.currentStyle[styleProp];
    return null;
  },
  'center' : function (obj, objWidth, objHeight) {
    var innerWidth = 0;
    var innerHeight = 0;
    if (!objWidth && !objHeight) {
      if (opera || safari) obj.style.display = 'block';
      objWidth  = $(obj).width ();
      objHeight = $(obj).height ();
      if (objWidth == '0px' || objWidth == 'auto') {
	objWidth = obj.offsetWidth + 'px';
	objHeight = obj.offsetHeight + 'px';
      }
      if (objHeight.indexOf ('px') == -1) {
	obj.style.display = 'block';
	objHeight = obj.clientHeight;
      }
      objWidth = parseInt (objWidth);
      objHeight = parseInt (objHeight);
    }
    if (window.innerWidth) {
      innerWidth  = window.innerWidth / 2;
      innerHeight = window.innerHeight / 2;
    }
    else if (document.body.clientWidth) {
      innerWidth  = $(window).width () / 2;
      innerHeight = $(window).height () / 2;
    }
    var wleft = innerWidth - (objWidth / 2);
    if (wleft < 0) wleft = 0;
    obj.style.left = wleft + 'px';
    obj.style.top  = $(document).scrollTop () + innerHeight - (objHeight/2) + 'px';
    if (parseInt (obj.style.top) < 1)
      obj.style.top = '1px';
  },
  'findPosX' : function (obj) {
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
  },
  'findPosY' : function (obj) {
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
  },
  'clearSelection' : function () {
    try {
      if (window.getSelection)
	window.getSelection().removeAllRanges ();
      else if (document.selection)
	document.selection.empty ();
    } catch (e) {}
  }
}

var Overlay = new function () {
  var visible = false;
  var ovl = null;
  this.enable = function () {
    if (visible) return;
    ovl = document.createElement ('DIV');
    if (ovl) {
      var dh = MDOM.getDocumentHeight ();
      var wh = MDOM.getWindowHeight ();
      ovl.id = 'overlay';
      ovl.style.position = 'absolute';
      ovl.style.width = '100%';
      ovl.style.height = ((dh > wh) ? dh : wh) + 'px';
      ovl.style.top = 0;
      ovl.style.left = 0;
      ovl.style.backgroundColor = 'black';
      ovl.style.opacity = '0.80';
      ovl.style.filter = 'alpha(opacity=80)';
      ovl.style.zIndex = '1000';
      ovl.style.display = 'block';
      document.body.appendChild (ovl);
      visible = true;
    }
  };
  this.disable = function () {
    if (ovl) {
      document.body.removeChild (ovl);
      visible = false;
    }
  };
};

var Greybox = new function () {
  var self = this;
  var gb = DCE ('div', {id: 'greybox'});
  gb.style.display = 'none';
  document.body.appendChild (gb);

  this.open = function (opts) {
    var src    = opts.src;
    var width  = opts.width || 320;
    var height = opts.height || 256;
    var type   = opts.type || undefined;
    var content = opts.content || undefined;

    if (!type) {
      if (src.match (/(\.jpg$|\.jpeg$|\.png$|\.gif$)/i))
	type = 'img';
      else if (src.indexOf ('.swf') > 0)
	type = 'swf';
    }

    Overlay.enable ();
    gb.innerHTML = '<div class="loading">' + _('Loading...') + '</div>';
    if (typeof width == 'number')
      gb.style.width = width + 'px';
    else
      gb.style.width = width;
    if (typeof height == 'number')
      gb.style.height = height + 'px';
    else
      gb.style.height = height;
    gb.style.position = 'absolute';
    MDOM.center (gb, $(gb).width (), $(gb).height ());
    gb.style.display = 'block';

    GID ('overlay').onclick = this.close;
    document.onkeydown = function (e) {
      var code;
      if (!e) var e = window.event;
      if (e.keyCode) code = e.keyCode;
      else if (e.which) code = e.which;
      if (code == 27) { /* esc */
	self.close ();
	return false;
      }
      return true;
    };

    if (type == 'img') {
      var img = new Image ();
      img.src = src;
      img.onerror = this.close;
      if (img.complete)
	showImage.call (img);
      else
	img.onload = showImage;
    }
    else if (type == 'embed') {
      gb.innerHTML = content;
    }
    else if (type == 'swf') {
      gb.innerHTML = '<object type="application/x-shockwave-flash" '
      + 'width="'+ width +'" height="'+ height +'" data="'+ src +'">'
      + '<param name="movie" value="'+ src +'"/>'
      + '<param name="allowFullScreen" value="true"/>'
      + '<param name="allowScriptAccess" value="never"/>'
      + '<param name="quality" value="best"/>'
      + '</object>';
    }
    else if (type == 'inline') {
      var c = GID (content);
      if (c) gb.innerHTML = c.innerHTML;
    }
  }

  this.close = function () {
    gb.style.display = 'none';
    gb.innerHTML = '';
    Overlay.disable ();
    document.onkeypress = kShortcutsHandler;
  }

  function showImage () {
    if (gb.style.display != 'block')
      return;
    var img = this;
    var maxWidth = $(window).width () - 50;
    if (img.width > maxWidth) {
      var nscale = maxWidth / img.width;
      img.width  = maxWidth;
      img.height = img.height * nscale;
    }
    var maxHeight = $(window).height () - 50;
    if (img.height > maxHeight) {
      var nscale = maxHeight / img.height;
      img.height = maxHeight;
      img.width  = img.width * nscale;
    }
    MDOM.center (gb, img.width, img.height);
    $(gb).animate ({width: img.width + 'px', height: img.height + 'px'}, 500, function () {
	gb.innerHTML = '';
	gb.appendChild (img);
      });
  }
}

function play_video () {
  var p = this.id.indexOf ('-');
  if (p == -1)
    var a = [this.id];
  else
    var a = [this.id.substring (0, p), this.id.substr (p + 1)];
  var type = a[0];
  var id = a[1];

  if (type in video_embeds)
    var embed = video_embeds[type];
  else
    return true;

  $('a', this).blur ();
  Greybox.open ({type: 'embed', content: embed.code.replace (/{ID}/g, id),
	width: embed.width, height: embed.height});
  return false;
}

function convertMediaLinks (ctx) {
  $('.entryBody > span a:has(img)', ctx)
    .each (function (i) {
	if (this.parentNode.className == 'play-video')
	  return;
	var id = false;
	try {
	  if (this.href.indexOf ('http://www.youtube.com/watch') === 0)
	    id = 'youtube-' + this.href.substr (31);
	  else if (this.href.indexOf ('http://vimeo.com/') === 0)
	    id = 'vimeo-' + this.href.substr (17);
	  else if (this.href.indexOf ('http://www.collegehumor.com/video:') === 0)
	    id = 'chtv-' + this.href.substr (34);
	  else if (this.href.indexOf ('http://www.facebook.com/video/video.php?v=') === 0)
	    id = 'facebook-' + this.href.substr (42);
	  if (id) {
	    $(this).wrap ('<table class="vc"><tr><td><div id="'+ id +'" class="play-video"></div></td></tr></table>');
	    $(this).after ('<div class="playbutton"></div>');
	  }
	} catch (e) {}
      });
}

var video_embeds = {
  'youtube': {code: '<iframe width="560" height="349" src="//www.youtube.com/embed/{ID}?autoplay=1&rel=0" frameborder="0" allowfullscreen></iframe>', width: 560, height: 349},
  'vimeo': {code: '<iframe width="560" height="315" src="//player.vimeo.com/video/{ID}?autoplay=1" frameborder="0" allowfullscreen></iframe>', width: 560, height: 315},
  'chtv': {code: '<iframe width="560" height="315" src="http://www.collegehumor.com/e/{ID}?autoplay=1" frameborder="0" allowfullscreen></iframe>', width: 560, height: 315},
  'dailymotion': {code: '<iframe width="560" height="315" src="http://www.dailymotion.com/embed/video/{ID}?autoplay=1" frameborder="0"></iframe>', width: 560, height: 315},
  'metacafe': {code: '<object type="application/x-shockwave-flash" width="498" height="423" data="http://www.metacafe.com/fplayer/{ID}/video.swf"><param name="movie" value="http://www.metacafe.com/fplayer/{ID}/video.swf"/><param name="name" value="Metacafe_{ID}"/><param name="flashvars" value="playerVars=showStats=no|autoPlay=yes"/><param name="allowFullScreen" value="true"/><param name="allowScriptAccess" value="always"/></object>', width: 498, height: 423},
  'facebook': {code: '<object type="application/x-shockwave-flash" width="560" height="315" data="http://www.facebook.com/v/{ID}"><param name="movie" value="http://www.facebook.com/v/{ID}"/><param name="allowFullScreen" value="true"/><param name="allowScriptAccess" value="always"/></object>', width: 560, height: 315}
}

function registerCheetahHandler () {
  if (typeof navigator.registerContentHandler == 'function' &&
      window.location.href.indexOf ('http://www.cheetah-news.com') === 0)
    navigator.registerContentHandler ('application/vnd.mozilla.maybe.feed',
				      'http://www.cheetah-news.com/add?feedurl=%s',
				      'Cheetah News');
  else
    alert (_('Sorry, but this operation is not supported by your browser.'));
}

var hParser = new function () {
  var stack;
  var tags_empty = {'area':1,'base':1,'basefont':1,'br':1,'col':1,'frame':1,
		    'hr':1,'img':1,'input':1,'isindex':1,'link':1,'meta':1,
		    'param':1,'embed':1};

  this.slice_and_fix = function (html, stag, attrs, next) {
    var buf = [];
    var len = html.length - 1;
    var obj = this.select (html, stag, attrs, next);
    var areas = obj.areas;
    var tofix = obj.tofix;
    for (var i = 0; i < areas.length; i++) {
      var from = areas[i];
      var to = (areas[i] < len) ? areas[i+1] : html.length;
      var slice = html.slice (from, to);
      if (tofix[from] && tofix[from] == to)
	buf.push (this.fix (slice));
      else
	buf.push (slice);
    }
    return buf.join ('');
  };

  this.select = function (html, stag, attrs, next) {
    var len = html.length;
    var buf = [];
    var pos = {};
    var tag = '';
    var tag_started = false;
    var tag_closing_started = false;
    var stag_found = false;
    var stag_found_counter = 0;
    var skip = false;
    if (!attrs) attrs = '';
    if (!next) next = '';

    for (var i = 0; i < len; i++) {
      var c = html[i];
      buf.push (c);

      if (c == '<') {
	var j = i + 1;
	tag_started = true;
	tag = '';
	if (j < len && html[i+1] == '!') {
	  tag_started = false;
	  skip = true;
	}
	else if (j < len && html[i+1] == '/') {
	  tag_closing_started = true;
	  buf.push ('/');
	  i++;
	}
      }
      else if (c == '>') {
	if (skip) {
	  if ((buf[buf.length - 2] == ']' && buf[buf.length - 3] == ']') ||
	      (buf[buf.length - 2] == '-' && buf[buf.length - 3] == '-'))
 	  skip = false;
	}
	else if (buf[buf.length - 2] == '/')
	  ;
	else {
	  if (tag_closing_started && !tags_empty[tag]) {
	    if (stag_found && tag == stag) {
	      if (html.substring (i + 1, i + 1 + next.length) == next) {
		pos[stag_found_counter].push (i - tag.length - 2);
		stag_found = false;
	      }
	    }
	  }
	  else if (tag_started) {
	    arr = tag.split (' ');
	    tag = arr[0];
	    ats = arr[1] ? arr[1] : '';
	    if (!tags_empty[tag]) {
	      if (tag == stag && ats.indexOf (attrs) != -1) {
		stag_found = true;
		stag_found_counter++;
		pos[stag_found_counter] = [i+1];
	      }
	    }
	  }
	}
	tag_started = false;
	tag_closing_started = false;
      }
      else if (tag_started)
	tag += c;
    }
    var areas = [0];
    var tofix = {};
    for (var x in pos) {
      if (pos[x].length == 2) {
	tofix[pos[x][0]] = pos[x][1];
	areas.push (pos[x][0]);
	areas.push (pos[x][1]);
      }
    }
    areas.push (html.length - 1);
    return { 'areas':areas, 'tofix':tofix };
  };

  this.fix = function (html) {
    stack = [];
    var len = html.length;
    var buf = [];
    var tag = '';
    var tag_started = false;
    var tag_closing_started = false;
    var skip = false;
    var atv = false;

    for (var i = 0; i < len; i++) {
      var c = html[i];
      buf.push (c);

      if (tag_started) {
	if (c == '"') atv = !atv;
	if (atv && (c == '<' || c == '>'))
	  c = ' ';
      }

      if (c == '<') {
	var j = i + 1;
	tag_started = true;
	tag = '';
	if (j < len && html[i+1] == '!') {
	  tag_started = false;
	  skip = true;
	}
	else if (j < len && html[i+1] == '/') {
	  tag_closing_started = true;
	  buf.push ('/');
	  i++;
	}
      }
      else if (c == '>') {
	if (skip) {
	  if ((buf[buf.length - 2] == ']' && buf[buf.length - 3] == ']') ||
	      (buf[buf.length - 2] == '-' && buf[buf.length - 3] == '-'))
 	  skip = false;
	}
	else if (buf[buf.length - 2] == '/')
	  ;
	else {
	  tag = tag.toLowerCase ();
	  if (tag_closing_started && !tags_empty[tag]) {
	    var fixes = 0;
	    do {
	      var ltag = stack.pop ();
	      if (!ltag) {
		if (!fixes)
		  buf = buf.slice (0, buf.length - (3 + tag.length));
		else
		  buf = buf.slice (0, buf.length - 1);
		break;
	      }
	      if (ltag != tag) {
		if (!fixes)
		  buf = buf.slice (0, buf.length - (3 + tag.length));
		else
		  buf = buf.slice (0, buf.length - 1);
		ltag = ltag.split (' ')[0];
		buf.push ('</' + ltag + '>');
		buf.push ('</' + tag + '>');
		fixes++;
	      }
	    }
	    while (ltag != tag);
	  }
	  else if (tag_started) {
	    tag = tag.split (' ')[0].toLowerCase ();
	    if (!tags_empty[tag]) {
	      stack.push (tag);
	    }
	  }
	}
	atv = false;
	tag_started = false;
	tag_closing_started = false;
      }
      else if (tag_started)
	tag += c;
    }
    while (stack.length) {
      var ltag = stack.pop ();
      buf.push ('</' + ltag + '>');
    }
    return buf.join ('');
  };
};

function DCE (name, props, content_list) {
  var obj = document.createElement (name);
  if (obj) {
    if (props) {
      for (var p in props) {
	if (p == 'id' || p == 'className' ||
	    p == 'href' || p == 'target' ||
	    p == 'title')
	  obj[p] = props[p];
	else {
	  obj.setAttribute (p, props[p]);
	}
      }
    }
    if (content_list) {
      for (var i = 0; i < content_list.length; i++) {
	var content = content_list[i];
	if (typeof content == 'string' ||
	    typeof content == 'number')
	  obj.innerHTML = content;
	else if (typeof content == 'object')
	  obj.appendChild (content);
      }
    }
  }
  return obj;
}

function SIH (list, append) {
  for (var i in list) {
    if (typeof i == 'string')
      var obj = document.getElementById (i);
    if (obj) {
      if (append)
	obj.innerHTML += list[i];
      else
	obj.innerHTML = list[i];
    }
  }
}
