<?php

/*
   Cheetah News lib/http.class.php
   Copyright (C) 2005, 2006, 2015 Wojciech Polak.
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

class Http
{
  var $host;
  var $port  = 80;
  var $agent = 'Mozilla/5.0 (http://www.cheetah-news.com/)';

  var $rawheaders = array ();   // array of raw headers to send
  var $maxredirs        = 5;    // http redirection depth maximum. 0 = disallow
  var $lastredirectaddr	= '';   // contains address of last redirected address
  var $offsiteok        = true; // allows redirection off-site
  var $user             = '';   // user for http authentication
  var $pass             = '';   // password for http authentication

  var $accept = 'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,*/*;q=0.5';
  var $acceptLanguage = 'en-us,en;q=0.5';
  var $acceptCharset  = 'utf-8,*;q=0.9';

  var $xml = '';           // where the xml is put
  var $error = '';         // error messages sent here
  var $response_code = ''; // response code returned from server
  var $headers = array (); // headers returned from server sent here
  var $maxlength = 300000; // max return data length (body)
  var $read_timeout = 45;  // timeout on read operations, in seconds
  var $timed_out = false;  // if a read operation timed out
  var $status = 0;         // http request status
  var $use_gzip = true;	

  var $_maxlinelen = 4096;    // max line length (headers)
  var $_redirectaddr = false; // will be set if page fetched is a redirect
  var $_redirectdepth =	0;    // increments on an http redirect
  var $_fp_timeout = 10;      // timeout for socket connection

  function fetch ($url)
  {
    $url_parts = parse_url ($url);
    if (empty ($url_parts['scheme']))
      $url_parts['scheme'] = 'http';
    if (!empty ($url_parts['user']))
      $this->user = $url_parts['user'];
    if (!empty ($url_parts['pass']))
      $this->pass = $url_parts['pass'];
    if (empty ($url_parts['query']))
      $url_parts['query'] = '';

    if ($url_parts['scheme'] == 'feed')
      $url_parts['scheme'] = 'http';

    switch ($url_parts['scheme'])
    {
      case 'http':
      case 'https':
	$this->host = $url_parts['host'];
	if (!empty ($url_parts['port']))
	  $this->port = $url_parts['port'];

	if ($url_parts['scheme'] == 'https') {
	  $this->host = 'ssl://'.$this->host;
	  $this->port = 443;
	}
	
	if ($this->_connect ($fp))
	{
	  $path = (!empty ($url_parts['path']) ? $url_parts['path'] : '')
	          .($url_parts['query'] ? '?'.$url_parts['query'] : '');

	  $this->_httprequest ($path, $fp, $url);
	  $this->_disconnect ($fp);

	  if ($this->_redirectaddr)
	  {
	    /* URL was redirected, check if we've hit the max depth */
	    if ($this->maxredirs > $this->_redirectdepth)
	    {
	      // only follow redirect if it's on this site, or offsiteok is true
	      if (preg_match ("|^https?://".preg_quote ($this->host)."|i",
			      $this->_redirectaddr) || $this->offsiteok)
	      {
		/* follow the redirect */
		$this->_redirectdepth++;
		$this->lastredirectaddr = $this->_redirectaddr;
		$this->fetch ($this->_redirectaddr);
	      }
	    }
	  }
	}
	else
	{
	  return false;
	}
	return true;
	break;
      default:
	$this->error = 'Invalid protocol "'.$url_parts['scheme'].'"';
	return false;
	break;
    }
    return true;
  }

  function _httprequest ($path, $fp, $url)
  {
    $this->host = str_replace ('ssl://', '', $this->host);

    $url_parts = parse_url ($url);
    if (empty ($path)) $path = '/';
    if (empty ($url)) $url = '/';

    $headers = 'GET '.$path." HTTP/1.0\r\n";
    if (!empty ($this->agent))
      $headers .= 'User-Agent: '.$this->agent."\r\n";
    if (!empty ($this->host) && !isset ($this->rawheaders['Host']))
      $headers .= 'Host: '.$this->host."\r\n";
    if (!empty ($this->accept))
      $headers .= 'Accept: '.$this->accept."\r\n";
    if (!empty ($this->acceptLanguage))
      $headers .= 'Accept-Language: '.$this->acceptLanguage."\r\n";
    if (!empty ($this->acceptCharset))
      $headers .= 'Accept-Charset: '.$this->acceptCharset."\r\n";
    if ($this->use_gzip && function_exists ('gzinflate'))
      $headers .= "Accept-Encoding: gzip\r\n";

    if (!empty ($this->rawheaders))
    {
      if (!is_array ($this->rawheaders))
	$this->rawheaders = (array) $this->rawheaders;
      foreach ($this->rawheaders as $headerKey => $headerVal)
	$headers .= $headerKey.': '.$headerVal."\r\n";
    }

    if (!empty ($this->user) || !empty ($this->pass))	
      $headers .= 'Authorization: Basic '.base64_encode ($this->user.':'.$this->pass)."\r\n";

    $headers .= "\r\n";

    if ($this->read_timeout > 0)
      socket_set_timeout ($fp, $this->read_timeout);
    $this->timed_out = false;

    fwrite ($fp, $headers, strlen ($headers));

    $this->_redirectaddr = false;
    unset ($this->headers);

    $is_gzipped = false;
    while (1)
    {
      $currentHeader = fgets ($fp, $this->_maxlinelen);
      if ($this->_check_timeout ($fp))
	return false;
      if (!$currentHeader || $currentHeader == "\r\n")
	break;

      // if a header begins with Location: or URI, set the redirect
      if (preg_match ("/^(Location:|URI:)/i", $currentHeader))
      {
	preg_match ("/^(Location:|URI:)[ ]+(.*)/", chop ($currentHeader), $matches);
	// look for :// in the Location header to see if hostname is included
	if (!preg_match ("|\:\/\/|", $matches[2]))
	{
	  // no host in the path, so prepend
	  $this->_redirectaddr = $url_parts['scheme'].'://'.$this->host.':'.$this->port;
	  // eliminate double slash
	  if (!preg_match("|^/|", $matches[2]))
	    $this->_redirectaddr .= '/'.$matches[2];
	  else
	    $this->_redirectaddr .= $matches[2];
	}
	else
	  $this->_redirectaddr = $matches[2];
      }
      else if (preg_match ("|^HTTP/|", $currentHeader))
      {
	if (preg_match ("|^HTTP/[^\s]*\s(.*?)\s|", $currentHeader, $status))
	{
	  $this->status = $status[1];
	}				
	$this->response_code = $currentHeader;
      }
      else if (preg_match ("/Content-Encoding: gzip/", $currentHeader))
	$is_gzipped = true;

      $cHeader = split (':', $currentHeader, 2);
      if (isset ($cHeader[0]) && isset ($cHeader[1]))
	$this->headers[$cHeader[0]] = trim ($cHeader[1]);
    }

    $xml = '';
    do {
      $_data = fread ($fp, $this->maxlength);
      if ($this->_check_timeout ($fp))
        return false;
      else if (strlen ($_data) == 0) 
	break;
      $xml .= $_data;
    } while (true);

    // gunzip
    if ($is_gzipped) {
      $xml = gzinflate (substr ($xml, 10));
    }

    $this->xml = trim ($xml);
    return true;
  }

  function _check_timeout ($fp)
  {
    if ($this->read_timeout > 0) {
      $fp_status = socket_get_status ($fp);
      if ($fp_status['timed_out']) {
	$this->timed_out = true;
        $this->status = -100;
	return true;
      }
    }
    return false;
  }

  function _connect (&$fp)
  {
    $host = $this->host;
    $port = $this->port;

    $this->status = 0;

    if ($fp = @fsockopen ($host, $port, $errno, $errstr, $this->_fp_timeout))
      return true;
    else
    {
      $this->status = $errno;
      if ($errno == 0)
	$this->error = _('Connection failed');
      else
	$this->error = $errstr;
      return false;
    }
  }
	
  function _disconnect ($fp)
  {
    return (fclose ($fp));
  }
}

?>
