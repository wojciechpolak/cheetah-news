<?php

/*
   Cheetah News export.php
   Copyright (C) 2005, 2006, 2007 Wojciech Polak.
   Copyright (C) 2006 The Cheetah News Team.

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

include 'lib/gz.php';
require 'lib/include.php';

start_session (null, false);
$session->auth ('iflogged');

getvars ('fid');

if ($session->status['afterlogged'] == 'yes')
{
  header ('Content-Type: text/xml; charset=UTF-8');
  header ('Content-Disposition: attachment; filename="my-cheetah-feeds.xml"');
  header ('Last-Modified: ' . gmdate ('D, d M Y H:i:s T'));
  exportOPML ($session->id);
}

function makeOutlineFolder ($title, $text) {
  return '    <outline title="'.htmlspecialchars ($title).'" text="'.
    htmlspecialchars ($title)."\">\n".$text."    </outline>\n";
}

function makeOutlineFeed ($title, $xmlUrl) {
  return '<outline title="'.htmlspecialchars ($title).'" text="'.
    htmlspecialchars ($title).'" type="rss" xmlUrl="'.
    htmlspecialchars ($xmlUrl)."\"/>\n";
}

function exportOPML ($userid) {
  global $session, $fid;

  echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
  echo "<opml version=\"1.0\">\n";
  echo "  <head>\n";
  echo "    <title>Cheetah News Subscriptions</title>\n";
  echo "    <dateCreated>".gmdate ('D, d M Y H:i:s T')."</dateCreated>\n";
  echo "    <ownerEmail>".$session->email."</ownerEmail>\n";
  echo "  </head>\n";
  echo "  <body>\n";

  $db = new Database ();
  $db2 = new Database ();

  $opml_text = '';

  $fid = addslashes ($fid);
  if (!is_numeric ($fid))
    $fid = -1;
  else
    $fid = (int)$fid;

  if ($fid != 0) {
    if ($fid > 0) {
      $db->query ("SELECT fname, id FROM folder WHERE userid=".
		  $userid." AND id='$fid' ORDER BY pri DESC");
    }
    else {
      $db->query ("SELECT fname, id FROM folder WHERE userid=".
		  $userid." ORDER BY pri DESC");
    }
    while ($db->next_record ())
    {
      $text = '';
      $db2->query ("SELECT s.description, f.url FROM feed f, subscription s ".
		   "WHERE s.userid='".$userid.
		   "' AND f.id = s.feedid AND s.folder=".
		   $db->f ('id')." ORDER BY s.pri DESC");
      while ($db2->next_record ()) {
	$text .= '      '.makeOutlineFeed ($db2->f ('description'),
					   $db2->f ('url'));
      }
      $opml_text .= makeOutlineFolder ($db->f ('fname'), $text);
    }
  }

  if ($fid < 1) {
    $db->query ("SELECT s.description, f.url FROM feed f, subscription s ".
		"WHERE s.userid='".$userid.
		"' AND f.id = s.feedid AND s.folder=0 ORDER BY s.pri DESC");
    while ($db->next_record ()) {
      $opml_text .= '    '.makeOutlineFeed ($db->f ('description'),
					    $db->f ('url'));
    }
  }

  echo $opml_text;
  echo "  </body>\n";
  echo "</opml>\n";
}

?>
