<?php

/*
   Cheetah News lib/feedparser.class.php
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

class FeedParser
{
  var $xml_state = '';
  var $feedTitle = '';
  var $insideFeed    = false;
  var $insideRSS     = false;
  var $insideRDF     = false;
  var $insideTitle   = false;
  var $insideChannel = false;
  var $insideItem    = false;
  var $insideEntry   = false;
  var $insideImage   = false;

  function startElement ($parser, $element_name, $element_attributes)
  {
    $this->xml_state = $element_name;
    switch ($element_name)
    {
      case 'FEED':
	$this->insideFeed = true;
	break;
      case 'RSS':
	$this->insideRSS = true;
	break;
      case 'RDF:RDF':
	$this->insideRDF = true;
	break;
      case 'TITLE':
	$this->insideTitle = true;
	break;
      case 'CHANNEL':
	$this->insideChannel = true;
	break;
      case 'ITEM':
	$this->insideItem = true;
	break;
      case 'ENTRY':
	$this->insideEntry = true;
	break;
      case 'IMAGE':
	$this->insideImage = true;
	break;
    }
  }

  function endElement ($parser, $element_name)
  {
    $this->xml_state = '';
    switch ($element_name)
    {
      case 'FEED':
	$this->insideFeed = false;
	break;
      case 'RSS':
	$this->insideRSS = false;
	break;
      case 'RDF:RDF':
	$this->insideRDF = false;
	break;
      case 'TITLE':
	$this->insideTitle = false;
	break;
      case 'CHANNEL':
	$this->insideChannel = false;
	break;
      case 'ITEM':
	$this->insideItem = false;
	break;
      case 'ENTRY':
	$this->insideEntry = false;
	break;
      case 'IMAGE':
	$this->insideImage = false;
	break;
    }
  }

  function characterData ($parser, $data)
  {
    if ($this->insideFeed && $this->insideTitle &&
	!$this->insideEntry)
    {
      concat ($this->feedTitle, $data);
    }
    else if (($this->insideRSS || $this->insideRDF) &&
	     $this->insideChannel && $this->insideTitle &&
	     !$this->insideItem && !$this->insideImage)
    {
      concat ($this->feedTitle, $data);
    }
  }
}

function concat (&$s1, $s2 = '')
{
  if (!isset ($s1))
    $s1 = '';
  $s1 .= $s2;
}

?>
