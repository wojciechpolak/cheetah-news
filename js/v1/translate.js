/*
   Cheetah News JS/v1 Translate
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

  this.js_attach = function (n) {
    n.innerHTML = _('translate');
    n.title = _('Translate this entry');
    n.onclick = function (e) {
      if (!locked)
	js_showMenu (this, e, n.getAttribute ('eid'));
    }
  };

  function js_showMenu (link, e, eid) {
    if (!menu) return false;
    js_initMenu (eid);
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation ();
    var x = js_findPosX (link);
    menu.style.left = (x + 14) + 'px';
    var y = js_findPosY (link);
    if (js_getStyle (sWindow, 'position') == 'fixed') {
      if (document.body && document.body.scrollTop)
	y -= document.body.scrollTop;
      else if (document.documentElement && document.documentElement.scrollTop)
	y -= document.documentElement.scrollTop;
    }
    menu.style.top = y + 'px';
    menu.style.display = 'inline';

    var yBottom = y + parseInt (menu.clientHeight);
    var yDiff = yBottom - js_getWindowHeight () - js_getScrollY ();
    if (yDiff > 0)
      menu.style.top = (y - yDiff - 15) + 'px';

    var xRight = x + 14 + parseInt (menu.clientWidth);
    var xDiff = xRight - js_getWindowWidth ();
    if (xDiff > 0)
      menu.style.left = (x - xDiff - 9) + 'px';

    document.onclick = js_hideMenu;
  }

  function js_hideMenu () {
    document.onclick = null;
    menu.style.display = 'none';
  }

  function js_initMenu (eid) {
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
      js_createTranslationOption (eid, 'auto', 'en', _('to English')); cnt++;
    }
    if (alllang || entrylang.indexOf ('pl') == -1) {
      js_createTranslationOption (eid, 'auto', 'pl', _('to Polish')); cnt++;
    }
    if (alllang || entrylang.indexOf ('uk') == -1) {
      js_createTranslationOption (eid, 'auto', 'uk', _('to Ukrainian')); cnt++;
    }
    if (alllang || entrylang.indexOf ('de') == -1) {
      js_createTranslationOption (eid, 'auto', 'de', _('to German')); cnt++;
    }
    if (alllang || entrylang.indexOf ('es') == -1) {
      js_createTranslationOption (eid, 'auto', 'es', _('to Spanish')); cnt++;
    }
    if (alllang || entrylang.indexOf ('fr') == -1) {
      js_createTranslationOption (eid, 'auto', 'fr', _('to French')); cnt++;
    }
    if (alllang || entrylang.indexOf ('it') == -1) {
      js_createTranslationOption (eid, 'auto', 'it', _('to Italian')); cnt++;
    }
    if (alllang || entrylang.indexOf ('it') == -1) {
      js_createTranslationOption (eid, 'auto', 'pt', _('to Portuguese')); cnt++;
    }
    if (alllang || entrylang.indexOf ('ar') == -1) {
      js_createTranslationOption (eid, 'auto', 'ar', _('to Arabic')); cnt++;
    }
    if (alllang || entrylang.indexOf ('ja') == -1) {
      js_createTranslationOption (eid, 'auto', 'ja', _('to Japanese')); cnt++;
    }
    if (alllang || entrylang.indexOf ('ko') == -1) {
      js_createTranslationOption (eid, 'auto', 'ko', _('to Korean')); cnt++;
    }
    if (alllang || entrylang.indexOf ('zh-cn') == -1) {
      js_createTranslationOption (eid, 'auto', 'zh-CN', _('to Chinese')); cnt++;
    }
    if (cnt == 0) {
      var tr = document.createElement ('SPAN');
      tr.className = 'ilinkCM';
      tr.innerHTML = '&nbsp;&raquo;&nbsp;' + _('Not available') + '&nbsp;';
      menu.appendChild (tr);
    }
    else {
      var pbgs = document.createElement ('span');
      pbgs.className = 'pbgs';
      pbgs.innerHTML = 'powered by';
      menu.appendChild (pbgs);
      menu.style.width = (menuLength * 0.50 + 1) + 'em';
    }
  }

  function js_createTranslationOption (eid, from, to, desc) {
    var tr = document.createElement ('SPAN');
    tr.id  = 'trs_' + from +'_'+ to;
    tr.className = 'linkCM';
    tr.innerHTML = '&nbsp;&raquo;&nbsp;' + desc + '&nbsp;';
    js_setCmhLink (tr, function () { js_translate (eid, this.id); } );
    menu.appendChild (tr);
  }

  function js_translate (eid, langPair) {
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

    mtx = new Array ();
    js_traverseTextNodes (ebi, js_textMiner, mtx);
    js_decodeMatrix ();
    mtx = null;
    locked = true;

    js_sendX ('translate', snd, false,
    	      function (data) { js_translateUpdate (to, eb, ebi, data); },
	      function (status, statusText) { ebi.innerHTML = org[eid]; js_translateRecovery (status, statusText); } );
  }

  function js_translateUpdate (to, eb, ebi, data) {
    if (eb && ebi && data.length > 0) {
      if (to == 'ar') {
	eb.style.textAlign = 'right';
	eb.style.direction = 'rtl';
      }
      else {
	eb.style.textAlign = 'left';
	eb.style.direction = 'ltr';
      }
      ebi.innerHTML = data;
    }
    locked = false;
  }

  function js_translateRecovery (status, statusText) {
    js_stderr ('js_translate Error: ' + status +': '+ statusText);
    locked = false;
  }

  function js_decodeMatrix () {
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

  function js_traverseTextNodes (node, cb, args) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];
      if (n.childNodes.length) {
	cb (n, args);
	js_traverseTextNodes (n, cb, args);
      } else {
	cb (n, args);
      }
    }
  }

  function js_textMiner (n, c) {
    if (n.nodeType == 3) { /* text node */
      var s = n.nodeValue;
      s = s.replace (/\s/g, '');
      if (s.length > 1)
	c[c.length] = n;
    }
  }
}
