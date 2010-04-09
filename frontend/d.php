<?php

/*
   Cheetah News d.php
   Copyright (C) 2005, 2006, 2007, 2008, 2009 Wojciech Polak.
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

$copyright = "/*
   Cheetah News Aggregator.
   Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010 Wojciech Polak.
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
*/\n\n";

$files = array ('bt/2'       => array ('js',  array ('js/v2/i18n.js',
						     'js/v2/boot.js',
						     'js/v2/jquery.js',
						     'js/v2/jquery-ui.js',
						     'js/v2/jquery-extra.js')),
		'js/2'       => array ('js',  array ('js/v2/core.js',
						     'js/v2/gui.js',
						     'js/v2/opml.js',
						     'js/v2/filter.js',
						     'js/v2/marker.js',
						     'js/v2/share.js',
						     'js/v2/translate.js',
						     'js/v2/notes.js',
						     'js/v2/weather.js',
						     'js/v2/niftycube.js')),
		'login'      => array ('js',  array ('js/v2/login.js')),
		'tr/2'       => array ('xml', array ('xslt/v2/feed.xsl')),
		'op/2'       => array ('xml', array ('xslt/v2/opml.xsl')),
		'wt/2'       => array ('xml', array ('xslt/v2/weather.xsl')),
		'css/2'      => array ('css', array ('css/v2/style1.css',
						     'css/v2/niftyCorners.css')),
		'css.login'  => array ('css', array ('css/v2/login.css')),
		'css.notice' => array ('css', array ('css/v2/notice.css')),
		'css.signup' => array ('css', array ('css/v2/signup.css')),
		'css.changepassword' => array ('css', array ('css/v2/changepassword.css')),
		'dir'        => array ('xml', array ('gen/directory.xml')),
		'popular'    => array ('xml', array ('gen/popular.xml'))
		);

getvars ('q');

if (isset ($files[$q]) && $files[$q][0] == 'js')
  start_session (null, false, 0);
else
  start_session (null, false, 900);

$session->auth ('iflogged');

$headers = getallheaders ();
$logged = $session->status['afterlogged'] == 'yes';

if (isset ($files[$q])) {
  $d = $files[$q];
  if ($d[0] == 'js') {
    if (!$logged && $q != 'login')
      return;
    if ($q == 'js/1' || $q == 'js/2')
      checkReferer ();
    $m = $d[1];
    array_push ($m, $mofile);
    checkModification ($m, true);
    header ('Content-Type: application/x-javascript; charset=UTF-8');
    echo $copyright;
    if ($q == 'bt/1' || $q == 'bt/2')
      convert_mo ();
    printJsCode ($d[1]);
  }
  else if ($d[0] == 'css') {
    checkModification ($d[1], false);
    header ('Content-Type: text/css');
    printCode ($d[1]);
  }
  else if ($d[0] == 'xml') {
    checkReferer ();
    checkModification ($d[1], false);
    header ('Content-Type: application/xml; charset=UTF-8');
    printCode ($d[1]);
  }
}

function checkReferer ()
{
  global $headers;
  foreach ($headers as $k => $v)
  {
    if (strtolower ($k) == 'x-referer' && $v == 'CNA')
      return;
  }
  header ('HTTP/1.1 401 Unauthorized');
  exit ();
}

function checkModification ($files, $checkLang)
{
  global $CONF, $session, $headers, $locale;
  $lm = 0;
  foreach ($files as $f)
  {
    if ($f[0] != '/')
      $f = $CONF['baseDir'].'/'.$f;
    $fmt = @filemtime ($f);
    if ($fmt > $lm)
      $lm = $fmt;
  }

  $ts = $lm - count ($files);
  if ($checkLang)
    $ts -= calstr ($locale);

  $lastModified = gmdate ('D, d M Y H:i:s T', $ts);
  $tag = $lastModified.(string)count ($files).$session->id;
  $ETag = '';
  if ($checkLang)
    $ETag = '"'.md5 ($tag.$locale).'"';
  else
    $ETag = '"'.md5 ($tag).'"';

  if (array_key_exists ('If-Modified-Since', $headers) &&
      array_key_exists ('If-None-Match', $headers))
  {
    $headers['If-None-Match'] = str_replace ('-gzip', '',
					     $headers['If-None-Match']);
    if ($headers['If-Modified-Since'] == $lastModified &&
	$headers['If-None-Match'] == $ETag) {
      header ('HTTP/1.1 304 Not Modified');
      exit ();
    }
  }
  else if (array_key_exists ('If-Modified-Since', $headers)) {
    $ifModifiedSince = $headers['If-Modified-Since'];
    $p = strpos ($ifModifiedSince, ';');
    if ($p)
      $ifModifiedSince = substr ($ifModifiedSince, 0, $p);
    if ($ifModifiedSince == $lastModified) {
      header ('HTTP/1.1 304 Not Modified');
      exit ();
    }
  }

  header ("Last-Modified: $lastModified");
  header ("ETag: $ETag");
}

function normalize_filename ($f)
{
  global $CONF;
  if ($f[0] != '/')
    return $CONF['baseDir'].'/'.$f;
  return $f;
}

function calstr (&$s)
{
  $a = dechex (crc32 ($s));
  $b = 0;
  $len = strlen ($a);
  for ($i = 0; $i < $len; $i++)
    $b += ord ($a[$i]);
  return $b;
}

function printJsCode ($files)
{
  /* Loading mod_jspp.so from php.ini is recommended. If, however, you
     cannot afford it, uncomment the following:
  if (!extension_loaded ('jspp') && @dl ('mod_jspp.so') == false) {
    error_log ('Cannot load mod_jspp.so');
    printCode ($files);
    return;
  }
  */
  jspp_gettext (array_map ('normalize_filename', $files));
}

function printCode ($files)
{
  global $CONF;
  foreach ($files as $f)
  {
    if ($f[0] != '/')
      $f = $CONF['baseDir'].'/'.$f;
    $fp = @fopen ($f, 'r');
    if ($fp) {
      while (!feof ($fp))
	echo fread ($fp, 4096);
      fclose ($fp);
    }
  }
}

?>
