/*
   Cheetah News JS/v2 Notes
   Copyright (C) 2005, 2006, 2008 Wojciech Polak.

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

  var winInitiated = false;
  var winLoaded = false;
  var query = null;
  var lastQuery = '';
  var lastNoteId = null;
  var rcmState = false;

  this.init = function () {
    var module = GID ('menuOpenNotes');
    if (module) {
      module.innerHTML += '&nbsp;' + _('Notes and Bookmarks') + '&nbsp;';
      setCmhLink (module, openWindow);
      if (!msie && !iphone)
	Nifty ('div#notesContent');

      var nbClose1 = GID ('nbClose1');
      nbClose1.innerHTML = _('&laquo; return to reader');
      prepareWindowClose (nbClose1, closeWindow);
      var nbClose2 = GID ('nbClose2');
      nbClose2.title = _('Close');
      prepareWindowClose (nbClose2, closeWindow);

      var nbXmlFeed = GID ('nbXmlFeed');
      nbXmlFeed.title = _('Your publicly visible notes and links (Atom feed)');
      nbXmlFeed.onmouseup = blur;
      GID ('neWindowT1').innerHTML = _('Title:');
      GID ('neWindowT2').innerHTML = _('Tags:');
      GID ('neWindowT4').innerHTML = _('Publicly visible:');
      GID ('neWindowT5').innerHTML = _('Note (double-click or tab to edit):');
      GID ('neAccept').value = _('Save Note');
      GID ('neCancel').value = _('Cancel');
      return true;
    }
    else {
      module.style.display = 'none';
      return false;
    }
  };

  this.attach = function (n) {
    var eid  = n.getAttribute ('eid');
    var href = n.getAttribute ('href');
    var desc = n.getAttribute ('desc');
    if (href) {
      n.innerHTML = _('save link');
      n.title = _('Save link to this entry');
      n.onclick = function () {
	Modules.Notes.addBookmark (desc, href);
      }
    }
    else
      n.parentNode.removeChild (n);
  }

  this.addBookmark = function (title, href) {
    openWindow (function () { openNote ('B'); });
    if (!winInitiated && !cheetahNoteTags)
      notes ('nt=1', getNoteTags, function () {});

    var selection = '';
    if (window.getSelection)
      selection = '' + window.getSelection ();
    else if (document.selection) {
      selection = document.selection.createRange ().text;
    }
    if (selection == '')
      var text = decodeURIComponent (href);
    else
      var text = decodeURIComponent (href) + '\n\n' + selection;

    var neForm = GID ('neForm');
    GID ('neId').value = '';
    GID ('neStatus').value = 'changed';
    GID ('neTitle').value = title;
    GID ('neTags').value = '';
    GID ('neNote').innerHTML = convertTextToHTML (text).createLinks ();
    GID ('nePublic').checked = false;
    GID ('neProgress').style.display = 'none';
    GID ('neAccept').disabled = false;
    neForm.style.display = 'block';
  }

  this.shortcut = function () {
    if (GID ('notesContent').style.display == 'block') {
      closeWindow ();
      return;
    }
    else {
      fastcloseCWindow ();
      openWindow ();
    }
  };

  this.fastclose = function () {
    $('#notesContent').hide ();
  };

  this.isVisible = function () {
    return GID ('notesContent').style.display == 'block';
  };

  function openWindow (cb) {
    hideMenu ();
    if (msie) clearSelection ();

    fastcloseCWindow ();

    if (!winInitiated) {
      var nbCreate = GID ('nbCreate');
      nbCreate.value = _('Create Note');
      nbCreate.onclick = function () {
	openNote ('N');
      };
      GID ('nbTags').innerHTML = _('Tag:');
      var nbTagSearch = GID ('nbTagSearch'); 
      prepareInput (nbTagSearch);
      GID ('nbSearch').value = _('Search');
      GID ('nbForm').onsubmit = function () {
	if (!checkOnline ()) return false;
	query = GID ('nbTagSearch').value.replace (/<\S[^>]*>/g, '').trim ();
	if (query != lastQuery) {
	  lastQuery = query;
	  GID ('nbProgress').innerHTML = _('Searching...');
	  notes ('q=' + encodeURIComponent (query),
		    getNoteList, getNoteListRecover);
	}
	return false;
      };

      var neTitle = GID ('neTitle');
      neTitle.onchange = setNoteChanged;
      prepareInput (neTitle);

      var neTags = GID ('neTags');
      neTags.onchange = setNoteChanged;
      prepareInput (neTags);

      var nePublic = GID ('nePublic');
      nePublic.onclick = setNoteChanged;

      var neAccept = GID ('neAccept');
      neAccept.onclick = saveNote;

      var neCancel = GID ('neCancel');
      neCancel.onclick = cancelNote;

      var neNote = GID ('neNote');
      neNote.ondblclick = editNote;
      neNote.onkeypress = editNote;

      var neTagsHelp = GID ('neTagsHelp');
      neTagsHelp.style.cursor = 'help';
      neTagsHelp.title = _('Comma-separated list of tags');

      winInitiated = true;
      if (typeof tracker != 'undefined')
	tracker._trackEvent ('Notes', 'Open');
    }

    main.style.height = 'auto';
    $('#notesContent').
      slideDown ('normal', function ()
		 {
		   if (!winLoaded) {
		     query = null;
		     if (checkOnline ()) {
		       GID ('nbProgress').innerHTML = _('Searching...');
		       notes ('q=', function (data) {
			   getNoteList (data);
			   if (typeof cb == 'function') cb ();
			 }, getNoteListRecover);
		     }
		   }
		   else {
		     if (typeof cb == 'function') cb ();
		   }
		 });
    return false;
  }

  function closeWindow () {
    var cb = Modules.Weather.isVisible () ? function () {} : resizeChrome;
    $('#notesContent').slideUp ('normal', cb);
  }

  function notes (data, cb, fail) {
    return sendX ('xnotes', data, 0, cb, fail);
  }

  function countNoteList () {
    var len = length (cheetahNoteList);
    if (query) {
      GID ('nbProgress').innerHTML = sprintf (ngettext ('Found %d note tagged with "%s".',
							'Found %d notes tagged with "%s".', len),
					      len, query);
    }
    else {
      GID ('nbProgress').innerHTML = sprintf (ngettext ('Found %d latest note.',
							'Found %d latest notes.', len), len);
    }
  }

  function getNoteTags (data) {
    try {
      eval (data);
    } catch (e) {
      stderr ('getNoteTags: ' + e.name +': '+ e.message);
      return;
    }
    prepareNoteTags ();
 }

  function getNoteList (data) {
    try {
      eval (data);
    } catch (e) {
      stderr ('getNoteList: ' + e.name +': '+ e.message);
      return;
    }

    winLoaded = true;

    var nb_edit = GID ('neWindowContainer');
    if (nb_edit.parentNode.id == 'nbNoteList') {
      nb_edit.style.display = 'none';
      GID ('notesContent').appendChild (nb_edit);
    }

    var tbody = GID ('nbNoteList');
    tbody.innerHTML = '';
    countNoteList ();

    if (cheetahNoteList) {
      for (var n in cheetahNoteList) {

	var row_rem = DCE ('span', {id: 'noteRowRem_' + n},
			   ['<span class="link" id="removeNote_' + n +
			    '"action="rem"><img class="img-10-remove iremove" src="images/t.gif" width="10" height="10" alt="'
			    + _('rem') + '" /></span>']);
	row_rem.onmouseover = selectRow;
 	row_rem.onmouseout = unselectRow;

	var row_pstatus = DCE ('span', {id: 'notePStatus' + n},
			       [cheetahNoteList[n][3] == 'yes' ?
				'<img class="img-16-world" src="images/t.gif" width="16" height="16" alt="P" title="'
				+ _('Publicly visible')+'" />' :
				'<img class="img-16-world-i" src="images/t.gif" width="16" height="16" alt="NP" title="'
				+ _('Not publicly visible')+'" />']);

	var tags = '<span class="nb_tags">' + cheetahNoteList[n][4].replace (/,/g, ', ') + '</span>';

	var row = DCE ('div', {id: 'note_' + n, className: 'nbRow pointer'},
		       [DCE ('div', {className: 'nb_tls'},
			     [cheetahNoteList[n][1] + ' ' + tags,
			      DCE ('div', {className: 'nb_tld'},
				   [cheetahNoteList[n][2].substr (0, 16),
				    row_pstatus,
				    row_rem])])
			]);

	row.setAttribute ('noteid', n);
 	row.onclick = openINote;
	row.rgbColor = '#ffffff';
	tbody.appendChild (row);

 	var rem = GID ('removeNote_' + n);
 	if (rem) {
 	  rem.title = _('Remove');
 	  rem.onclick = removeINote;
	}
      }
    }
    prepareNoteTags ();
  }

  function selectRow () {
    GID ('note_' + this.id.split ('_')[1]).style.backgroundColor = '#b9d4e5';
  }

  function unselectRow () {
    if (!rcmState) {
      var row = GID ('note_' + this.id.split ('_')[1]);
      if (row) row.style.backgroundColor = row.rgbColor;
    }
  }

  function openINote () {
    var noteid = this.getAttribute ('noteid');
    notes ('nid=' + noteid,
	   function (data) { getNote (noteid, data); },
	   getNoteRecover);
    openNote (this.getAttribute ('noteid'));
    GID ('neProgress').innerHTML = _('Loading...');
    GID ('neStatus').value = 'unchanged';
    GID ('neAccept').disabled = true;
    return false;
  }

  function removeINote (e) {
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation ();
    rcmState = true;
    if (confirm (_('Are you sure you want to delete this note?')))
      removeNote (this.id);
    else {
      var row = GID ('note_' + this.id.split ('_')[1]);
      if (row) row.style.backgroundColor = row.rgbColor;
    }
    rcmState = false;
  }

  function prepareNoteTags () {
    if (cheetahNoteTags) {
      $('#nbTagSearch').autocomplete (cheetahNoteTags, {minChars:1, max:100});
      $('#neTags').autocomplete (cheetahNoteTags, {multiple:true});
    }
  }

  function getNoteListRecover (status, statusText) {
    stderr ('getNoteList Error: ' + status +': '+ statusText);
  }

  function restoreLastRow () {
    if (lastNoteId) {
      var row = GID ('note_' + lastNoteId);
      if (row) {
	row.onclick = openINote;
	row.style.display = 'block';
      }
    }
  }

  function openNote (noteId) {
    restoreLastRow ();
    lastNoteId = noteId;
    var nb_edit = GID ('neWindowContainer');
    var nbNoteList = GID ('nbNoteList');
    if (noteId == 'N' || noteId == 'B') {
      nbNoteList.insertBefore (nb_edit, nbNoteList.firstChild);
    }
    else {
      var row = GID ('note_' + noteId);
      row.onclick = null;
      row.style.display = 'none';
      nbNoteList.insertBefore (nb_edit, row.nextSibling);
    }

    if (noteId == 'N') {
      GID ('neId').value = '';
      GID ('neTitle').value = '';
      GID ('neTags').value = '';
      GID ('neNote').innerHTML = '';
      GID ('nePublic').checked = false;
    }

    if (noteId == 'B') {
      window.scrollTo (0, 0);
    }

    $(nb_edit).slideDown ('normal', function () {
	scrollToElement (nb_edit, nbNoteList);
	setCaretToEnd (GID ('neTitle'));
      });
  }

  function setNoteChanged () {
    var status = GID ('neStatus');
    if (status && status.value == 'unchanged') {
      status.value = 'changed';
      GID ('neAccept').disabled = false;
    }
  }

  function editNote () {
    var text = this.innerHTML;
    var textarea = document.createElement ('TEXTAREA');
    textarea.id = 'ta_' + this.id;
    textarea.style.backgroundColor = this.style.backgroundColor;
    textarea.rows = 5;
    textarea.cols = 65;
    textarea.style.width = '90%';
    textarea.style.height = $(this).height () + 'px';
    textarea.onchange = setNoteChanged;
    textarea.onclick = function (e) {
      if (!e) var e = window.event;
      e.cancelBubble = true;
      if (e.stopPropagation) e.stopPropagation ();
    };
    prepareInput (textarea);
    var wa = GID ('neAccept');
    wa.value = _('Finish editing');
    wa.onclick = function () { saveEdit (textarea); };
    wa.disabled = false;
    GID ('neWindowContainer').onclick = function () {
      saveEdit (textarea);
    };

    var z = this.parentNode;
    z.insertBefore (textarea, this);
    z.ondblclick = null;
    z.removeChild (this);

    text = text.replace (/<br *\/?>/g, "\n");
    text = text.replace (/<\S[^>]*>/g, '');
    textarea.value = convertHTMLToText (text);
    textarea.focus ();
  }

  function saveEdit (textarea) {
    var id = textarea.id.split ('_')[2];
    var wa = GID ('neAccept');
    wa.disabled = true;
    var text = document.createElement ('DIV');
    text.id = 'neNote';
    text.className = 'neNote';
    text.style.height = $(textarea).height () + 'px';
    text.ondblclick = editNote;
    text.onkeypress = editNote;
    text.innerHTML = convertTextToHTML (textarea.value).createLinks ();
    textarea.parentNode.insertBefore (text, textarea);
    textarea.parentNode.removeChild (textarea);
    wa.value = _('Save Note');
    wa.blur ();
    wa.onclick = saveNote;
    GID ('neWindowContainer').onclick = null;
    if (GID ('neStatus').value == 'unchanged')
      wa.disabled = true;
    else
      wa.disabled = false;
  }

  function getNote (noteid, data) {
    try {
      eval (data);
    } catch (e) {
      stderr ('getNote: ' + e.name +': '+ e.message);
    }
    if (cheetahNote) {
      GID ('neId').value = noteid;
      GID ('nePublic').checked = (cheetahNote['public'] == 'yes' ? true : false);
      GID ('neTitle').value = decodeEntities (cheetahNote['title']);
      var tags = GID ('neTags');
      tags.value = '';
      for (var i = 0; i < cheetahNote['tags'].length; i++) {
	tags.value += decodeEntities (cheetahNote['tags'][i]);
	if (i < cheetahNote['tags'].length - 1)
	  tags.value += ', ';
      }
      var note = GID ('neNote');
      cheetahNote['note'] = decodeEntities (cheetahNote['note'].replace (/<br *\/?>/g, "\n"));
      note.innerHTML = convertTextToHTML (cheetahNote['note']).createLinks ();

      var neForm = GID ('neForm');
      neForm.style.visibility = 'hidden';
      neForm.style.display = 'block';
      GID ('neProgress').style.display = 'none';
      neForm.style.visibility = 'visible';
    }
    else {
      GID ('neProgress').innerHTML = _('error');
    }
  }

  function getNoteRecover (status, statusText) {
    stderr ('getNote Error: ' + status +': '+ statusText);
  }

  function cancelNote () {
    $('#neWindowContainer').slideUp ('normal', restoreLastRow);
  }

  function saveNote () {
    if (!checkOnline ()) return;
    var sid = this.id.split ('_')[1];
    GID ('neAccept').disabled = true;
    var snd = 'save=1';
    var title = GID ('neTitle').value;
    var tags  = GID ('neTags').value.trim ();
    var text  = GID ('neNote').innerHTML;
    text = text.replace (/<br *\/?>/g, "\n");
    text = text.replace (/<\S[^>]*>/g, '');
    if (tags.length == 0) {
      alert (_('At least one tag is required.'));
      GID ('neAccept').disabled = false;
      return;
    }
    if (title.length == 0 && text.length == 0) {
      alert (_('Empty note title and body.'));
      GID ('neAccept').disabled = false;
      return;
    }
    else if (title.length == 0 && text.length > 0) {
      title = text.substr (0, 50);
      if (text.length > 50)
	title += '...';
    }
    else if (title.length == 0)
      title = _('No title');

    var id = GID ('neId');
    if (id && id.value != '')
      snd += '&nid=' + id.value;
    snd += '&public='+ encodeURIComponent (GID ('nePublic').checked ? 'yes' : 'no');
    var d = new Date ();
    var date = d.getFullYear() +'-'+ (d.getMonth() + 1) +'-'+ d.getDate() +' '+
      d.getHours() +':'+ d.getMinutes() +':'+ d.getSeconds();
    snd += '&date='  + encodeURIComponent (date);
    snd += '&tags='  + encodeURIComponent (tags);
    snd += '&title=' + encodeURIComponent (title);
    snd += '&note='  + encodeURIComponent (convertHTMLToText (text));

    sendX ('xnotes', snd, 1, function (xml) { reloadNoteList (sid, xml); },
	      function (status, statusText) { saveNoteRecover (sid, status, statusText); });
  }

  function reloadNoteList (sid, xml) {
    var sts = xmlStatus (xml);
    if (sts) {
      alert (sts);
      GID ('neAccept').disabled = false;
    }
    else {
      notes ('q=' + encodeURIComponent (GID ('nbTagSearch').value),
	     getNoteList, getNoteListRecover);
    }
  }

  function saveNoteRecover (sid, status, statusText) {
    GID ('neAccept').disabled = false;
    stderr ('saveNote Error: ' + status +': '+ statusText);
  }

  function removeNote (id) {
    var noteid = id.split ('_')[1];
    sendX ('xnotes', 'rem=' + noteid, 1, function (xml) {
	removeNoteCheck (noteid, xml); }, removeNoteRecover);
  }

  function removeNoteRecover (status, statusText) {
    stderr ('removeNote Error: ' + status +': '+ statusText);
  }

  function removeNoteCheck (noteid, xml) {
    var sts = xmlStatus (xml);
    if (sts) {
      alert (sts);
    }
    else {
      GID ('nbNoteList').removeChild (GID ('note_' + noteid));
      delete cheetahNoteList[noteid];
      countNoteList ();
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

  function convertTextToHTML (s) {
    s = s.replace (/\&/g, '&amp;').replace (/</g, '&lt;').
      replace (/>/g, '&gt;').replace (/\n/g, '<br>');
    return s;
  }

  function convertHTMLToText (s) {
    s = s.replace (/&amp;/g, '&').replace (/&lt;/g, '<').
      replace (/&gt;/g, '>').replace (/<br *\/?>/g, "\n");
    return s;
  }
}
