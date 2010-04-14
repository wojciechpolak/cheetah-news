<?php

/*
   Cheetah News import.php
   Copyright (C) 2005, 2006, 2010 Wojciech Polak.
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

require 'lib/include.php';

start_session (null, false);
$session->auth ('iflogged');

if ($session->status['afterlogged'] == 'yes')
{
  if ($session->email == 'guest') {
    printXmlError (null, _('You are using a guest account. You must register in order to do this.'));
    exit;
  }
  if (!isset ($_FILES['opmlfile']['tmp_name'])) {
    printXmlError (0, _('There was a problem with your upload'));
    exit;
  }
  if (is_uploaded_file ($_FILES['opmlfile']['tmp_name'])) {
    $opml =& new OPMLProcessor ();
    $res = $opml->process ($_FILES['opmlfile']['tmp_name'], $session->id);
    if ($res == 0) {
      if ($opml->isOPML)
	printXmlWithHeader ('<ok/>');
      else
	printXmlError (-3, _('The uploaded file is not an OPML.'));
    }
    else
      printXmlError ($res, _('XML Syntax Error'));
  }
  else {
    switch ($_FILES['opmlfile']['error']) {
      case 1:
      case 2:
	printXmlError ($_FILES['opmlfile']['error'],
		       _('The file you are trying to upload is too big'));
	break;
      case 3:
	printXmlError (3, _('The file was only partially uploaded'));
	break;
      case 4:
	printXmlError (4, _('No file was uploaded'));
	break;
      default:
	printXmlError (0, _('There was a problem with your upload'));
    }
  }
}
else {
  printXmlError (null, _('Operation not permitted. Access denied'));
}

class OPMLProcessor
{
  var $isOPML = false;
  var $feedId = -1;
  var $folderId = -1;
  var $insideFeed = false;
  var $insideFolder = false;
  var $titleTag = false;
  var $errorWriteFolder = false;
  var $bloglinesExp = false;
  var $text = '';
  var $xmlUrl = '';
  var $userId;
  var $db;

  function OPMLProcessor () {}

  function process ($filename, $userId)
  {
    $this->userId = $userId;

    if (!($xml_parser = xml_parser_create ()))
      return -1;

    xml_parser_set_option ($xml_parser, XML_OPTION_CASE_FOLDING, false);
    xml_set_object ($xml_parser, $this);
    xml_set_element_handler ($xml_parser, 'startElement', 'endElement');
    xml_set_character_data_handler ($xml_parser, 'characterElement');

    $this->startDocument ($xml_parser);

    $res = 0;
    $fp = fopen ($filename, 'r');
    while (!feof ($fp)) {
      $line = fgets ($fp, 4096);
      if (!xml_parse ($xml_parser, $line)) {
	$res = -2;
	break;
      }
    }
    fclose ($fp);

    $this->endDocument ($xml_parser);

    xml_parser_free ($xml_parser);
    return $res;
  }

  function startDocument ($parser) {
    $this->db = new Database ();
  }

  function endDocument ($parser) {
  }

  function startElement ($parser, $name, $attrs) {
    $this->text = '';
    $this->xmlUrl = '';

    if ($name == 'opml')
      $this->isOPML = true;
    else if ($name == 'title')
      $this->titleTag = true;

    if (!$this->errorWriteFolder) {
      if ($name == 'outline') {
	if (isset ($attrs['text']))
	  $this->text = $this->db->escape ($attrs['text']);
	else
	  $this->text = '';
	if ($this->text == '') {
	  $this->text = $this->db->escape ($attrs['title']);
	}
	if ($this->text != '') {
	  $this->text = str_replace ("\n", ' ', $this->text);
	  if (isset ($attrs['xmlUrl'])) {
	    $this->xmlUrl = $this->db->escape ($attrs['xmlUrl']);
	    if ($this->xmlUrl[strlen ($this->xmlUrl) - 1] == '/') {
	      $this->xmlUrl = substr ($this->xmlUrl, 0, -1);
	    }
	  }
	  else
	    $this->xmlUrl = '';

	  if ($this->insideFolder) {
	    $this->insideFeed = true;
	    if ($this->xmlUrl != '') { // feed in folder

	      if (!preg_match ('/^http:\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}'
			       .'((:[0-9]{1,5})?\/.*)?$/i' , $this->xmlUrl))
		return;

	      $exists = false;

	      $this->db->query ("SELECT id FROM feed WHERE url='".
				$this->xmlUrl."'");
	      if ($this->db->next_record ()) {
		$this->feedId = $this->db->f ('id');
		$this->db->query ("SELECT id FROM subscription WHERE feedid='".
				  $this->feedId."' AND userid='".$this->userId."'");
		if ($this->db->next_record ()) {
		  $exists = true;
		}
	      }
	      else {
		$this->db->query ("INSERT INTO feed SET url='".
				  $this->xmlUrl."'");
		$this->db->query ("SELECT LAST_INSERT_ID() AS id FROM feed");
		if ($this->db->next_record ()) {
		  $this->feedId = $this->db->f ('id');
		}
		else {
		  return;
		}
	      }
	      $this->db->query ("UPDATE subscription SET pri=pri+1 WHERE userid='".$this->userId."'");
	      if ($exists) {
		$this->db->query ("UPDATE subscription SET folder='".
				  $this->folderId."', ".
				  "description='".$this->text.
				  "' WHERE userid='".$this->userId."' ".
				  "AND feedid='".$this->feedId."'");
	      }
	      else {
		$this->db->query ("INSERT INTO subscription SET userid='".
				  $this->userId."', "."feedid='".
				  $this->feedId."', folder='".
				  $this->folderId."', "."description='".
				  $this->text."'");
	      }
	    }
	    else {
	      return;
	    }
	  }
	  else {
	    if ($this->xmlUrl == '') { // folder
	      if ($this->bloglinesExp && $this->text == 'Subscriptions') {
		$this->bloglinesExp = false;
		return;
	      }
	      $this->insideFolder = true;
	      $this->db->query ("SELECT id FROM folder WHERE userid='".
				$this->userId."' AND fname='".
				$this->text."'");	
	      if ($this->db->next_record ()) {
		$this->folderId = $this->db->f ('id');
		return;
	      }
	      else {
		$this->db->query ("UPDATE folder SET pri=pri+1 WHERE userid='".$this->userId."'");
		$this->db->query ("INSERT INTO folder SET userid='".
				  $this->userId."', fname='".$this->text."'");
		$this->db->query ("SELECT LAST_INSERT_ID() AS id FROM folder");
		if ($this->db->next_record ()) {
		  $this->folderId = $this->db->f ('id');
		}
		else {
		  $this->errorWriteFolder = true;
		  return;
		}
	      }
	    }
	    else { // feed without a folder
	      $this->insideFeed = true;

	      if (!preg_match ('/^http:\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}'
			       .'((:[0-9]{1,5})?\/.*)?$/i' , $this->xmlUrl))
		return;

	      $exists = false;

	      $this->db->query ("SELECT id FROM feed WHERE url='".
				$this->xmlUrl."'");
	      if ($this->db->next_record ()) {
		$this->feedId = $this->db->f ('id');
		$this->db->query ("SELECT id FROM subscription WHERE feedid='".
				  $this->feedId."' AND userid='".$this->userId."'");
		if ($this->db->next_record ()) {
		  $exists = true;
		  return;
		}
	      }
	      else {
		$this->db->query ("INSERT INTO feed SET url='".$this->xmlUrl."'");
		$this->db->query ("SELECT LAST_INSERT_ID() AS id FROM feed");
		if ($this->db->next_record ()) {
		  $this->feedId = $this->db->f ('id');
		}
		else {
		  return;
		}
	      }
	      $this->db->query ("UPDATE subscription SET pri=pri+1 WHERE folder='0' AND userid='".$this->userId."'");
	      $this->db->query ("INSERT INTO subscription (userid, feedid, description, pri) SELECT ".
				$this->userId.", ".$this->feedId.", '".
				$this->text."', COALESCE((MAX(pri) + 1), 1) ".
                                "FROM subscription WHERE folder!='0' AND userid='".$this->userId."'");
	      if ($exists) {
		$this->db->query ("DELETE FROM subscription WHERE folder!='0' AND userid='".
				  $this->userId."' AND feedid=".$this->feedId);
	      }
	    }
	  }
	}
      }
    }
  }

  function endElement ($parser, $name) {
    if ($name == 'outline') {
      if ($this->insideFeed) {
	$this->insideFeed = false;
      }
      else if ($this->insideFolder) {
	$this->insideFolder = false;
	$this->errorWriteFolder = false;
      }
    }	
  }

  function characterElement ($parser, $data) {
    if ($this->titleTag) {
      if ($data == 'Bloglines Subscriptions') {
	$this->bloglinesExp = true;
	$this->titleTag = false;
      }
    }
  }

}

?>
