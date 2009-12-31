<?php

/*
   Cheetah News notes.php
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

include 'lib/gz.php';
require 'lib/functions.php';
require 'lib/mysql.class.php';
require 'lib/local.php';

getvars ('u,t');

if (empty ($u))
  exit;

$db = new Database ();
$userid = '';
$tagUri = 'tag:'.$CONF['site'].',2005:notes';

header ('Content-Type: application/xml; charset=UTF-8');

if ($u == 'guest' && isset ($CONF['guestAccount']))
  $u = $CONF['guestAccount'];

$db->query ("SELECT id FROM user WHERE email='".$db->escape ($u)."'");
if ($db->next_record ())
  $userid = $db->f ('id');

if (isset ($CONF['guestAccount']) && $u == $CONF['guestAccount'])
  $u = 'guest';

$tag = '';
if (!empty ($t))
  $tag = '/'.htmlspecialchars (htmlentities2 ($t));

echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
echo "<feed xmlns=\"http://www.w3.org/2005/Atom\">\n";
echo "<title>".$u.($u[strlen ($u) - 1] != 's' ? "'s" : "'")." Notes and Links</title>\n";
echo "<updated>".gmdate ('Y-m-d\TH:i:s\Z')."</updated>\n";
echo "<author>\n";
echo "<name>".$u."</name>\n";
echo "<email>".$u."</email>\n";
echo "</author>\n";
echo "<rights>Copyright (C) ".gmdate ('Y').' '.$u."</rights>\n";
echo "<generator uri=\"http://".$CONF['site']."/\">Cheetah News Aggregator</generator>\n";
echo "<id>".$tagUri.'/'.$u.(!empty ($t) ? $tag : '')."</id>\n";
echo "<link rel=\"self\" type=\"application/atom+xml\" href=\"http://".
$CONF['site'].'/notes/'.$u.(!empty ($t) ? $tag : '')."\"/>\n";
echo "<icon>http://".$CONF['site']."/images/favicon.png</icon>\n";

if (!empty ($t)) {
  $db->query ("SELECT note.id, note.title, note.date, note.mstamp, note.note FROM note ".
	      "LEFT JOIN jntag ON note.id=jntag.noteid ".
	      "LEFT JOIN ntag ON (ntag.id=jntag.tagid) ".
	      "WHERE note.userid='".$userid."' AND note.public='yes' ".
	      "AND ntag.tag='".$db->escape ($t)."' ".
	      "GROUP BY note.id ORDER BY date DESC LIMIT 0,20");
}
else {
  $db->query ("SELECT id, title, date, mstamp, note FROM note ".
	      "WHERE note.userid='".$userid."' AND public='yes' ".
	      "ORDER BY date DESC LIMIT 0,20");
}
while ($db->next_record ())
{
  $pubDate = gmdate ('Y-m-d\TH:i:s\Z', strtotime ($db->f ('mstamp')));

  echo "<entry>\n";
  echo "<id>".$tagUri.'/'.$u.(!empty ($t) ? $tag : '').'/'.$db->f ('id')."</id>\n";
  echo "<updated>".$pubDate."</updated>\n";
  echo "<title>".htmlspecialchars (htmlentities2 ($db->f ('title')))."</title>\n";
  echo "<content type=\"xhtml\" xml:space=\"preserve\">\n";
  echo "<div xmlns=\"http://www.w3.org/1999/xhtml\">\n";
  echo nl2br2 (createLinks (htmlspecialchars (htmlentities2 ($db->f ('note')))))."\n";
  echo "</div>\n";
  echo "</content>\n";
  echo "</entry>\n";
}

echo "</feed>\n";

function htmlentities2 ($htmlcode) {
  static $htmlEntities;
  static $entitiesDecoded;
  static $utf8Entities;
  if (!isset ($htmlEntities))
    $htmlEntities = array_values (get_html_translation_table (HTML_ENTITIES, ENT_QUOTES));
  if (!isset ($entitiesDecoded))
    $entitiesDecoded = array_keys (get_html_translation_table (HTML_ENTITIES, ENT_QUOTES));
  if (!isset ($utf8Entities)) {
    $num = count ($entitiesDecoded);
    for ($u = 0; $u < $num; $u++)
      $utf8Entities[$u] = '&#'.ord ($entitiesDecoded[$u]).';';
  }
  return str_replace ($htmlEntities, $utf8Entities, $htmlcode);
}

function nl2br2 ($str) {
  return preg_replace ('/(\r\n|\n|\r)/', '', nl2br ($str));
}

function createLinks ($str)
{
  $lines = split ("\n", $str);
  for ($z = 0; $z < count ($lines); $z++) {
    $tmp = split (' ', $lines[$z]);
    for ($i = 0; $i < count ($tmp); $i++) {
      if (strstr ($tmp[$i], 'www.') && !strstr ($tmp[$i], 'http://'))
	$tmp[$i] = '<a href="http://'.$tmp[$i].'">'.$tmp[$i].'</a>';
      else if (strstr ($tmp[$i], 'http://') ||
	       strstr ($tmp[$i], 'https://') ||
	       strstr ($tmp[$i], 'ftp://'))
	$tmp[$i] = '<a href="'.$tmp[$i].'">'.$tmp[$i].'</a>';
      else if (strstr ($tmp[$i], '@') &&
	       $tmp[$i][0] != '@' &&
	       $tmp[$i][strlen ($tmp[$i]) - 1] != '@')
	$tmp[$i] = '<a href="mailto:'.$tmp[$i].'">'.$tmp[$i].'</a>';
    }
    $lines[$z] = join (' ', $tmp);
  }
  return join ("\n", $lines);
}

?>
