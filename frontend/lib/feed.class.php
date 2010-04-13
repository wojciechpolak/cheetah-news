<?php

/*
   Cheetah News lib/feed.class.php
   Copyright (C) 2005, 2006, 2008, 2010 Wojciech Polak.

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

require_once 'lib/feedparser.class.php';

class Feed
{
  var $id;
  var $hash;
  var $url;
  var $lastModified;
  var $eTag;
  var $description;
  var $isNewGlobal;
  var $isCached;

  function Feed ()
  {
    $this->id           = null;
    $this->hash         = null;
    $this->url          = null;
    $this->lastModified = null;
    $this->eTag         = null;
    $this->description  = null;
    $this->isNewGlobal  = true;
    $this->isCached     = false;
  }

  function addFeed ($subscribe_it = false)
  {
    if (!strstr ($this->url, '://'))
      $this->url = 'http://' . $this->url;

    $client = new Http ();
    $this->checkCached ($client, $subscribe_it);
    $client->fetch ($this->url);

    if (!@array_key_exists ('Content-Type', $client->headers))
      $client->headers[] = '';

    if ($client->status == 200)
    {
      if (preg_match ('/<\?xml version=[\'"].*?[\'"].*?\?>/m', $client->xml) &&
	  !matchContentType ($client->headers['Content-Type'],
			     array ('text/html', 'application/xhtml+xml')))
      {
	if (isFeedValid ($client)) {
	  recodeToUTF8 ($client->xml);
	  alterXML ($client->xml);
	  $this->cache ($client);
	  if ($subscribe_it)
	    $this->subscribe ();
	}
	else
	  printXmlError (null, _('XML Syntax Error. Verify the given URL'));
      }
      else if ((preg_match ('/^<rss version=".*?".*?>/im', $client->xml) ||
		preg_match ('|^<feed xmlns="http://www.w3.org/2005/Atom".*?>|im', $client->xml)) &&
	       matchContentType ($client->headers['Content-Type'],
				 array ('text/xml',
					'application/xml',
					'application/rss+xml',
					'application/rdf+xml',
					'application/atom+xml')))
      {
	/* invalid xml type, but this is common */
	if (isFeedValid ($client)) {
	  recodeToUTF8 ($client->xml);
	  alterXML ($client->xml);
	  $this->cache ($client);
	  if ($subscribe_it)
	    $this->subscribe ();
	}
	else
	  printXmlError (null, _('XML Syntax Error. Verify the given URL'));
      }
      else if (preg_match_all ('/<link(.*?)>/is', $client->xml, $links))
      {
	$xmlLink = false;
	foreach ($links[1] as $link)
	{
	  if (preg_match ('/rel=[\'"]alternate[\'"]/i', $link)) {
	    if (preg_match ('/type=[\'"](.*?)[\'"]/i', $link, $type)) {
	      if ($type[1] == 'application/rss+xml' ||
		  $type[1] == 'application/atom+xml' ||
		  $type[1] == 'application/rdf+xml' ||
		  $type[1] == 'application/xml') {
		if (preg_match ('/href=[\'"](.*?)[\'"]/i', $link, $href))
		{
		  if (preg_match ('|^http://|i', $href[1]))
		  {
		    $this->url = $href[1];
		    $xmlLink = true;
		  }
		  else if ($href[1][0] != '/') /* relative path */
		  {
		    if ($this->url[strlen ($this->url) - 1] != '/')
		      $this->url .= '/';
		    $this->url .= $href[1];
		    $xmlLink = true;
		  }
		  else if ($href[1][0] == '/' && $href[1][1] != '/')
		  {
		    $url_parts = parse_url ($this->url);
		    $this->url = $url_parts['scheme'].'://'.$url_parts['host'].$href[1];
		    $xmlLink = true;
		  }
		  else if ($href[1][0] == '/' && $href[1][1] == '/')
		  {
		    $this->url = 'http:'.$href[1];
		    $xmlLink = true;
		  }
		  break;
		}
	      }
	    }
	  }
	}
	if ($xmlLink)
	{
	  $this->checkCached ($client, $subscribe_it);
	  $client->fetch ($this->url);

	  if ($client->status == 200)
	  {
	    if (preg_match ('/<\?xml version=[\'"].*?[\'"].*?\?>/m', $client->xml))
	    {
	      if (isFeedValid ($client)) {
		recodeToUTF8 ($client->xml);
		alterXML ($client->xml);
		$this->cache ($client);
		if ($subscribe_it)
		  $this->subscribe ();
	      }
	      else
		printXmlError (null, _('XML Syntax Error. Verify the given URL'));
	    }
	    else
	      printXmlError (null, _('This is not a valid XML resource'));
	  }
	  else if ($client->status == 304) { /* Not Modified */
	    if ($subscribe_it)
	      $this->subscribe ();
	  }
	  else {
	    $this->failsafe ($client->status, $client->error);
	    exit ();	    
	  }
	}
	else {
	  printXmlError (null, _('This is not a valid feed'));
	  exit ();
	}
      }
      else {
	printXmlError (null, _('This is not a valid feed'));
	exit ();
      }
    }
    else if ($client->status == 304) { /* Not Modified */
      if ($subscribe_it)
	$this->subscribe ();
    }
    else {
      $this->failsafe ($client->status, $client->error);
      exit ();
    }
  }

  function failsafe ($status, $error) {
    switch ($status)
    {
      case 401:
	printXmlError (401, _('Unauthorized'));
	break;
      case 403:
	printXmlError (403, _('Forbidden'));
	break;
      case 404:
	printXmlError (404, _('Resource Not Found'));
	break;
      case 500:
	printXmlError (500, _('Internal Server Error'));
	break;
      case 503:
	printXmlError (503, _('Service Unavailable'));
	break;
      case -100:
	printXmlError (504, _('Request timed out'));
	break;
      case 20:
	printXmlError (20, _('Network is unreachable'));
	break;
      default:
	printXmlError ($status, $error);
    }
  }

  function checkCached (&$client, $subscribe_it = false)
  {
    global $db, $session;

    $url = $this->url;
    if ($url[strlen ($url) - 1] == '/')
      $url = substr ($url, 0, -1);

    $db->query ("SELECT id, description FROM feed WHERE url='".$db->escape ($url)."'");
    if ($db->next_record ())
    {
      $this->isNewGlobal = false;
      $this->id = $db->f ('id');
      $this->description = $db->f ('description');

      if ($subscribe_it) {
	$db->query ("SELECT id FROM subscription WHERE userid='".
		    $session->id."' AND feedid='".$this->id."'");
	if ($db->next_record ()) {
	  printXmlError (null, _('You are already subscribed to this feed'));
	  exit ();
	}
      }
      
      $db->query ("SELECT lastModified, eTag FROM cache WHERE feedid='".$this->id."'");
      if ($db->next_record ())
      {
	$this->lastModified = $db->f ('lastModified');
	if ($this->lastModified)
	  $client->rawheaders['If-Modified-Since'] = $this->lastModified;
	$this->eTag = $db->f ('eTag');
	if ($this->eTag)
	  $client->rawheaders['If-None-Match'] = $this->eTag;
      }
    }
    else {
      $this->isNewGlobal = true;
    }
  }

  function cache (&$client)
  {
    global $db;

    $cDescription = $this->description;

    // get description from xml
    $feed_parser = new FeedParser ();
    $xml_parser  = xml_parser_create ('UTF-8');
    xml_set_object ($xml_parser, $feed_parser);
    xml_set_element_handler ($xml_parser, 'startElement', 'endElement');
    xml_set_character_data_handler ($xml_parser, 'characterData');
    if (xml_parse ($xml_parser, $client->xml, true))
    {
      if (!empty ($feed_parser->feedTitle))
	$this->description = trim ($feed_parser->feedTitle);
    }
    xml_parser_free ($xml_parser);

    if ($this->isNewGlobal)
    {
      if ($this->url[strlen ($this->url) - 1] == '/') {
	$this->url = substr ($this->url, 0, -1);
      }
      $url_parts = parse_url ($this->url);
      $url = $url_parts['host'].(!empty ($url_parts['path']) ? $url_parts['path'] : '');
      $this->hash = md5 ($url);

      if (empty ($this->description)) {
	$this->description = $url;
      }
      $this->description = str_replace ("\n", ' ', $this->description);

      $db->query ("INSERT INTO feed SET hash='".$this->hash."', url='".$this->url."', ".
		  "description='".$db->escape ($this->description)."'");
      if ($db->affected_rows () == 1)
      {
	$db->query ("SELECT LAST_INSERT_ID() as lastId FROM feed");
	if ($db->next_record ()) {
	  $this->id = $db->f ('lastId');
	}
	else {
	  printXmlError (null, _('Unknown error.'));
	}
      }
    }
    else { /* already in feed table */
      if ($this->description != $cDescription) {
	$this->description = str_replace ("\n", ' ', $this->description);
	$db->query ("UPDATE feed SET description='".$db->escape ($this->description)."' ".
		    "WHERE id='".$this->id."'");
      }
    }

    if (array_key_exists ('Last-Modified', $client->headers) &&
	array_key_exists ('ETag', $client->headers))
    {
      $this->lastModified = $client->headers['Last-Modified'];
      $this->eTag = $client->headers['ETag'];

      if ($this->isNewGlobal)
      {
	$db->query ("INSERT INTO cache SET feedid='".$this->id."', ".
		    "eTag='".$this->eTag."', lastModified='".$this->lastModified."', ".
		    "lastAccessed=UTC_TIMESTAMP(), xml='".
		    $db->escape (gzcompress ($client->xml))."'");
      }
      else
      {
	$db->query ("UPDATE cache SET eTag='".$this->eTag."', ".
		    "lastModified='".$this->lastModified."', lastAccessed=UTC_TIMESTAMP(), ".
		    "xml='".$db->escape (gzcompress ($client->xml))."' ".
		    "WHERE feedid='".$this->id."'");
      }
    }
  }

  function cache2 (&$client)
  {
    global $db;

    if (!array_key_exists ('Last-Modified', $client->headers) ||
	!array_key_exists ('ETag', $client->headers))
      return;

    if ($this->isCached)
    {
      $db->query ("UPDATE cache SET eTag='".$this->eTag."', ".
		  "lastModified='".$this->lastModified."', lastAccessed=UTC_TIMESTAMP(), ".
		  "xml='".$db->escape (gzcompress ($client->xml)).
		  "' WHERE feedid='".$this->id."'");
    }
    else {
      $db->query ("INSERT INTO cache SET feedid='".$this->id."', eTag='".$this->eTag."', ".
		  "lastModified='".$this->lastModified."', lastAccessed=UTC_TIMESTAMP(), ".
		  "xml='".$db->escape (gzcompress ($client->xml))."'");
    }
  }

  function subscribe ()
  {
    global $db, $session;
    if (empty ($this->description))
      $this->description = $this->url;
    $this->description = str_replace ("\n", ' ', $this->description);
    $db->query ("INSERT INTO subscription SET userid='".$session->id."', ".
		"feedid='".$this->id."', description='".
		$db->escape ($this->description)."'");
    $db->query ("UPDATE user SET lastUC=UTC_TIMESTAMP() WHERE id='".$session->id."'");
    printXmlWithHeader ('<ok><feedid>'.$this->id.'</feedid><description>'.
			htmlentities ($this->description).'</description></ok>');
  }
}

function isFeedValid (&$client)
{
  $xml_parser = xml_parser_create ();
  $ret = @xml_parse ($xml_parser, $client->xml, true);
  xml_parser_free ($xml_parser);
  return $ret;
}

function matchContentType ($h, $types=array())
{
  $p = strpos ($h, ';');
  if ($p !== false) {
    $h = substr ($h, 0, $p);
  }
  return in_array ($h, $types);
}

?>
