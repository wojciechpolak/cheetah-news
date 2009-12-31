/*
   Cheetah News JS/v1 Notes
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

Modules.Notes = new function () {

  var cheetahNoteTags = null;
  var cheetahNoteList = null;
  var cheetahNote = null;

  var newNoteCnt = 0;
  var win = null;
  var winInitiated = false;
  var winLoaded = false;
  var hint = null;
  var query = null;
  var lastQuery = '';
  var rcmState = false;

  this.init = function () {
    var module = GID ('moduleNotes');
    if (module && module.className == 'module') {
      win = js_createWindow ('nb', 'fWindow', _('My Notes and Bookmarks'), true);
      win.minWidth = 300;
      win.minHeight = 200;
      win.afterresize = function () {
	js_fixNbHeight ();
      };
      js_prepareLink ('Notes', _('My Notes and Bookmarks'), '', js_openWindow);
      js_prepareWindowClose (GID ('nbWindowClose'), function () {
	  js_hintOff ();
	  js_closeWindow ();
	});
      var nbXmlFeed = GID ('nbXmlFeed');
      nbXmlFeed.title = _('Your publicly visible notes and links (Atom feed)');
      nbXmlFeed.onmouseup = js_blur;
      GID ('neWindowT1').innerHTML = _('Title:');
      GID ('neWindowT2').innerHTML = _('Tags:');
      GID ('neWindowT3').innerHTML = _('Color:');
      GID ('neWindowT4').innerHTML = _('Publicly visible:');
      GID ('neWindowT5').innerHTML = _('Note (double-click or tab to edit):');
      GID ('neAccept').value = _('Save Note');
      module.style.display = 'block';
      return true;
    }
    else if (module) {
      module.style.display = 'none';
      return false;
    }
  };

  this.js_attach = function (n) {
    var eid  = n.getAttribute ('eid');
    var href = n.getAttribute ('href');
    var desc = n.getAttribute ('desc');
    if (href) {
      n.innerHTML = _('save link');
      n.title = _('Save link to this entry');
      n.onclick = function () {
	Modules.Notes.js_addBookmark (desc, href);
      }
    }
    else
      n.parentNode.removeChild (n);
  }

  this.js_addBookmark = function (title, href) {
    if (!winInitiated && !cheetahNoteTags)
      js_notes ('nt=1', js_getNoteTags, function () {});
    var neWindow = js_openNote ('N' + ++newNoteCnt);
    var neForm = GID ('ne_N' + newNoteCnt + '_Form');
    neForm.style.visibility = 'hidden';
    neForm.style.display = 'block';
    GID ('ne_N' + newNoteCnt + '_WindowTDL').className = '';
    GID ('ne_N' + newNoteCnt + '_Delicious').onclick = function () {
      var w = window.open ('http://del.icio.us/post?v=4&noui&jump=close&url=' + href + '&title='
			   + encodeURIComponent (title), 'delicious', 'toolbar=no,width=700,height=400');
      if (!w) js_popupBlocked ();
      this.blur ();
      return false;
    };
    GID ('ne_N' + newNoteCnt + '_Digg').onclick = function () {
      var w = window.open ('http://digg.com/submit?phase=2&url=' + href, 'digg', 'toolbar=no,resizable=yes,scrollbars=yes');
      if (!w) js_popupBlocked ();
      this.blur ();
      return false;
    };
    js_fixNeHeight (neWindow);
    GID ('ne_N' + newNoteCnt + '_Form').style.display = 'block';
    GID ('ne_N' + newNoteCnt + '_Title').value = title;
    GID ('ne_N' + newNoteCnt + '_Note').innerHTML = js_convertTextToHTML (decodeURIComponent (href)).createLinks ();
    GID ('ne_N' + newNoteCnt + '_Progress').style.display = 'none';
    neForm.style.visibility = 'visible';
    js_setCaretToEnd (GID ('ne_N' + newNoteCnt + '_Title'));
  }

  this.js_shortcut = function () {
    js_openWindow ();
  };

  function js_openWindow () {
    if (msie) js_clearSelection ();

    if (!winInitiated) {
      var nbCreate = GID ('nbCreate');
      nbCreate.value = _('Create Note');
      nbCreate.onclick = function () {
	var neWindow = js_openNote ('N' + ++newNoteCnt);
	var neForm = GID ('ne_N' + newNoteCnt + '_Form');
	neForm.style.visibility = 'hidden';
	neForm.style.display = 'block';
	js_fixNeHeight (neWindow);
	GID ('ne_N' + newNoteCnt + '_Note').onkeypress = js_editNote;
	GID ('ne_N' + newNoteCnt + '_Progress').style.display = 'none';
	neForm.style.visibility = 'visible';
	GID ('ne_N' + newNoteCnt + '_Title').focus ();
      };
      GID ('nbTags').innerHTML = _('Tag:');
      var nbTagSearch = GID ('nbTagSearch'); 
      js_prepareInput (nbTagSearch);
      nbTagSearch.onclick = function (e) { js_hintOn (e, this); };
      nbTagSearch.onkeypress = js_hintOff;
      GID ('nbSearch').value = _('Search');
      GID ('nbForm').onsubmit = function () {
	if (!js_checkOnline ()) return false;
	query = GID ('nbTagSearch').value.replace (/<\S[^>]*>/g, '').trim ();
	if (query != lastQuery) {
	  lastQuery = query;
	  GID ('nbProgress').innerHTML = _('Searching...');
	  js_notes ('q=' + encodeURIComponent (query),
		    js_getNoteList, js_getNoteListRecover);
	}
	return false;
      };

      win.style.width = '550px';
      var nbWindowContent = GID ('nbWindowContent');
      nbWindowContent.style.width = '540px';
      if (msie) nbWindowContent.style.height = '315px';
      if (!msie) nbWindowContent.style.overflowY = 'hidden';
      win.style.height = '350px';

      GID ('nbWindowT1').innerHTML = _('Title');
      GID ('nbWindowT2').innerHTML = _('Date');
      GID ('nbWindowT3').innerHTML = _('Public');
      winInitiated = true;
    }

    if (!winLoaded) {
      query = null;
      if (js_checkOnline ()) {
	GID ('nbProgress').innerHTML = _('Searching...');
	js_notes ('q=', js_getNoteList, js_getNoteListRecover);
      }
    }

    if (win.style.display == 'none') {
      var y = js_findPosY (GID ('Notes'));
      var st = js_getScrollY ();
      if (y == 0 || st > 0)
	js_popUp (win);
      else {
	win.style.left = bwLeft + 'em';
	win.style.top = y + 'px';
      }
      js_setupDrag (win, js_hintOff);
    }
    js_registerWindow (win);
    js_fixNbHeight ();
    return false;
  }

  function js_closeWindow () {
    GID ('nbWindowTitleBar').onmousedown = null;
    win.style.display = 'none';
    js_initAllKShortcuts ();
  }

  function js_notes (data, cb, fail) {
    return js_sendX ('xnotes', data, 0, cb, fail);
  }

  function js_countNoteList () {
    var len = js_length (cheetahNoteList);
    if (query) {
      GID ('nbProgress').innerHTML = js_sprintf (ngettext ('Found %d note tagged with "%s".',
							   'Found %d notes tagged with "%s".', len),
						 len, query);
    }
    else {
      GID ('nbProgress').innerHTML = js_sprintf (ngettext ('Found %d latest note.',
							   'Found %d latest notes.', len), len);
    }
  }

  function js_getNoteTags (data) {
    try {
      eval (data);
    } catch (e) {
      js_stderr ('getNoteTags: ' + e.name +': '+ e.message);
      return;
    }
    js_prepareNoteTags ();
  }

  function js_getNoteList (data) {
    try {
      eval (data);
    } catch (e) {
      js_stderr ('getNoteList: ' + e.name +': '+ e.message);
      return;
    }

    winLoaded = true;
    var tbody = GID ('nbNoteListBody');
    var rlen = tbody.rows.length;
    for (var i = 0; i < rlen; i++)
      tbody.deleteRow (0);
    js_countNoteList ();

    if (cheetahNoteList) {
      for (var n in cheetahNoteList) {
	var row = document.createElement ('TR');
	row.id = 'noteRow_' + n;
	row.style.height = '1.5em';
	row.style.backgroundColor = row.rgbColor = cheetahNoteList[n][0];

	td = document.createElement ('TD');
	td.innerHTML = js_decodeEntities (cheetahNoteList[n][1]);
	row.appendChild (td);

	td = document.createElement ('TD');
	td.innerHTML = cheetahNoteList[n][2];
	row.appendChild (td);

	td = document.createElement ('TD');
	td.align = 'center';
	td.innerHTML = cheetahNoteList[n][3] == 'yes' ?
	  '<img src="images/tick.png" width="12" height="12" alt="P" />' : '';
	row.appendChild (td);

	td = document.createElement ('TD');
	td.id = 'noteRowRem_' + n;
	td.align = 'center';
	td.innerHTML = '<span class="link" id="removeNote_' + n +
	  '"action="rem"><img src="images/10_remove.png" class="iremove" alt="' + _('rem') + '" /></span>';
	td.onmouseover = js_selectRow;
	td.onmouseout = js_unselectRow;
	row.appendChild (td);

	row.setAttribute ('noteid', n);
	row.onclick = js_openINote;
	tbody.appendChild (row);

	var rem = GID ('removeNote_' + n);
	if (rem) {
	  rem.title = _('Remove');
	  rem.onclick = js_removeINote;
	}
      }
    }
    js_prepareNoteTags ();
  }

  function js_selectRow () {
    GID ('noteRow_' + this.id.split ('_')[1]).style.backgroundColor = '#b9d4e5';
  }

  function js_unselectRow () {
    if (!rcmState) {
      var row = GID ('noteRow_' + this.id.split ('_')[1]);
      if (row) row.style.backgroundColor = row.rgbColor;
    }
  }

  function js_openINote () {
    var noteid = this.getAttribute ('noteid');
    if (GID ('ne_' + noteid + '_Window')) {
      WindowSystem.focus (GID ('ne_' + noteid + '_Window'));
    }
    else {
      js_notes ('nid=' + noteid,
		function (data) { js_getNote (noteid, data); },
		js_getNoteRecover);
      var neWindow = js_openNote (this.getAttribute ('noteid'));
      GID ('ne_' + noteid + '_Progress').innerHTML = _('Loading...');
      GID ('ne_' + noteid + '_Status').value = 'unchanged';
      GID ('ne_' + noteid + '_Accept').disabled = true;
    }
    return false;
  }

  function js_removeINote (e) {
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation ();
    rcmState = true;
    if (confirm (_('Are you sure you want to delete this note?')))
      js_removeNote (this.id);
    else {
      var row = GID ('noteRow_' + this.id.split ('_')[1]);
      if (row) row.style.backgroundColor = row.rgbColor;
    }
    rcmState = false;
  }

  function js_prepareNoteTags () {
    if (cheetahNoteTags) {
      hint = GID ('hintNoteTags');
      if (!hint) {
	hint = document.createElement ('DIV');
	hint.id = 'hintNoteTags';
	hint.className = 'hints';
	hint.style.display = 'none';
	document.body.appendChild (hint);
      }
      else
	hint.innerHTML = '';
      for (var i = 0; i < cheetahNoteTags.length; i++) {
	var h = document.createElement ('DIV');
	h.className = 'hintF';
	h.innerHTML = cheetahNoteTags[i];
	hint.appendChild (h);
      }
    }
  }

  function js_getNoteListRecover (status, statusText) {
    js_stderr ('getNoteList Error: ' + status +': '+ statusText);
  }

  function js_openNote (noteid) {
    if (GID ('ne_' + noteid + '_Window')) {
      WindowSystem.focus (GID ('ne_' + noteid + '_Window'));
      return;
    }
    var neWindow = js_createNeWindow ('ne_' + noteid + '_');
    js_prepareWindowClose (GID ('ne_' + noteid + '_WindowClose'), function () {
	js_hintOff ();
	neWindow.style.display = 'none';
	document.body.removeChild (neWindow);
	neWindow = null;
	js_initAllKShortcuts ();
      });
    js_popUp (neWindow);
    js_setupDrag (neWindow, js_hintOff);
    js_registerWindow (neWindow);
    neWindow.minHeight = neWindow.clientHeight > 0 ? neWindow.clientHeight : 285;
    return neWindow;
  }

  function js_createNeWindow (id) {
    var neWindow = js_createEmptyWindow (id, 'neWindow', _('Edit Window'));
    var con = GID ('neWindowContent');
    var clone = con.cloneNode (true);
    clone.id = id + 'WindowContent';
    js_traverseDOM (clone, prepareNote, id);
    neWindow.appendChild (clone);
    if (!msie && !opera) {
      var r = document.createElement ('DIV');
      r.id = id + 'Resize';
      r.style.position = 'absolute';
      r.style.bottom = '0px';
      r.style.right = '0px';
      r.style.cursor = 'se-resize';
      r.style.display = 'block';
      r.innerHTML = '<div class="seResize"></div>';
      r.onmousedown = function (e) {
	if (!e) var e = window.event;
	startResize (e, neWindow, GID (id + 'WindowContent'));
      };
      neWindow.appendChild (r);
      neWindow.minWidth = 400;
      neWindow.afterresize = function () {
	js_fixNeHeight (this);
      };
    }
    clone.style.display = 'block';
    return neWindow;
  }

  function prepareNote (n, id) {
    if (n.tagName == 'INPUT') {
      if (n.id == 'neTitle') {
	n.id = id + 'Title';
	n.onchange = function () { js_setNoteChanged (id.split ('_')[1]); };
	js_prepareInput (n);
      }
      else if (n.id == 'neTags') {
	n.id = id + 'Tags';
	n.onchange = function () { js_setNoteChanged (id.split ('_')[1]); };
	n.onclick = function (e) { js_hintOn (e, this); };
	n.onkeypress = js_hintOff;
	js_prepareInput (n);
      }
      else if (n.id == 'neId')
	n.id = id + 'Id';
      else if (n.id == 'neStatus')
	n.id = id + 'Status';
      else if (n.id == 'neColor')
	n.id = id + 'Color';
      else if (n.id == 'nePublic') {
	n.id = id + 'Public';
	n.onclick = function () { js_setNoteChanged (id.split ('_')[1]); };
      }
      else if (n.id == 'neAccept') {
	n.id = id + 'Accept';
	n.onclick = js_saveNote;
      }
    }
    else if (n.tagName == 'DIV') {
      if (n.id == 'neProgress')
	n.id = id + 'Progress';
      else if (n.id == 'neForm')
	n.id = id + 'Form';
      else if (n.id == 'neNote') {
	n.id = id + 'Note';
	n.ondblclick = js_editNote;
	n.onkeypress = js_editNote;
      }
      else if (n.className == 'colorOption') {
	n.onclick = function () {
	  js_changeNoteColor (this.getAttribute ('rgb'), id);
	};
      }
    }
    else if (n.tagName == 'SPAN') {
      if (n.id == 'neTagsHelp') {
	n.id = id + 'TagsHelp';
	n.style.cursor = 'help';
	n.title = _('Comma-separated list of tags');
      }
      else if (n.id == 'neWindowTDL') {
	n.id = id + 'WindowTDL';
      }
    }
    else if (n.tagName == 'A') {
      if (n.id == 'neDelicious')
	n.id = id + 'Delicious';
      else if (n.id == 'neDigg')
	n.id = id + 'Digg';
    }
  }

  function js_setNoteChanged (id) {
    var status = GID ('ne_' + id + '_Status');
    if (status && status.value == 'unchanged') {
      status.value = 'changed';
      GID ('ne_' + id + '_Accept').disabled = false;
    }
  }

  function js_editNote () {
    var text = this.innerHTML;
    var textarea = document.createElement ('TEXTAREA');
    textarea.id = 'ta_' + this.id;
    textarea.style.backgroundColor = this.style.backgroundColor;
    textarea.rows = 5;
    textarea.cols = 65;
    textarea.style.width = '100%';
    textarea.style.height = this.offsetHeight + 'px';
    textarea.onchange = function () { js_setNoteChanged (this.id.split ('_')[2]); };
    textarea.onclick = function (e) {
      if (!e) var e = window.event;
      e.cancelBubble = true;
      if (e.stopPropagation) e.stopPropagation ();
    };
    var wa = GID ('ne_' + this.id.split ('_')[1] + '_Accept');
    wa.value = _('Finish editing');
    wa.onclick = function () { js_saveEdit (textarea); };
    wa.disabled = false;
    GID ('ne_' + this.id.split ('_')[1] + '_WindowContent').onclick = function () {
      js_saveEdit (textarea);
    };

    var z = this.parentNode;
    z.insertBefore (textarea, this);
    z.ondblclick = null;
    z.removeChild (this);

    text = text.replace (/<br *\/?>/g, "\n");
    text = text.replace (/<\S[^>]*>/g, '');
    textarea.value = js_convertHTMLToText (text);
    textarea.focus ();
  }

  function js_saveEdit (textarea) {
    var id = textarea.id.split ('_')[2];
    var wa = GID ('ne_' + id + '_Accept');
    wa.disabled = true;
    var text = document.createElement ('DIV');
    text.id = 'ne_' + id + '_Note';
    text.className = 'neNote';
    text.style.height = textarea.offsetHeight + 'px';
    text.style.backgroundColor = GID ('ne_' + id + '_Color').value;
    text.ondblclick = js_editNote;
    text.onkeypress = js_editNote;
    text.innerHTML = js_convertTextToHTML (textarea.value).createLinks ();
    textarea.parentNode.insertBefore (text, textarea);
    textarea.parentNode.removeChild (textarea);
    wa.value = _('Save Note');
    wa.blur ();
    wa.onclick = js_saveNote;
    GID ('ne_' + id + '_WindowContent').onclick = null;
    if (GID ('ne_' + id + '_Status').value == 'unchanged')
      wa.disabled = true;
    else
      wa.disabled = false;
  }

  function js_changeNoteColor (rgb, id) {
    var color = GID (id + 'Color');
    if (color.value != rgb)
      js_setNoteChanged (id.split ('_')[1]);
    color.value = rgb;
    var wt = GID (id + 'Note');
    if (wt) wt.style.backgroundColor = rgb;
    else {
      var et = GID ('ta_' + id + 'Note');
      if (et) et.style.backgroundColor = rgb;
    }
  }

  function js_getNote (noteid, data) {
    try {
      eval (data);
    } catch (e) {
      js_stderr ('getNote: ' + e.name +': '+ e.message);
    }
    if (cheetahNote) {
      GID ('ne_' + noteid + '_Id').value = noteid;
      GID ('ne_' + noteid + '_Color').value = cheetahNote['color'];
      GID ('ne_' + noteid + '_Public').checked = (cheetahNote['public'] == 'yes' ? true : false);
      GID ('ne_' + noteid + '_Title').value = js_decodeEntities (cheetahNote['title']);
      var tags = GID ('ne_' + noteid + '_Tags');
      tags.value = '';
      for (var i = 0; i < cheetahNote['tags'].length; i++) {
	tags.value += js_decodeEntities (cheetahNote['tags'][i]);
	if (i < cheetahNote['tags'].length - 1)
	  tags.value += ', ';
      }
      var note = GID ('ne_' + noteid + '_Note');
      note.style.backgroundColor = cheetahNote['color'];
      cheetahNote['note'] = js_decodeEntities (cheetahNote['note'].replace (/<br *\/?>/g, "\n"));
      note.innerHTML = js_convertTextToHTML (cheetahNote['note']).createLinks ();

      var neForm = GID ('ne_' + noteid + '_Form');
      neForm.style.visibility = 'hidden';
      neForm.style.display = 'block';
      GID ('ne_' + noteid + '_Progress').style.display = 'none';
      js_fixNeHeight (GID ('ne_' + noteid + '_Window'));
      neForm.style.visibility = 'visible';
    }
    else {
      GID ('ne_' + noteid + '_Progress').innerHTML = _('error');
    }
  }

  function js_getNoteRecover (status, statusText) {
    js_stderr ('getNote Error: ' + status +': '+ statusText);
  }

  function js_saveNote () {
    if (!js_checkOnline ()) return;
    var sid = this.id.split ('_')[1];
    GID ('ne_' + sid + '_Accept').disabled = true;
    var snd = 'save=1';
    var title = GID ('ne_' + sid + '_Title').value;
    var tags  = GID ('ne_' + sid + '_Tags').value.trim ();
    var text  = GID ('ne_' + sid + '_Note').innerHTML;
    text = text.replace (/<br *\/?>/g, "\n");
    text = text.replace (/<\S[^>]*>/g, '');
    if (tags.length == 0) {
      alert (_('At least one tag is required.'));
      GID ('ne_' + sid + '_Accept').disabled = false;
      return;
    }
    if (title.length == 0 && text.length == 0) {
      alert (_('Empty note title and body.'));
      GID ('ne_' + sid + '_Accept').disabled = false;
      return;
    }
    else if (title.length == 0 && text.length > 0) {
      title = text.substr (0, 50);
      if (text.length > 50)
	title += '...';
    }
    else if (title.length == 0)
      title = _('No title');

    var id = GID ('ne_' + sid + '_Id');
    if (id && id.value != '')
      snd += '&nid=' + id.value;
    snd += '&color=' + encodeURIComponent (GID ('ne_' + sid + '_Color').value);
    snd += '&public='+ encodeURIComponent (GID ('ne_' + sid + '_Public').checked ? 'yes' : 'no');
    var d = new Date ();
    var date = d.getFullYear() +'-'+ (d.getMonth() + 1) +'-'+ d.getDate() +' '+
      d.getHours() +':'+ d.getMinutes() +':'+ d.getSeconds();
    snd += '&date='  + encodeURIComponent (date);
    snd += '&tags='  + encodeURIComponent (tags);
    snd += '&title=' + encodeURIComponent (title);
    snd += '&note='  + encodeURIComponent (js_convertHTMLToText (text));

    js_sendX ('xnotes', snd, 1, function (xml) { js_reloadNoteList (sid, xml); },
	      function (status, statusText) { js_saveNoteRecover (sid, status, statusText); });
  }

  function js_reloadNoteList (sid, xml) {
    var sts = js_xmlStatus (xml);
    if (sts) {
      alert (sts);
      GID ('ne_' + sid + '_Accept').disabled = false;
    }
    else {
      var neWindow = GID ('ne_' + sid + '_Window');
      if (neWindow) {
	neWindow.style.display = 'none';
	document.body.removeChild (neWindow);
	neWindow = null;
	js_initAllKShortcuts ();
      }
      js_notes ('q=' + encodeURIComponent (GID ('nbTagSearch').value),
		js_getNoteList, js_getNoteListRecover);
    }
  }

  function js_saveNoteRecover (sid, status, statusText) {
    GID ('ne_' + sid + '_Accept').disabled = false;
    js_stderr ('saveNote Error: ' + status +': '+ statusText);
  }

  function js_removeNote (id) {
    var noteid = id.split ('_')[1];
    js_sendX ('xnotes', 'rem=' + noteid, 1, function (xml) {
	js_removeNoteCheck (noteid, xml); }, js_removeNoteRecover);
  }

  function js_removeNoteRecover (status, statusText) {
    js_stderr ('removeNote Error: ' + status +': '+ statusText);
  }

  function js_removeNoteCheck (noteid, xml) {
    var sts = js_xmlStatus (xml);
    if (sts) {
      alert (sts);
    }
    else {
      GID ('nbNoteListBody').removeChild (GID ('noteRow_' + noteid));
      delete cheetahNoteList[noteid];
      js_countNoteList ();
    }
  }

  String.prototype.createLinks = function () {
    var lines = this.split ('<br>');
    for (var z = 0; z < lines.length; z++) {
      var tmp = lines[z].split (' ');
      for(var i = 0; i < tmp.length; i++) {
	if (tmp[i].indexOf ('www.') != -1 &&
	    tmp[i].indexOf ('http://') == -1)
	  tmp[i] = '<a href="http://' +tmp[i]+ '" target="'+
	    tmp[i]+'" onmouseup="this.blur()">' +tmp[i]+ '</a>';
	else if (tmp[i].indexOf ('http://') != -1 ||
		 tmp[i].indexOf ('https://') != -1 ||
		 tmp[i].indexOf ('ftp://') != -1)
	  tmp[i] = '<a href="' +tmp[i]+ '" target="'+tmp[i]+
	    '" onmouseup="this.blur()">' +tmp[i]+ '</a>';
	else if (tmp[i].indexOf ('@') != -1 &&
		 tmp[i].charAt (0) != '@' &&
		 tmp[i].charAt (tmp[i].length - 1) != '@')
	  tmp[i] = '<a href="mailto:' +tmp[i]+ '">' +tmp[i]+ '</a>';
      }
      lines[z] = tmp.join (' ');
    }
    return lines.join ('<br>');
  };

  function js_convertTextToHTML (s) {
    s = s.replace (/\&/g, '&amp;').replace (/</g, '&lt;').replace (/>/g, '&gt;').replace (/\n/g, '<br>');
    return s;
  }

  function js_convertHTMLToText (s) {
    s = s.replace (/&amp;/g, '&').replace (/&lt;/g, '<').replace (/&gt;/g, '>').replace (/<br *\/?>/g, "\n");
    return s;
  }

  function js_fixNbHeight () {
    var mbMaxHeight = parseInt (js_getStyle (win, 'height'));
    if (!isNaN (mbMaxHeight)) {
      mbMaxHeight -= GID ('nbNoteList').offsetTop + 50;
      GID ('nbNoteListBody').style.height = mbMaxHeight + 'px';
    }
  }

  function js_fixNeHeight (neWindow) {
    var neWindowHeight = neWindow.clientHeight;
    var noteid = neWindow.id.split ('_')[1];
    var neWindowTitleBarHeight = parseInt (js_getStyle (GID ('ne_' + noteid + '_WindowTitleBar'), 'height'));
    if (isNaN (neWindowTitleBarHeight)) neWindowTitleBarHeight = 0;
    GID ('ne_' + noteid + '_WindowContent').style.height = neWindowHeight - neWindowTitleBarHeight - 15;
    var neNote = GID ('ne_' + noteid + '_Note');
    if (!neNote)
      neNote = GID ('ta_ne_' + noteid + '_Note');
    var neAccept = GID ('ne_' + noteid + '_Accept');
    neNote.style.height = (neWindowHeight - neNote.offsetTop - neAccept.clientHeight - 35) + 'px';
  }

  function js_styleHintFOver () {
    this.className = 'hintFOver';
  }

  function js_styleHintF () {
    this.className = 'hintF';
  }

  function js_hintOn (e, input) {
    if (!hint) return;
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation ();

    hint.style.width = input.clientWidth + 'px';
    hint.style.left = (js_findPosX (input) + 2) + 'px';
    var y = js_findPosY (input) + input.offsetHeight + 1;
    hint.style.top = y + 'px';

    var hCounter = 0;
    for (var i in hint.childNodes) {
      var f = hint.childNodes[i];
      if (f.tagName == 'DIV') {
	f.onmouseover = js_styleHintFOver;
	f.onmouseout = js_styleHintF;
	f.onclick = function () {
	  if (input.value == '' || input.id == 'nbTagSearch') {
	    input.value = this.innerHTML;
	    if (input.id != 'nbTagSearch')
	      js_setNoteChanged (input.id.split ('_')[1]);
	  }
	  else {
	    input.value += ', ' + this.innerHTML;
	    js_setNoteChanged (input.id.split ('_')[1]);
	  }
	};
	hCounter++;
      }
    }
    if (hCounter > 15) {
      var fs = js_getStyle (hint, msie ? 'fontSize' : 'font-size');
      if (fs.indexOf ('px') == -1) fs = 12;
      else fs = parseInt (fs);
      hint.style.height = 16 * fs + 'px';
      hint.style.overflow = 'auto';
    }
    else {
      var fs = js_getStyle (hint, msie ? 'fontSize' : 'font-size');
      if (fs.indexOf ('px') == -1) fs = 12;
      else fs = parseInt (fs);
      hCounter * fs + 'px';
    }
    if (hCounter) {
      hint.style.display = 'inline';
      hint.scrollTop = 0;
      document.onclick = js_hintOff;
    }
  }

  function js_hintOff () {
    if (hint) {
      document.onclick = null;
      hint.style.display = 'none';
    }
  }
}
