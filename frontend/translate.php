<?php

/*
   Cheetah News translate.php
   Copyright (C) 2005, 2006, 2008, 2009 Wojciech Polak.

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
require 'lib/json.php';

start_session (null, false);
$session->auth ('iflogged');

postvars ('text,in,out');

if ($session->status['afterlogged'] == 'yes')
{
  $in_values = array ('auto','en','de','es','fr','it','pt','ja','ko','zh-CN',
		      'ar','pl','uk');
  $out_values = array ('en','de','es','fr','it','pt','ja','ko','zh-CN','ar',
		       'pl','uk');

  if (empty ($in) || array_search ($in, $in_values) === false)
    $in = 'en';
  if (empty ($out) || array_search ($out, $out_values) === false)
    $out = 'en';

  $hash = sha1 ($text).'_'.$in.'_'.$out;
  $filename = getcwd ().'/trs/'.$hash;

  if (file_exists ($filename) && is_readable ($filename))
  {
    $fh = @fopen ($filename, 'r');
    if ($fh) {
      header ('Content-Type: text/html; charset=UTF-8');
      while (!feof ($fh))
	echo fread ($fh, 4096);
      @fclose ($fh);
    }
  }
  else if (strlen ($text) < 5000 &&
	   $fh = @fopen ($filename, 'w'))
  {
    @fwrite ($fh, $text);
    @fclose ($fh);

    if ($in == 'auto') $in = '';

    $url = 'http://ajax.googleapis.com/ajax/services/language/translate';
    $post_data  = 'v=1.0';
    $post_data .= '&q='.urlencode ($text);
    $post_data .= '&langpair='.$in.'%7C'.$out;

    $ch = curl_init ();
    curl_setopt ($ch, CURLOPT_URL, $url);
    curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt ($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt ($ch, CURLOPT_REFERER, 'http://www.cheetah-news.com/');
    curl_setopt ($ch, CURLOPT_POST, 1);
    curl_setopt ($ch, CURLOPT_POSTFIELDS, $post_data);
    $response = curl_exec ($ch);
    curl_close ($ch);

    $json = new Services_JSON ();
    $data = $json->decode ($response);
    if (isset ($data->responseStatus) && $data->responseStatus == 200)
    {
      $fh = @fopen ($filename, 'w');
      @fwrite ($fh, $data->responseData->translatedText);
      @fclose ($fh);

      header ('Content-Type: text/html; charset=UTF-8');
      echo $data->responseData->translatedText;
    }
  }
  else {
    header ('Content-Type: text/html; charset=UTF-8');
    echo $text;
  }
}

?>
