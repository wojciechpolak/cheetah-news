<?php

/*
   Cheetah News mdb.php
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
require 'lib/feed.class.php';

start_session (null);
$session->auth ('iflogged');

postvars ('add,save,lucid,refresh,safs,oldf,feeds,folder,folders,lang,sid');

$db = null;
$feed = null;

if ($session->status['afterlogged'] == 'yes')
{
  if ($session->email == 'guest') {
    printXmlError (null, _('You are using a guest account. You must register in order to do this.'));
    exit ();
  }

  $db = new Database ();
  if (!empty ($add))
  {
    checkCSRF ($sid);

    $folder = trim (strip_tags ($folder));
    if (!empty ($folder)) {
      addFolder ();
    }
    else {
      $feed = new Feed ();
      $feed->url = $add;
      $feed->addFeed (true);
    }
  }
  else if (!empty ($save))
  {
    checkCSRF ($sid);

    if (!$lang) {
      $db->query ("SELECT lastUC FROM user WHERE id='".$session->id."'");
      if ($db->next_record ())
      {
	$lastUC = $db->f ('lastUC'); 
	if (!empty ($lastUC)) $lastUC = md5 ($lastUC);
	if ($lastUC != $lucid) {
	  printXmlError (null, _('Concurrent session in another window/browser has changed the settings. Saving terminated. Please reload.'));
	  exit ();
	}
      }
    }

    if ($refresh != '' && $safs != '' && $oldf != '')
      saveUSettings1 ();
    if (($lang))
      saveUSettings2 ();
    if (!empty ($feeds))
      saveFeeds ();
    if (!empty ($folders))
      saveFolders ();

    printXmlWithHeader ('<ok/>');
  }
}
else {
  printXmlError (null, _("Operation not permitted. Access denied"));
}

function saveUSettings1 ()
{
  global $db, $session, $refresh, $safs, $oldf;
  if (is_numeric ($refresh)) {
    if ($refresh < 0 || $refresh > 9999)
      $refresh = 0;
    else if ($refresh > 0 && $refresh < 15)
      $refresh = 15;
  }
  else
    $refresh = 0;

  checkBool ($safs);
  checkBool ($oldf);

  $db->query ("UPDATE user SET showActive='$safs', oldestFirst='$oldf', ".
	      "refresh='$refresh' WHERE id='".$session->id."'");
}

function saveUSettings2 ()
{
  global $db, $session, $lang;

  $lang = $db->escape (strip_tags ($lang));
  if ($lang == 'null') {
    $db->query ("UPDATE user SET lang=NULL WHERE id='".$session->id."'");
    $session->lang = '';
  }
  else {
    $db->query ("UPDATE user SET lang='$lang' WHERE id='".$session->id."'");
    $session->lang = $lang;
  }
  $_SESSION['session'] = $session;
}

function saveFeeds ()
{
  global $db, $session, $feeds;

  /* Get current feeds */
  $currentFeeds = array ();
  $db->query ("SELECT feedid FROM subscription WHERE userid='".$session->id."'");
  while ($db->next_record ()) {
    $currentFeeds[$db->f ('feedid')] = false;
  }

  /* Update feeds order */
  if ($feeds != 'flushAll')
  {
    $feeds_order = split (':', $feeds);
    $i = 0;
    $size = count ($feeds_order);
    foreach ($feeds_order as $feedData) {
      $feed   = split (',', $feedData);
      $feedid = $db->escape ($feed[0]);
      $desc   = $db->escape (trim (strip_tags (decodeSD ($feed[1]))));
      $folder = $db->escape ($feed[2]);
      $latest = $db->escape ($feed[3]);
      $expand = $db->escape ($feed[4]);
      $active = $db->escape ($feed[5]);
      $currentFeeds[$feedid] = true;
      $pri = $size - $i++;
      checkBool ($active);
      $db->query ("UPDATE subscription SET description='$desc', folder='$folder', ".
		  "pri='$pri', latest='$latest', expand='$expand', active='$active' ".
		  "WHERE userid='".$session->id."' AND feedid='$feedid'");
    }
  }

  /* Remove feeds */
  foreach ($currentFeeds as $feedid => $v) {
    if (!$v)
      $db->query ("DELETE FROM subscription WHERE userid='".
		  $session->id."' AND feedid='$feedid'");
  }

  $db->query ("UPDATE user SET lastUC=UTC_TIMESTAMP() WHERE id='".$session->id."'");
}

function addFolder ()
{
  global $db, $session, $folder;

  $db->query ("SELECT id FROM folder WHERE userid='".$session->id."' ".
	      "AND fname='".$db->escape ($folder)."'");
  if ($db->next_record ()) {
    printXmlError (null, _('This folder already exists.'));
    exit ();
  }

  $db->query ("INSERT INTO folder SET userid='".$session->id."', ".
	      "fname='".$db->escape ($folder)."'");
  if ($db->affected_rows () == 1)
  {
    $db->query ("SELECT LAST_INSERT_ID() as lastId FROM folder");
    if ($db->next_record ()) {
      $folderid = $db->f ('lastId');
      $db->query ("UPDATE user SET lastUC=UTC_TIMESTAMP() WHERE id='".$session->id."'");
      printXmlWithHeader ("<ok><folderid>".$folderid."</folderid><name>".
			  htmlentities ($folder)."</name></ok>");
    }
    else {
      printXmlError (null, _('Unknown error.'));
    }
  }
}

function saveFolders ()
{
  global $db, $session, $folders;

  /* Get current folders */
  $currentFolders = array ();
  $db->query ("SELECT id FROM folder WHERE userid='".$session->id."'");
  while ($db->next_record ()) {
    $currentFolders[$db->f ('id')] = false;
  }

  /* Update folders order */
  if ($folders != 'flushAll')
  {
    $folders_order = split (':', $folders);
    $i = 0;
    $size = count ($folders_order);
    foreach ($folders_order as $folderData) {
      $folder = split (',', $folderData);
      $id     = $db->escape ($folder[0]);
      $fname  = $db->escape (trim (strip_tags (decodeSD ($folder[1]))));
      if (empty ($fname))
	$fname = _('Nameless');
      $currentFolders[$id] = true;
      $pri = $size - $i++;
      $db->query ("UPDATE folder SET fname='$fname', pri='$pri' ".
		  "WHERE userid='".$session->id."' AND id='$id'");
    }
  }

  /* Remove folders */
  foreach ($currentFolders as $folderid => $v) {
    if (!$v) {
      $db->query ("DELETE FROM folder WHERE userid='".
		  $session->id."' AND id='$folderid'");
      $db->query ("UPDATE subscription SET folder='0' WHERE userid='".
		  $session->id."' AND folder='$folderid'");
    }
  }

  $db->query ("UPDATE user SET lastUC=UTC_TIMESTAMP() WHERE id='".$session->id."'");
}

?>
