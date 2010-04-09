<?php

/*
   Cheetah News weather.php
   Copyright (C) 2005, 2006, 2009 Wojciech Polak.

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

getvars ('id');

if (!empty ($id))
  start_session (null, false, 900);
else
  start_session (null);

$session->auth ('iflogged');

postvars ('q,save,rem,code,unit,desc');

class Feed
{
  var $service;
  var $code;
  var $unit;
  var $lastModified;
  var $isCached;
  var $url;

  function Feed ()
  {
    $this->service      = null;
    $this->code         = null;
    $this->unit         = null;
    $this->lastModified = null;
    $this->isCached     = false;
    $this->url          = 'http://';
  }
}

$lastModified = null;
$xml_state = '';
$inside_lastModified = false;

if ($session->status['afterlogged'] == 'yes')
{
  if ($session->email == 'guest' && (!empty ($save) || !empty ($rem))) {
    printXmlError (null, _('You are using a guest account. You must register in order to do this.'));
  }
  else {
    if (!empty ($save) && !empty ($code))
      saveLocation ();
    else if (!empty ($rem))
      remLocation ();
    else if (!empty ($id))
      getWeatherXML ($id);
    else if (isset ($_POST['q']))
      getList ();
  }
}
else {
  $msg = _('Operation not permitted. Access denied');
  if (!empty ($id))
    printXmlError (null, $msg);
  else
    printJsError ($msg);
}

function getWeatherXML ($id)
{
  global $session, $lastModified;

  $db = new Database ();
  $db->query ("SELECT * FROM weather WHERE userid='".$session->id.
	      "' AND id='".$db->escape ($id)."'");
  if ($db->next_record ())
  {
    $feed = new Feed ();
    $feed->service = $db->f ('service');
    $feed->code    = $db->f ('code');
    $feed->unit    = $db->f ('unit');

    $db->query ("SELECT * FROM weathercache WHERE code='".
		$db->escape ($feed->code)."'");
    if ($db->next_record ())
    {
      $feed->isCached = true;
      $feed->lastModified = $db->f ('lastModified');
    }

    if ($feed->isCached) {
      $pdate = strtotime ($feed->lastModified);
      if ($pdate) {
	$diff = time () - $pdate;
	if ($diff > 0 && $diff < 5400) { /* 1,5 hour */
	  printXml ($db->f ('xml'));
	  exit ();
	}
      }
    }

    if ($feed->service == 'yweather') {
      $feed->url .= 'weather.yahooapis.com/forecastrss';
      $feed->url .= '?p='.$feed->code;
      $feed->url .= '&u='.strtolower ($feed->unit);
    }

    $client = new Http ();
    $client->fetch ($feed->url);

    if ($client->status == 200) {
      $valid = isWeatherValid ($client);
      if ($valid)
      {
	if ($lastModified && $feed->lastModified != $lastModified) {
	  $feed->lastModified = $lastModified;
	  cacheWeather ($db, $feed, $client);
	}
	printXml ($client->xml);
      }
      else {
	printXmlError (null, _('Broken XML feed. Verify ').'&lt;a href="'.
		       htmlspecialchars ($feed->url).'" target="'.
		       htmlspecialchars ($feed->url).'"&gt;'.
		       htmlspecialchars ($feed->url).'&lt;/a&gt;');
      }
    }
    else {
      switch ($client->status) {
        case 404:
	  printXmlError (404, _('The requested URL was not found on this server'));
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
    printXmlError (404, _('Bad Id'));
  }
}

function saveLocation () {
  global $session, $save, $id, $code, $unit, $desc;
  $db = new Database ();

  $service = 'yweather';
  $id   = $db->escape ($id);
  $code = strtoupper ($db->escape ($code));
  $unit = strtoupper ($db->escape ($unit));
  $desc = $db->escape (htmlspecialchars (strip_tags ($desc), ENT_NOQUOTES));
  if (empty ($desc))
    $desc = $code;

  if (!preg_match ('/^[A-Z]{4}[0-9]{4}$/', $code)) {
    printXmlError (null, _('Invalid location ID'));
    exit ();
  }
  if ($unit != 'C' && $unit != 'F')
    $unit = 'C';

  if (!empty ($id)) {
    $db->query ("UPDATE weather SET code='$code', unit='$unit', description='$desc' ".
		"WHERE userid='".$session->id."' AND id='$id'");
  }
  else {
    $db->query ("INSERT INTO weather SET userid='".$session->id."', service='$service', ".
		"code='$code', unit='$unit', description='$desc'");
  }
  printXmlWithHeader ('<ok/>');
}

function remLocation () {
  global $session, $rem, $code;
  $db = new Database ();

  $rem = $db->escape ($rem);
  $db->query ("DELETE FROM weather WHERE userid='".$session->id."' AND id='$rem'");
  printXmlWithHeader ('<ok/>');
}

function getList ()
{
  global $session;
  $db = new Database ();

  header ('Content-Type: application/x-javascript; charset=UTF-8');

  $db->query ("SELECT * FROM weather WHERE userid='".$session->id."'");
  $i = 1; $end = $db->num_rows ();
  if ($end > 0) {
    echo "cheetahWeather = {\n";
    while ($db->next_record ()) {
      echo "  '".$db->f ('id')."' : ['".encodeJsEntities ($db->f ('description')).
	"', '".encodeJsEntities ($db->f ('code')).
	"', '".encodeJsEntities ($db->f ('unit'))."']";
      if ($i++ < $end) echo ',';
      echo "\n";
    }
    echo "};\n";
  }
  else {
    echo "cheetahWeather = null;\n";
  }
}

function isWeatherValid (&$client)
{
  $xml_parser = xml_parser_create ();
  xml_set_element_handler ($xml_parser, 'startElement', 'endElement');
  xml_set_character_data_handler ($xml_parser, 'characterData');
  $ret = @xml_parse ($xml_parser, $client->xml, true);
  xml_parser_free ($xml_parser);
  return $ret;
}

function startElement ($parser, $element_name, $element_attributes)
{
  global $xml_state, $inside_lastModified;
  $xml_state = $element_name;

  switch ($element_name)
  {
    case 'LASTBUILDDATE':
      $inside_lastModified = true;
      break;
  }
}

function endElement ($parser, $element_name)
{
  global $xml_state, $inside_lastModified;
  $xml_state = '';

  switch ($element_name)
  {
    case 'LASTBUILDDATE':
      $inside_lastModified = false;
      break;
  }
}

function characterData ($parser, $data)
{
  global $xml_state, $inside_lastModified, $lastModified;

  if ($inside_lastModified)
  {
    switch ($xml_state)
    {
      case 'LASTBUILDDATE':
	$lastModified = trim ($data);
	break;
    }
  }
}

function cacheWeather (&$db, &$feed, &$client)
{
  if ($feed->isCached) {
    $db->query ("UPDATE weathercache SET lastModified='".$feed->lastModified."', lastAccessed=UTC_TIMESTAMP(), ".
		"xml='".$db->escape ($client->xml)."' WHERE code='".$feed->code."'");
  }
  else {
    $db->query ("INSERT INTO weathercache SET code='".$feed->code."', ".
		"lastModified='".$feed->lastModified."', lastAccessed=UTC_TIMESTAMP(), ".
		"xml='".$db->escape ($client->xml)."'");
  }
}

?>
