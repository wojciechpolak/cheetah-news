/*
   Cheetah News JS/v1 OPML
   Copyright (C) 2005, 2006 Wojciech Polak.

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

Modules.OPML = new function () {

  var transformerOPML = null;

  this.init = function () {
    js_prepareLink ('feedDirectoryLink', _('Feed Directory'), '', js_openFeedDirectory);
    js_prepareLink ('popularFeedsLink', _('Popular Feeds (Cheetah)'), '', js_openPopularFeeds);
    return true;
  }

  function js_openPopularFeeds () {
    if (!js_checkOnline ()) return false;
    js_initFeedArea ();
    js_initOPML (js_getPopularFeeds);
    return false;
  }

  function js_openFeedDirectory () {
    if (!js_checkOnline ()) return false;
    js_initFeedArea ();
    js_initOPML (js_getFeedDirectory);
    return false;
  }

  function js_initFeedArea () {
    var pf = GID ('popularFeeds');
    pf.innerHTML = '&nbsp;' + _('Loading...');
    pf.style.display = 'block';
    js_fixPFeedsHeight ();
  }

  function js_initOPML (cb) {
    if (transformerOPML) {
      cb (); return;
    }
    var xh = js_initHouseholdCleanser ();
    if (!xh) return;
    try {
      xh.open ('GET', 'd?q=op', true);
      xh.setRequestHeader ('X-Referer', 'CNA');
      xh.onreadystatechange = function () {
	if (xh.readyState == 4) {
	  if (xh.status == 200) {
	    transformerOPML = new Transformer (xh);
	    cb ();
	  }
	  else {
	    js_stderr ('initOPML Error: ' + xh.status +': '+ xh.statusText);
	  }
	  xh = null;
	}
      };
      xh.send (null);
    } catch (e) {
      js_stderr ('initOPML Error:' + e.name +': '+ e.message);
    }
  }

  function js_getOPML (file, cb) {
    var xh = js_initHouseholdCleanser ();
    if (!xh) return;
    try {
      xh.open ('GET', file, true);
      xh.setRequestHeader ('X-Referer', 'CNA');
      xh.onreadystatechange = function() {
	if (xh.readyState == 4) {
	  if (xh.status == 200) {
	    js_transformOPML (xh.responseXML);
	  }
	  else {
	    js_stderr ('getOPML Error: ' + xh.status + ': ' + xh.statusText);
	  }
	  xh = null;
	}
      }
      xh.send (null);
    } catch (e) {
      js_stderr ('getOPML Error:' + e.name +': '+ e.message);
    }
  }

  function js_getFeedDirectory () {
    js_getOPML ('d?q=dir');
  }

  function js_getPopularFeeds () {
    js_getOPML ('d?q=popular');
  }

  function js_transformOPML (xmlDocument) {
    try {
      var pf = GID ('popularFeeds');
      pf.innerHTML = js_decodeEntities (transformerOPML.transform (xmlDocument));
      js_traverseDOM (pf, prepareOutline, null);
    }
    catch (e) {
      js_stderr ('transformOPML Error: ' + e.name +': '+ e.message);
    }
  }

  function prepareOutline (n, args) {
    if (n.className == 'outline')
      n.onmousedown = js_toggleOutline;
    else if (n.className == 'outlink') {
      n.title = js_sprintf (_('Subscribe to %s'), n.innerHTML);
      n.onclick = js_validateIFeed;
    }
    else if (n.className == 'popularCount') {
      n.innerHTML = '';
      /*
      var count = parseInt (n.innerHTML);
      n.innerHTML = '&nbsp;('
	+ js_sprintf (ngettext ('%d subscriber', '%d subscribers', count), count) + ')';
      */
    }
  }

  function js_validateIFeed () {
    var addURL = GID ('addURL');
    var addOPML = GID ('addOPML');
    if (addURL.style.display == 'none') {
      addOPML.style.display = 'none';
      addURL.style.display = 'block';
    }
    js_validateFeed (this.getAttribute ('url'));
  }

  function js_toggleOutline () {
    var attr = this.getAttribute ('id');
    var id = attr.split ('_')[1];
    var lv = parseInt (attr.split ('_')[2]) + 1;
    var ol = document.getElementById ('outline_' + id +'_'+ lv);
    if (ol) {
      if (ol.style.display == 'none') {
	ol.style.display = 'block';
	for (var i = 0; i < ol.childNodes.length; i++) {
	  var l1 = ol.childNodes[i];
	  if (l1 != null && l1 != '') {
	    for (var j = 0; j < l1.childNodes.length; j++) {
	      var l2 = l1.childNodes[j];
	      if (l2.tagName == 'IMG') {
		var osrc = l2.getAttribute ('osrc');
		if (osrc) l2.src = osrc;
	      }
	    }
	  }
	}
      }
      else
	ol.style.display = 'none';
    }
    return false;
  }
}
