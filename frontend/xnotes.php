<?php

/*
   Cheetah News xnotes.php
   Copyright (C) 2005, 2006, 2007 Wojciech Polak.

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

start_session (null);
$session->auth ('iflogged');

postvars ('q,nid,save,rem,color,public,date,title,note,tags');

$db = null;

if ($session->status['afterlogged'] == 'yes')
{
  if ($session->email == 'guest' && (!empty ($save) || !empty ($rem))) {
    printXmlError (null, _('You are using a guest account. You must register in order to do this.'));
  }
  else {
    $db = new Database ();
    if (!empty ($save))
      saveNote ();
    else if (!empty ($rem))
      remNote ();
    else if (!empty ($nid))
      getNote ();
    else if (isset ($_POST['nt'])) {
      header ('Content-Type: application/x-javascript; charset=UTF-8');
      getNoteTags ();
    }
    else if (isset ($_POST['q']))
      getNoteList ();
  }
}
else {
  $msg = _('Operation not permitted. Access denied');
  if (!empty ($save) || !empty ($rem))
    printXmlError (null, $msg);
  else
    printJsError ($msg);
}

function getNote ()
{
  global $session, $db, $nid;
  $tags = array ();

  header ('Content-Type: application/x-javascript; charset=UTF-8');

  $nid = $db->escape ($nid);
  $db->query ("SELECT tag FROM ntag, jntag WHERE jntag.userid='".$session->id."' ".
	      "AND jntag.tagid=ntag.id AND jntag.noteid='".$nid."' ORDER BY ntag.id");
  while ($db->next_record ()) {
    $tags[] = $db->f ('tag');
  }

  $db->query ("SELECT public,color,date,title,note FROM note ".
	      "WHERE userid='".$session->id."' AND id='".$nid."'");
  if ($db->next_record ()) {
    $public = $db->f ('public');
    $color  = $db->f ('color');
    $date   = $db->f ('date');
    $title  = $db->f ('title');
    $note   = $db->f ('note');

    echo "cheetahNote = {\n";
    echo "  'title'  : '".encodeJsEntities ($title)."',\n";
    echo "  'public' : '".$public."',\n";
    echo "  'color'  : '".$color."',\n";
    echo "  'date'   : '".$date."',\n";
    echo "  'tags'   : [";
    $i = 1; $end = count ($tags);
    foreach ($tags as $tag) {
      echo "'".encodeJsEntities ($tag)."'";
      if ($i++ < $end) echo ',';
    }
    echo "],\n";
    echo "  'note'   : '".encodeJsEntities (nl2br2 ($note))."'\n";
    echo "};\n";
  }
  else {
    echo "cheetahNote = null;\n";
  }
}

function getNoteList ()
{
  global $session, $db, $q;
  $query = '';

  header ('Content-Type: application/x-javascript; charset=UTF-8');

  /* list user tags */
  getNoteTags ();

  /* list note summary */
  if (!empty ($q))
    $query = " AND ntag.tag='".$db->escape ($q)."'";

  $db->query ("SELECT note.id, note.public, note.color, note.title, note.date, ".
	      "GROUP_CONCAT(ntag.tag) tags FROM note ".
              "LEFT JOIN jntag ON note.id=jntag.noteid ".
	      "LEFT JOIN ntag ON (ntag.id=jntag.tagid) ".
	      "WHERE note.userid='".$session->id."'".$query.' '.
	      "GROUP BY note.id ORDER BY date DESC");

  $i = 1; $end = $db->num_rows ();
  if ($end > 0) {
    echo "cheetahNoteList = {\n";
    while ($db->next_record ()) {
      echo "  '".$db->f ('id')."' : ['".encodeJsEntities ($db->f ('color')).
	"', '".encodeJsEntities ($db->f ('title')).
	"', '".encodeJsEntities ($db->f ('date')).
	"', '".encodeJsEntities ($db->f ('public')).
	"', '".encodeJsEntities ($db->f ('tags'))."']";
      if ($i++ < $end) echo ',';
      echo "\n";
    }
    echo "};\n";
  }
  else {
    echo "cheetahNoteList = null;\n";
  }
}

function getNoteTags ()
{
  global $session, $db;

  /* list user tags */
  $db->query ("SELECT tag FROM ntag, jntag WHERE jntag.userid='".$session->id."' ".
	      "AND ntag.id=jntag.tagid GROUP BY ntag.id ORDER BY tag;");
  $i = 1; $end = $db->num_rows ();
  if ($end > 0) {
    echo "cheetahNoteTags = [";
    while ($db->next_record ()) {
      echo "'".encodeJsEntities ($db->f ('tag'))."'";
      if ($i++ < $end) echo ',';
    }
    echo "];\n";
  }
  else {
    echo "cheetahNoteTags = null;\n";
  }
}

function saveNote ()
{
  global $session, $db;
  global $nid, $color, $public, $date, $title, $note, $tags;

  $ptags = array ();
  $ntags = array ();
  $atags = split (',', htmlspecialchars (strip_tags ($tags), ENT_NOQUOTES));
  $atags = array_unique ($atags);
  foreach ($atags as $tag)
  {
    $tag = trim ($tag);
    if (empty ($tag))
      continue;

    $db->query ("SELECT id FROM ntag WHERE tag='".$db->escape ($tag)."'");
    if ($db->next_record ())
      $ntags[$tag] = $db->f ('id');
    else {
      $db->query ("INSERT INTO ntag SET tag='".$db->escape ($tag)."'");
      $db->query ("SELECT LAST_INSERT_ID() AS lastid FROM ntag");
      if ($db->next_record ())
	$ntags[$tag] = $db->f ('lastid');
    }
  }

  if ($color == '') $color = '#ffffff';
  if ($public == '') $public = 'no';

  $nid    = $db->escape ($nid);
  $public = $db->escape ($public);
  $color  = $db->escape ($color);
  $date   = $db->escape ($date);
  $title  = $db->escape (htmlspecialchars (strip_tags ($title), ENT_NOQUOTES));
  $note   = $db->escape (br2nl ($note));

  if (empty ($nid))
  {
    $db->query ("INSERT INTO note SET userid='".$session->id."', public='".$public."', ".
		"color='".$color."', date='".$date."', title='".$title."', note='".$note."'");
    $db->query ("SELECT LAST_INSERT_ID() AS lastid FROM note");
    if ($db->next_record ())
      $nid = $db->f ('lastid');
  }
  else {
    /* previous tags */
    $db->query ("SELECT ntag.id, ntag.tag FROM ntag, jntag ".
		"WHERE jntag.userid='".$session->id."' ".
		"AND jntag.tagid=ntag.id AND jntag.noteid='".$nid."'");
    while ($db->next_record ()) {
      $ptags[$db->f ('id')] = false;
    }

    $db->query ("UPDATE note SET public='".$public."', color='".$color."', ".
		"title='".$title."', note='".$note."' ".
		"WHERE userid='".$session->id."' AND id='".$nid."'");
  }

  foreach ($ntags as $n => $tagid) {
    if (!array_key_exists ($tagid, $ptags)) {
      $db->query ("INSERT INTO jntag SET userid='".$session->id."', ".
		  "noteid='".$nid."', tagid='".$db->escape ($tagid)."'");
    }
    $ptags[$tagid] = true;
  }

  foreach ($ptags as $tagid => $used) {
    if (!$used) {
      $db->query ("DELETE FROM jntag WHERE userid='".$session->id."' ".
		  "AND noteid='".$nid."' AND tagid='".$db->escape ($tagid)."'");
    }
  }

  printXmlWithHeader ('<ok/>');
}

function remNote ()
{
  global $session, $db, $rem;

  $rem = $db->escape ($rem);
  $db->query ("DELETE FROM note WHERE userid='".$session->id."' AND id='".$rem."'");
  $db->query ("DELETE FROM jntag WHERE userid='".$session->id."' AND noteid='".$rem."'");

  printXmlWithHeader ('<ok/>');
}

function br2nl ($str) {
  return preg_replace ("|<br */?>|i", "\n", $str);
}

function nl2br2 ($str) {
  return preg_replace ('/(\r\n|\n|\r)/', '', nl2br ($str));
}

?>
