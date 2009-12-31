<?php

/*
   Cheetah News kshortcuts.php
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

include '../lib/gz.php';
include '../lib/include.php';
start_session (null, false);
$session->auth ('iflogged');
header ('Last-Modified: ' . gmdate ('D, d M Y H:i:s T'));
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
<title>Cheetah Help</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="robots" content="noindex,nofollow" />
<link rel="icon" href="../images/favicon.png" type="image/png" />
<style type="text/css">
<!--
body, td, p {
  font-family: arial, sans-serif
}
.t1 {
  font-size: 12px;
  text-align: center;
  font-weight: bold;
  background-color: white;
}
.t2 {
  background-color: white;
}
th {
  background-color: #dddddd;
}
//-->
</style>
</head>

<body>
<h3><?php echo _('Keyboard shortcuts'); ?></h3>

<table cellpadding="3" cellspacing="1" width="80%" style="background-color: #999999">
  <thead>
    <tr><th><?php echo _('Keystroke'); ?></th><th><?php echo _('Action'); ?></th></tr>
  </thead>
  <tbody>
<?php
  echo '<tr><td class="t1">j</td><td class="t2">'._('next item')."</td></tr>\n";
  echo '<tr><td class="t1">k</td><td class="t2">'._('previous item')."</td></tr>\n";
  echo '<tr><td class="t1">J</td><td class="t2">'._('next feed')."</td></tr>\n";
  echo '<tr><td class="t1">K</td><td class="t2">'._('previous feed')."</td></tr>\n";
  echo '<tr><td class="t1">enter</td><td class="t2">'._('open selected feed/entry')."</td></tr>\n";
  echo '<tr><td class="t1">shift + enter</td><td class="t2">'._('append selected feed')."</td></tr>\n";
  echo '<tr><td class="t1">x</td><td class="t2">'._('open feeds from folder/more')."</td></tr>\n";
  echo '<tr><td class="t1">X</td><td class="t2">'._('append feeds from folder')."</td></tr>\n";
  echo '<tr><td class="t1">e</td><td class="t2">'._('close selected feed')."</td></tr>\n";
  echo '<tr><td class="t1">h</td><td class="t2">'._('move left to My Stuff window')."</td></tr>\n";
  echo '<tr><td class="t1">l</td><td class="t2">'._('move right to a feed window')."</td></tr>\n";
  echo '<tr><td class="t1">a</td><td class="t2">'._('hide/show all active feeds')."</td></tr>\n";
  echo '<tr><td class="t1">A</td><td class="t2">'._('show all loaded feeds')."</td></tr>\n";
  echo '<tr><td class="t1">s</td><td class="t2">'._('open/close My Stuff window')."</td></tr>\n";
  echo '<tr><td class="t1">c</td><td class="t2">'._('collapse')."</td></tr>\n";
  echo '<tr><td class="t1">r</td><td class="t2">'._('refresh visible')."</td></tr>\n";
  echo '<tr><td class="t1">m</td><td class="t2">'._('mark entry as read')."</td></tr>\n";
  echo '<tr><td class="t1">u</td><td class="t2">'._('mark entry as unread')."</td></tr>\n";
  echo '<tr><td class="t1">f</td><td class="t2">'._('filter visible')."</td></tr>\n";
  echo '<tr><td class="t1">d</td><td class="t2">'._('save link')."</td></tr>\n";
  echo '<tr><td class="t1">w</td><td class="t2">'._('open/close Weather Report')."</td></tr>\n";
  echo '<tr><td class="t1">b</td><td class="t2">'._('open/close Notes and Bookmarks')."</td></tr>\n";
?>
  </tbody>
</table>

</body>
</html>
