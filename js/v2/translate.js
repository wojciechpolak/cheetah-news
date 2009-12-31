/*
   Cheetah News JS/v2 Translate
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

Modules.Translate = new function () {

  var menu = null;
  var mtx = null;
  var org = {};
  var locked = false;

  this.init = function () {
    menu = document.createElement ('DIV');
    menu.id = 'translationListMenu';
    menu.className = 'contextMenu';
    document.body.appendChild (menu);
    return true;
  };

  this.attach = function (n) {
    n.innerHTML = _('translate');
    n.title = _('Translate this entry');
    n.onclick = function (e) {
      if (!locked)
	showMenu (this, e, n.getAttribute ('eid'));
    }
  };

  function showMenu (link, e, eid) {
    if (!menu) return false;
    initMenu (eid);
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation ();
    var x = findPosX (link);
    menu.style.left = (x + 14) + 'px';
    var y = findPosY (link);
    y -= main.scrollTop;
    menu.style.top = y + 'px';
    menu.style.display = 'inline';

    var yBottom = y + parseInt (menu.clientHeight);
    var yDiff = yBottom - getWindowHeight () - getScrollY ();
    if (yDiff > 0)
      menu.style.top = (y - yDiff - 15) + 'px';

    var xRight = x + 14 + parseInt (menu.clientWidth);
    var xDiff = xRight - getWindowWidth ();
    if (xDiff > 0)
      menu.style.left = (x - xDiff - 9) + 'px';

    $(document).bind ('click', hideMenu);
  }

  function hideMenu () {
    $(document).unbind ('click', hideMenu);
    menu.style.display = 'none';
  }

  function initMenu (eid) {
    menu.innerHTML = '';
    var entry = GID ('entry_' + eid);
    var entrylang = null;
    var alllang = false;
    var cnt = 0;
    if (entry) {
      entrylang = entry.getAttribute ('entrylang');
      if (entrylang)
	entrylang = entrylang.toLowerCase ();
      else
	alllang = true;
    }
    if (alllang || entrylang.indexOf ('en') == -1) {
      createTranslationOption (eid, 'auto', 'en', _('to English')); cnt++;
    }
    if (alllang || entrylang.indexOf ('pl') == -1) {
      createTranslationOption (eid, 'auto', 'pl', _('to Polish')); cnt++;
    }
    if (alllang || entrylang.indexOf ('uk') == -1) {
      createTranslationOption (eid, 'auto', 'uk', _('to Ukrainian')); cnt++;
    }
    if (alllang || entrylang.indexOf ('de') == -1) {
      createTranslationOption (eid, 'auto', 'de', _('to German')); cnt++;
    }
    if (alllang || entrylang.indexOf ('es') == -1) {
      createTranslationOption (eid, 'auto', 'es', _('to Spanish')); cnt++;
    }
    if (alllang || entrylang.indexOf ('fr') == -1) {
      createTranslationOption (eid, 'auto', 'fr', _('to French')); cnt++;
    }
    if (alllang || entrylang.indexOf ('it') == -1) {
      createTranslationOption (eid, 'auto', 'it', _('to Italian')); cnt++;
    }
    if (alllang || entrylang.indexOf ('it') == -1) {
      createTranslationOption (eid, 'auto', 'pt', _('to Portuguese')); cnt++;
    }
    if (alllang || entrylang.indexOf ('ar') == -1) {
      createTranslationOption (eid, 'auto', 'ar', _('to Arabic')); cnt++;
    }
    if (alllang || entrylang.indexOf ('ja') == -1) {
      createTranslationOption (eid, 'auto', 'ja', _('to Japanese')); cnt++;
    }
    if (alllang || entrylang.indexOf ('ko') == -1) {
      createTranslationOption (eid, 'auto', 'ko', _('to Korean')); cnt++;
    }
    if (alllang || entrylang.indexOf ('zh-cn') == -1) {
      createTranslationOption (eid, 'auto', 'zh-CN', _('to Chinese')); cnt++;
    }
    if (cnt == 0) {
      var tr = document.createElement ('SPAN');
      tr.className = 'ilinkCM';
      tr.innerHTML = '&nbsp;&raquo;&nbsp;' + _('Not available') + '&nbsp;';
      menu.appendChild (tr);
    }
    else {
      menu.appendChild (DCE ('span', {className:'pbgs'},
			     [document.createTextNode ('powered by')]));
      menu.style.width = (menuLength * 0.50 + 1) + 'em';
    }
  }

  function createTranslationOption (eid, from, to, desc) {
    var tr = document.createElement ('SPAN');
    tr.id  = 'trs_' + from +'_'+ to;
    tr.className = 'linkCM';
    tr.innerHTML = '&nbsp;&raquo;&nbsp;' + desc + '&nbsp;';
    setCmhLink (tr, function () { translate (eid, this.id); } );
    menu.appendChild (tr);
  }

  function translate (eid, langPair) {
    var lp = langPair.split ('_');
    var from = lp[1]; var to = lp[2];
    var snd = 'in=' + from + '&out=' + to;
    var eb  = GID ('eb_' + eid);
    var ebi = GID ('ebi_' + eid);
    if (org[eid])
      snd += '&text=' + encodeURIComponent (org[eid]);
    else {
      org[eid] = ebi.innerHTML;
      snd += '&text=' + encodeURIComponent (org[eid]);
    }

    mtx = [];
    traverseTextNodes (ebi, textMiner, mtx);
    decodeMatrix ();
    mtx = null;
    locked = true;

    sendX ('translate', snd, false,
    	      function (data) { translateUpdate (to, eb, ebi, data); },
	      function (status, statusText) { ebi.innerHTML = org[eid]; translateRecovery (status, statusText); } );
  }

  function translateUpdate (to, eb, ebi, data) {
    if (eb && ebi && data.length > 0) {
      if (to == 'ar') {
	eb.style.textAlign = 'right';
	eb.style.direction = 'rtl';
      }
      else {
	eb.style.textAlign = 'left';
	eb.style.direction = 'ltr';
      }
      ebi.innerHTML = hParser.fix (data);
    }
    locked = false;
  }

  function translateRecovery (status, statusText) {
    stderr ('translate Error: ' + status +': '+ statusText);
    locked = false;
  }

  function decodeMatrix () {
    for (var i = 0; i < mtx.length; i++) {
      var node = mtx[i];
      var str = '';
      for (var j = 0; j < node.nodeValue.length; j++) {
	if (node.nodeValue.charCodeAt (j) == 32 ||
	    node.nodeValue.charCodeAt (j) == 160) {
	  str += ' ';
	}
	else {
	  var r = Math.floor (Math.random () * 2);
	  if (r)
	    str += '1';
	  else
	    str += '0';
	}
      }
      node.nodeValue = str;
    }
  }

  function traverseTextNodes (node, cb, args) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];
      if (n.childNodes.length) {
	cb (n, args);
	traverseTextNodes (n, cb, args);
      } else {
	cb (n, args);
      }
    }
  }

  function textMiner (n, c) {
    if (n.nodeType == 3) { /* text node */
      var s = n.nodeValue;
      s = s.replace (/\s/g, '');
      if (s.length > 1)
	c[c.length] = n;
    }
  }
}
