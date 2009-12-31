/*
   JavaScript localization support for Cheetah News Aggregator.
   Copyright (C) 2005, 2006 The Cheetah News Team.

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

function gettext (msg) {
  if (gettext_msg !== undefined && gettext_msg[msg])
    return gettext_msg[msg];
  return msg;
}

function _(msg) {
  return gettext (msg);
}

function ngettext (sing, plur, n) {
  if (gettext_plural === undefined)
    return gettext (n == 1 ? sing : plur);
  else {
    var s = gettext (sing + String.fromCharCode (0) + plur);
    var t = s.split (String.fromCharCode (0))[gettext_plural(n)];
    if (t === undefined)
      return gettext (n == 1 ? sing : plur);
    else
      return t;
  }
}
