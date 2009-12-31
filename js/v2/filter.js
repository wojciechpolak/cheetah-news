/*
   Cheetah News JS/v2 Filter
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
	  filterEntries (phrase);
	  if (getStyle (sWindow, 'position') != 'fixed') {
	    window.scrollTo (0, 0);
	    popUp (dialog);
	  }
	  GID ('filterMsg').innerHTML = sprintf (ngettext ('%d entry', '%d entries',
							   foundTotalCnt), foundTotalCnt); }, 100);
      return false;
    };
    return true;
  };

  this.shortcut = function () {
    openDialog ();
  };

  function openDialog () {
    GID ('filterMsg').innerHTML = '';
    popUp (dialog);
    dialog.style.display = 'block';
    document.onkeypress = null;
    document.onkeydown = dialogKShortcutsHandler;
    $(document).bind ('click', closeDialog);
    setCaretToEnd (GID ('filterInput'));
  }

  function closeDialog () {
    $(document).unbind ('click', closeDialog);
    document.onkeydown = null;
    document.onkeypress = kShortcutsHandler;
    dialog.style.display = 'none';
  }

  function dialogKShortcutsHandler (e) {
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;
    if (code == 27) { /* esc */
      closeDialog ();
      return false;
    }
    return true;
  }

  function filterEntries (phrase) {
    foundTotalCnt = 0;
    if (cheetahData != null) {
      for (var feedid in cheetahData.feeds) {
	if (GID ('bWindow_' + feedid).style.display == 'block' || excluded[feedid]) {
	  var bWindowContent = GID ('bWindowContent_' + feedid);
	  foundEntryCnt = 0;
	  hiddenEntryCnt = 0;
	  traverseDOM (bWindowContent, filterTraverser, [feedid, phrase]);
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
	      resetFilter (feedid);
	      this.style.display = 'none';
	      if (fCursor == feedid)
		resetBCursor ();
	      var fltCnt = 0;
	      for (var feedid in cheetahData.feeds) {
		if (GID ('bWindowFiltered_' + feedid).style.display == 'inline')
		  fltCnt++;
	      }
	      if (fltCnt == 0 && length (excluded) == 0)
		closeNotifier ();
	      return false;
	    };
	  }
	  else
	    GID ('bWindowFiltered_' + feedid).style.display = 'none';
	}
      }
      fCursor = findTopOpenFeed ();
      highlightFCursor ();
      resetBCursor ();
    }
    if (phrase != '')
      showNotifier ();
    else
      closeNotifier ();
  }

  function resetFilter (feedid) {
    var bWindowContent = GID ('bWindowContent_' + feedid);
    foundEntryCnt = 0;
    traverseDOM (bWindowContent, filterTraverser, [feedid, '']);
    delete excluded[feedid];
  }

  function resetFilterAllFeeds () {
    if (cheetahData && cheetahData.feeds) {
      for (var feedid in cheetahData.feeds) {
	if (excluded[feedid])
	  GID ('bWindow_' + feedid).style.display = 'block';
 	resetFilter (feedid);
	GID ('bWindowFiltered_' + feedid).style.display = 'none';
      }
      GID ('filterInput').value = '';
      closeNotifier ();
    }
    fCursor = findTopOpenFeed ();
    highlightFCursor ();
    resetBCursor ();
    jumpToTop ();
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

  function showNotifier () {
    if (!notifier) {
      notifier = document.createElement ('DIV');
      notifier.id = 'filterNotifier';
      notifier.innerHTML = _('Remove filtering');
      notifier.title = _('Remove filtering from all feeds');
      notifier.onmousedown = resetFilterAllFeeds;
      document.body.appendChild (notifier);
    }
    notifier.style.display = 'block';
    if (getStyle (sWindow, 'position') != 'fixed') {
      notifier.style.bottom = 'auto';
      stickyNotifier ();
    }
    else {
      notifier.style.top = 'auto';
      notifier.style.bottom = '0px';
    }
  }

  function stickyNotifier () {
    notifier.style.top = (getWindowHeight () + getScrollY ()
			  - notifier.offsetHeight) + 'px';
    if (notifier.style.display != 'none')
      setTimeout (stickyNotifier, 100);
  }

  function closeNotifier () {
    if (notifier)
      notifier.style.display = 'none';
  }
}
