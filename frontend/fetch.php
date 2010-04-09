<?php

/*
   Cheetah News fetch.php
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

require 'lib/include.php';
require 'lib/feed.class.php';

start_session (null, false, 180);
$session->auth ('iflogged');

getvars ('feedid,feedurl');

$db = null;
$feed = null;
$clientCacheLastModified = null;
$clientCacheETag = null;

if ($session->status['afterlogged'] == 'yes')
{
  $db = new Database ();
  
  if (isset ($_POST['gs']))
  {
    $folders = array ();
    $db->query ("SELECT f.id, f.fname FROM folder f ".
		"WHERE f.userid = '".$session->id."' ORDER BY pri DESC");
    while ($db->next_record ()) {
      $folders[$db->f ('id')] = $db->f ('fname');
    }

    $safs = 0;
    $oldestFirst = 0;
    $refresh = 0;
    $invitation = 0;
    $lucid = '';
    $db->query ("SELECT showActive,oldestFirst,refresh,invitation,lastUC ".
		"FROM user WHERE id='".$session->id."'");
    if ($db->next_record ()) {
      $safs = $db->f ('showActive');
      $oldestFirst = $db->f ('oldestFirst');
      $refresh = $db->f ('refresh');
      $invitation = $db->f ('invitation');
      $lucid = $db->f ('lastUC');
      if (!empty ($lucid)) $lucid = md5 ($lucid);
    }

    $feedAddUrl = null;
    $feedAddSid = null;
    $db->query ("SELECT url FROM feedaddqueue WHERE userid='".
		$session->id."'");
    if ($db->next_record ()) {
      $feedAddUrl = $db->f ('url');
      $db->query ("SELECT f.id FROM feed f, subscription s WHERE f.url='".
		  $feedAddUrl."' AND f.id=s.feedid");
      if ($db->next_record ())
	$feedAddSid = $db->f ('id');
      $db->query ("DELETE LOW_PRIORITY FROM feedaddqueue WHERE userid='".
		  $session->id."'");
    }

    $db->query ("SELECT s.feedid, s.latest, s.expand, s.folder, ".
		"s.active, s.description, f.url FROM subscription s, feed f ".
		"WHERE f.id=s.feedid AND s.userid='".$session->id.
		"' ORDER BY pri DESC");
    
    header ('Content-Type: application/x-javascript; charset=UTF-8');
    echo "cheetahData = new function () {
  this.lucid = '$lucid';
  this.lang = '".$session->lang."';
  this.safs = $safs;
  this.oldf = $oldestFirst;
  this.frequency = $refresh;
  this.invitation = $invitation;\n";
    if ($feedAddSid)
      echo "  this.feedAddSid = '".encodeJsEntities ($feedAddSid)."';\n";
    else if ($feedAddUrl)
      echo "  this.feedAddUrl = '".encodeJsEntities ($feedAddUrl)."';\n";

    echo "  this.folderOrder = [";
    $end = count ($folders);
    $i = 1;
    foreach ($folders as $k => $v) {
      echo $k;
      if ($i++ < $end)
	echo ',';
    }
    echo "];\n";

    echo "  this.folders = {\n";
    $i = 1;
    foreach ($folders as $k => $v) {
      echo "   '".$k."' : '".encodeJsEntities ($v)."'";
      if ($i++ < $end)
	echo ",\n";
    }
    echo " };\n";

    echo "  this.feedOrder = [";
    $end = $db->num_rows ();
    $i = 1;
    while ($db->next_record ()) {
      echo $db->f ('feedid');
      if ($i++ < $end)
	echo ',';
    }
    echo "];\n";

    echo "  this.feeds = {\n";
    $db->data_seek (0);
    $i = 1;
    while ($db->next_record ())
    {
      echo "   '".$db->f ('feedid')."' : ['".
	encodeJsEntities ($db->f ('description'))
	."','".$db->f ('folder')."',".$db->f ('latest')
	.",".$db->f ('expand').",".$db->f ('active').",'".$db->f ('url')."']";
      if ($i++ < $end)
	echo ",\n";
    }
    echo " };
};";
  }

  // feed fetch
  else if ($feedid || $feedurl)
  {
    if (!empty ($feedurl)) {
      $db->query ("SELECT f.id AS feedid, f.url FROM feed AS f WHERE f.url='".
		  $db->escape ($feedurl)."'");
      if (!$db->next_record ()) {
	$feed = new Feed ();
	$feed->url = $feedurl;
	$feed->addFeed ();
	$feedid = $feed->id;
	$db->query ("SELECT f.id AS feedid, f.url FROM feed AS f WHERE f.id='".$feedid."'");
      }
      else {
	$db->data_seek (0);
      }
    }
    else {
      $db->query ("SELECT s.feedid, f.url FROM subscription AS s, feed AS f ".
		  "WHERE s.userid = '".$session->id.
		  "' AND s.feedid = f.id AND f.id='".
		  $db->escape ($feedid)."'");
    }

    if ($db->next_record ())
    {
      $feed = new Feed ();
      $feed->id  = $db->f ('feedid');
      $feed->url = $db->f ('url');
      $client = new Http ();

      $headers = getallheaders ();
      if (array_key_exists ('If-Modified-Since', $headers) &&
	  array_key_exists ('If-None-Match', $headers))
      {
	$clientCacheLastModified = $headers['If-Modified-Since'];
	$clientCacheETag = $headers['If-None-Match'];
      }

      $db->query ("SELECT * FROM cache WHERE feedid='".$feed->id."'");
      if ($db->next_record ())
      {
	$feed->isCached = true;
	$feed->lastModified = $db->f ('lastModified');
	$feed->eTag = $db->f ('eTag');
      }

      if ($feed->isCached) {
	$pdate = strtotime ($feed->lastModified);
	if ($pdate) {
	  $diff = time () - $pdate;
	  if ($diff < 900) { /* 15 minutes */
	    if ($clientCacheLastModified == $feed->lastModified &&
		$clientCacheETag == $feed->eTag) {
	      header ('HTTP/1.1 304 Not Modified');
	    }
	    else {
	      header ('Last-Modified: ' . $feed->lastModified);
	      header ('ETag: ' . $feed->eTag);
	      printXml (gzuncompress ($db->f ('xml'))); // from cache
	    }
	    exit ();
	  }
	}
      }

      if ($feed->lastModified && $feed->eTag)
      {
	$client->rawheaders['If-Modified-Since'] = $feed->lastModified;
	$client->rawheaders['If-None-Match'] = $feed->eTag;
      }

      $client->fetch ($feed->url);
  
      if ($client->status == 200)
      {
	$valid = isFeedValid ($client);
	if (!$valid) {
	  $client->xml = preg_replace ('/[\x-\x8\xb-\xc\xe-\x1f]/ms',
				       '', $client->xml);
	  $valid = isFeedValid ($client);
	}
	if ($valid)
	{
	  if (array_key_exists ('Last-Modified', $client->headers) &&
	      array_key_exists ('ETag', $client->headers))
	  {
	    $feed->lastModified = $client->headers['Last-Modified'];
	    $feed->eTag = $client->headers['ETag'];
	    header ('Last-Modified: ' . $feed->lastModified);
	    header ('ETag: ' . $feed->eTag);
	  }
	  else {
	    $lastModified = gmdate ('D, d M Y H:i:s T');
	    header ('Last-Modified: ' . $lastModified);
	    header ('ETag: ' . '"'.md5 ($lastModified).'"');
	  }
	  recodeToUTF8 ($client->xml);
	  alterXML ($client->xml);
	  $feed->cache2 ($client);
	  printXml ($client->xml);
	}
	else {
	  printXmlError (null, _('Broken XML feed. Verify ').'&lt;a href="'.
			 htmlspecialchars ($feed->url).'" target="'.
			 htmlspecialchars ($feed->url).'"&gt;'.
			 htmlspecialchars ($feed->url).'&lt;/a&gt;');
	}
      }
      else if ($client->status == 304) /* Not Modified */
      {
	if ($clientCacheLastModified == $feed->lastModified &&
	    $clientCacheETag == $feed->eTag)
	{
	  header ('HTTP/1.1 304 Not Modified');
	  exit ();
	}
	else {
	  header ('Last-Modified: ' . $feed->lastModified);
	  header ('ETag: ' . $feed->eTag);
	  printXml (gzuncompress ($db->f ('xml'))); // from cache
	}
      }
      else {
	switch ($client->status) {
	  case 404:
	    printXmlError (404, _('The requested URL was not found on this server').': '.
			   '&lt;a href="'.htmlspecialchars ($feed->url).'" target="'.
			   htmlspecialchars ($feed->url).'"&gt;'.
			   htmlspecialchars ($feed->url).'&lt;/a&gt;');
	    break;
	  case -100:
	    printXmlError (504, _('Request timed out'));
	    break;
	  case 110:
	    printXmlError (110, _('Connection timed out'));
	    break;
	  case 111:
	    printXmlError (111, _('Connection refused'));
	    break;
	  case 112:
	    printXmlError (112, _('Host is down'));
	    break;
	  case 113:
	    printXmlError (113, _('No route to host'));
	    break;
	  case 500:
	    printXmlError (500, _('Internal server error on remote host'));
	    break;
	  case 20:
	    printXmlError (20, _('Network is unreachable'));
	    break;
	  default:
	    printXmlError ($client->status, _('Unknown error'));
	}
      }
    }
    else {
      printXmlError (404, _('Bad feedId'));
    }
  }
}
else {
  $msg = _('Operation not permitted. Access denied');
  if (isset ($_POST['gs']))
    printJsError ($msg);
  else
    printXmlError (null, $msg);
}

?>
