/*
   Cheetah News JS/v1 Filter
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

Modules.Filter = new function () {

  var foundTotalCnt = 0;
  var foundEntryCnt = 0;
  var hiddenEntryCnt = 0;
  var excluded = new Object ();
  var dialog = null;
  var notifier = null;

  this.init = function () {
    dialog = GID ('filterDialog');
    GID ('filterText').innerHTML = _('Filter');
    GID ('filterForm').onsubmit = function () {
      GID ('filterMsg').innerHTML = _('filtering...');
      var phrase = GID ('filterInput').value.trim ().toLowerCase ();
      setTimeout (function () {
	  js_filterEntries (phrase);
	  if (js_getStyle (sWindow, 'position') != 'fixed') {
	    window.scrollTo (0, 0);
	    js_popUp (dialog);
	  }
	  GID ('filterMsg').innerHTML = js_sprintf (ngettext ('%d entry', '%d entries',
							      foundTotalCnt), foundTotalCnt); }, 100);
      return false;
    };
    return true;
  };

  this.js_shortcut = function () {
    js_openDialog ();
  };

  function js_openDialog () {
    GID ('filterMsg').innerHTML = '';
    js_popUp (dialog);
    dialog.style.display = 'block';
    document.onkeypress = null;
    document.onkeydown = js_dialogKShortcutsHandler;
    document.onclick = js_closeDialog;
    js_setCaretToEnd (GID ('filterInput'));
  }

  function js_closeDialog () {
    document.onclick = null;
    dialog.style.display = 'none';
    js_initAllKShortcuts ();
  }

  function js_dialogKShortcutsHandler (e) {
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;
    if (code == 27) { /* esc */
      js_closeDialog ();
      return false;
    }
    return true;
  }

  function js_filterEntries (phrase) {
    foundTotalCnt = 0;
    if (cheetahData != null) {
      for (var feedid in cheetahData.feeds) {
	if (GID ('bWindow_' + feedid).style.display == 'block' || excluded[feedid]) {
	  var bWindowContent = GID ('bWindowContent_' + feedid);
	  foundEntryCnt = 0;
	  hiddenEntryCnt = 0;
	  js_traverseDOM (bWindowContent, filterTraverser, [feedid, phrase]);
	  if (foundEntryCnt == 0) {
	    GID ('bWindow_' + feedid).style.display = 'none';
	    excluded[feedid] = true;
	  }
	  else {
	    GID ('bWindow_' + feedid).style.display = 'block';
	    delete excluded[feedid];
	  }
	  if (hiddenEntryCnt) {
	    var bWindowFiltered = GID ('bWindowFiltered_' + feedid);
	    bWindowFiltered.innerHTML = '&nbsp;&nbsp;[' + _('filtered') + ']';
	    bWindowFiltered.title = _('Remove filtering');
	    bWindowFiltered.style.display = 'inline';
	    bWindowFiltered.onmousedown = function () {
	      var feedid = this.id.split ('_')[1];
	      js_resetFilter (feedid);
	      this.style.display = 'none';
	      if (fCursor == feedid)
		js_resetBCursor ();
	      var fltCnt = 0;
	      for (var feedid in cheetahData.feeds) {
		if (GID ('bWindowFiltered_' + feedid).style.display == 'inline')
		  fltCnt++;
	      }
	      if (fltCnt == 0 && js_length (excluded) == 0)
		js_closeNotifier ();
	      return false;
	    };
	  }
	  else
	    GID ('bWindowFiltered_' + feedid).style.display = 'none';
	}
      }
      fCursor = js_findTopOpenFeed ();
      js_highlightFCursor ();
      js_resetBCursor ();
    }
    if (phrase != '')
      js_showNotifier ();
    else
      js_closeNotifier ();
  }

  function js_resetFilter (feedid) {
    var bWindowContent = GID ('bWindowContent_' + feedid);
    foundEntryCnt = 0;
    js_traverseDOM (bWindowContent, filterTraverser, [feedid, '']);
    delete excluded[feedid];
  }

  function js_resetFilterAllFeeds () {
    if (cheetahData && cheetahData.feeds) {
      for (var feedid in cheetahData.feeds) {
	if (excluded[feedid])
	  GID ('bWindow_' + feedid).style.display = 'block';
 	js_resetFilter (feedid);
	GID ('bWindowFiltered_' + feedid).style.display = 'none';
      }
      GID ('filterInput').value = '';
      js_closeNotifier ();
    }
    fCursor = js_findTopOpenFeed ();
    js_highlightFCursor ();
    js_resetBCursor ();
    js_jumpToTop ();
    return false;
  }

  function filterTraverser (n, args) {
    var feedid = args[0];
    var phrase = args[1];
    if (n.className == 'entryLink') {
      var eid = n.id.split ('_')[1];
      if (phrase == '') {
	GID ('entry_' + eid).style.display = 'block';
	foundTotalCnt++;
	foundEntryCnt++;
      }
      else if (n.innerHTML.toLowerCase().indexOf (phrase) == -1 &&
	       GID ('ebi_' + eid).innerHTML.toLowerCase().indexOf (phrase) == -1) {
	GID ('entry_' + eid).style.display = 'none';
	hiddenEntryCnt++;
      }
      else {
	GID ('entry_' + eid).style.display = 'block';
	foundTotalCnt++;
	foundEntryCnt++;
      }
    }
  }

  function js_showNotifier () {
    if (!notifier) {
      notifier = document.createElement ('DIV');
      notifier.id = 'filterNotifier';
      notifier.innerHTML = _('Remove filtering');
      notifier.title = _('Remove filtering from all feeds');
      notifier.onmousedown = js_resetFilterAllFeeds;
      document.body.appendChild (notifier);
    }
    notifier.style.display = 'block';
    if (js_getStyle (sWindow, 'position') != 'fixed') {
      notifier.style.bottom = 'auto';
      js_stickyNotifier ();
    }
    else {
      notifier.style.top = 'auto';
      notifier.style.bottom = '0px';
    }
  }

  function js_stickyNotifier () {
    notifier.style.top = (js_getWindowHeight () + js_getScrollY ()
			  - notifier.offsetHeight) + 'px';
    if (notifier.style.display != 'none')
      setTimeout (js_stickyNotifier, 100);
  }

  function js_closeNotifier () {
    if (notifier)
      notifier.style.display = 'none';
  }
}
