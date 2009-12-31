/*
   Cheetah News JS/v2 Share
   Copyright (C) 2008, 2009 Wojciech Polak.

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

Modules.Share = new function () {

  var menu = null;

  this.init = function () {
    menu = document.createElement ('DIV');
    menu.id = 'shareMenu';
    menu.className = 'contextMenu';
    document.body.appendChild (menu);
    return true;
  };

  this.attach = function (n) {
    n.innerHTML = _('share this');
    n.title = _('Share this entry');
    n.onclick = showMenu;
  };

  function showMenu (e) {
    var link = this;
    if (!menu) return false;
    initMenu (link);
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

  function initMenu (n) {
    menu.innerHTML = '';
    var href = n.getAttribute ('href');
    href = encodeURIComponent (href.replace (/&from=rss/, ''));
    var desc = encodeURIComponent (n.getAttribute ('desc'));
    var mail = DCE ('a',
      {className:'linkCM',
       href:'mailto:?subject=' + encodeURIComponent ('[Cheetah News] ' + n.getAttribute ('desc'))
       + '&body=' + encodeURIComponent (n.getAttribute ('desc') + ':\n' + n.getAttribute ('href'))},
      ['&nbsp;<img src="images/share/email.png" width="16" height="16" alt="" />&nbsp;E-mail&nbsp;</span>']);
    var ff = DCE ('a',
      {className:'linkCM', target:'friendfeed',
       href:'http://friendfeed.com/share?url=' + href + '&title=' + desc},
      ['&nbsp;<img src="images/share/ff.png" width="16" height="16" alt="" />&nbsp;FriendFeed&nbsp;</span>']);
    var dlc = DCE ('a',
      {className:'linkCM', target:'delicious',
       href:'http://delicious.com/save?url=' + href + '&title=' + desc},
      ['&nbsp;<img src="images/share/delicious.png" width="16" height="16" alt="" />&nbsp;Delicious&nbsp;</span>']);
    var dig = DCE ('a',
      {className:'linkCM', target:'digg',
       href:'http://digg.com/submit?phase=2&url=' + href + '&title=' + desc},
      ['&nbsp;<img src="images/share/digg.png" width="16" height="16" alt="" />&nbsp;Digg&nbsp;</span>']);
    var red = DCE ('a',
      {className:'linkCM', target:'reddit',
       href:'http://reddit.com/submit?url=' + href + '&title=' + desc},
      ['&nbsp;<img src="images/share/reddit.png" width="16" height="16" alt="" />&nbsp;Reddit&nbsp;</span>']);
    var fac = DCE ('a',
      {className:'linkCM', target:'facebook',
       href:'http://www.facebook.com/share.php?u=' + href + '&t=' + desc},
      ['&nbsp;<img src="images/share/facebook.png" width="16" height="16" alt="" />&nbsp;Facebook&nbsp;</span>']);
    var stu = DCE ('a',
      {className:'linkCM', target:'stumbleupon',
       href:'http://www.stumbleupon.com/submit?url=' + href + '&title=' + desc},
      ['&nbsp;<img src="images/share/stumbleupon.png" width="16" height="16" alt="" />&nbsp;StumbleUpon&nbsp;</span>']);
    var goo = DCE ('a',
      {className:'linkCM', target:'google',
       href:'http://www.google.com/bookmarks/mark?op=add&bkmk=' + href + '&title=' + desc},
      ['&nbsp;<img src="images/share/google.png" width="16" height="16" alt="" />&nbsp;Google&nbsp;</span>']);

    setCmhLink (mail, null);
    setCmhLink (ff, null);
    setCmhLink (dlc, null);
    setCmhLink (dig, null);
    setCmhLink (red, null);
    setCmhLink (fac, null);
    setCmhLink (stu, null);
    setCmhLink (goo, null);

    menu.appendChild (mail);
    menu.appendChild (ff);
    menu.appendChild (dlc);
    menu.appendChild (dig);
    menu.appendChild (red);
    menu.appendChild (fac);
    menu.appendChild (stu);
    menu.appendChild (goo);

    menu.style.width = (menuLength * 0.50 + 1) + 'em';
  }
}
