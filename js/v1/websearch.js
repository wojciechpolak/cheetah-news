/*
   Cheetah News JS/v1 WebSearch
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

Modules.WebSearch = new function () {

  var seData = {
    'Google'    : ['images/google.png',
		   'http://www.google.com/search?ie=UTF-8&oe=UTF-8&q=',
		   'http://www.google.com/search?ie=UTF-8&oe=UTF-8&hl=%s&q='],
    'Yahoo!'    : ['images/yahoo.png',
		   'http://search.yahoo.com/search?ei=UTF-8&fr=sfp&p=',
		   'http://%s.search.yahoo.com/search?ei=UTF-8&fr=sfp&p='],
    'Wikipedia' : ['images/wikipedia.png',
		   'http://en.wikipedia.org/wiki/',
		   'http://%s.wikipedia.org/wiki/'],
    'Technorati' : ['images/technorati.png',
		   'http://www.technorati.com/search/',
		   'http://www.technorati.com/search/']
  };

  var win = null;
  var winInitiated = false;
  var selectedEngine = null;
  var selectedLabel = null;

  this.init = function () {
    var module = GID ('moduleWebSearch');
    if (module && module.className == 'module') {
	win = js_createWindow ('ws', 'fWindow', _('Web Search'), true);
	win.minWidth = 350;
	js_prepareLink ('WebSearch', _('Web Search'), '', js_openWindow);
	js_prepareWindowClose (GID ('wsWindowClose'), js_closeWindow);
	module.style.display = 'block';
	return true;
    }
    else {
      module.style.display = 'none';
      return false;
    }
  };

  this.isVisible = function () {
    if (win)
      return win.style.display == 'block';
    else
      return false;
  };

  this.js_shortcut = function () {
    js_openWindow ();
  };

  function js_openWindow () {
    if (msie) js_clearSelection ();
    document.onkeypress = null;
    var phrase = GID ('phrase');

    if (!winInitiated) {
      GID ('wsWindowContent').style.padding = '3px 1px 1px 1px';
      var wsWindowInAll = GID ('wsWindowInAll');
      var wsWindowLocal = GID ('wsWindowLocal');
      var selectedEngineState = 1;
      var state = js_readCookie ('cheetahWebSearch');
      if (state) {
	var st = state.split (',');
	selectedEngineState = parseInt (st[0]);
	if (selectedEngineState < 1 || selectedEngineState > 4)
	  selectedEngineState = 1;
	wsWindowInAll.checked = wsWindowInAll.defaultChecked = (st[1] == 1 ? true : false);
	wsWindowLocal.checked = wsWindowLocal.defaultChecked = (st[2] == 1 ? true : false);
      }
      wsWindowInAll.onclick = js_saveState;
      wsWindowLocal.onclick = js_saveState;

      var seCnt = 1;
      for (var seName in seData) {
	var seLabel = GID ('wsWindowSE_' + seCnt);
	if (seLabel) {
	  seLabel.innerHTML = seName;
	  seLabel.onmousedown = function () {
	    if (selectedLabel)
	      GID (selectedLabel).className = 'wsLabelLink';
	    this.className = 'wsLabelLinkb';
	    selectedLabel = this.id;
	    js_switchSearchEngine (this.innerHTML);
	    js_saveState ();
	    return false;
	  };
	  if (selectedEngineState == seCnt) {
	    selectedLabel = 'wsWindowSE_' + seCnt;
	    var sl = GID (selectedLabel);
	    if (sl) {
	      sl.className = 'wsLabelLinkb';
	      js_switchSearchEngine (sl.innerHTML);
	    }
	  }
	}
	seCnt++;
      }
      var search = GID ('search');
      search.value = _('Search');
      GID ('wsForm').onsubmit = js_submit;
      GID ('wsWindowLocalD').innerHTML = _('Native language search');
      GID ('wsWindowInAllD').innerHTML = _('Search in all simultaneously');
      js_prepareInput (phrase);
      winInitiated = true;
    }

    if (win.style.display == 'none') {
      var y = js_findPosY (GID ('WebSearch'));
      var st = js_getScrollY ();
      if (y == 0 || st > 0)
	js_popUp (win);
      else {
	win.style.left = bwLeft + 'em';
	win.style.top = (y + 10) + 'px';
      }
      js_setupDrag (win);
    }
    js_registerWindow (win);
    js_setCaretToEnd (phrase);
    return false;
  }

  function js_closeWindow () {
    GID ('phrase').blur ();
    GID ('wsWindowTitleBar').onmousedown = null;
    win.style.display = 'none';
    js_initAllKShortcuts ();
  }
 
  function js_switchSearchEngine (name) {
    var sed = seData[name];
    if (typeof sed != 'undefined') {
      selectedEngine = sed;
      var winSEImage = GID ('wsWindowSEImage');
      winSEImage.src = sed[0];
      winSEImage.alt = name;
    }
  }
 
  function js_submit () {
    var phrase = GID ('phrase');
    if (phrase.value != '') {
      var searchInAll = GID ('wsWindowInAll').checked;
      var localSearch = GID ('wsWindowLocal').checked;
      if (searchInAll) {
	for (var seName in seData)
	  js_search (seData[seName], phrase, localSearch);
      }
      else
	js_search (selectedEngine, phrase, localSearch);
    }
    return false;
  }

  function js_search (sed, phrase, localSearch) {
    var seUrl = sed[1];
    if (localSearch) {
      var lang = gettext_locale.toLowerCase ().split ('_')[0];
      switch (lang) {
      case '': break;
      default:
	if (sed[1].indexOf ('yahoo') != -1)
	  break;
	seUrl = js_sprintf (sed[2], lang);
      }
    }
    var w = window.open (seUrl + encodeURIComponent (phrase.value));
    if (!w) js_popupBlocked ();
  }

  function js_saveState () {
    var state = selectedLabel.split ('_')[1];
    state += ',' + (GID ('wsWindowInAll').checked ? '1' : '0');
    state += ',' + (GID ('wsWindowLocal').checked ? '1' : '0');
    js_writeCookie ('cheetahWebSearch', state, 365);
  }
}
