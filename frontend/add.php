<?php

/*
   Cheetah News add.php
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

require 'lib/include.php';

$feedurl = '';
if (isset ($_SERVER['QUERY_STRING']))
{
  if (substr ($_SERVER['QUERY_STRING'], 0, 8) == 'feedurl=')
    $feedurl = urldecode (substr ($_SERVER['QUERY_STRING'], 8));
}

start_session (null);
$session->auth ('afterlogged', $feedurl);

$db = new Database ();
if (!empty ($feedurl))
{
  if (!strstr ($feedurl, '://'))
    $feedurl = 'http://' . $feedurl;
  if ($feedurl[strlen ($feedurl) - 1] == '/')
    $feedurl = substr ($feedurl, 0, -1);

  $feedurl = $db->escape (strip_tags ($feedurl));
  $db->query ("SELECT id FROM feedaddqueue WHERE userid='".
	      $session->id."' AND url='$feedurl'");
  if (!$db->next_record ()) {
    $db->query ("INSERT INTO feedaddqueue SET userid=".
		$session->id.", url='$feedurl'");
  }
}

redirect ('http://'.$CONF['site'].'/');

?>
