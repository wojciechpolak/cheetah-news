<?php

/*
   Cheetah News lib/functions.php
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

function redirect ($to) {
  header ("Location: $to");
  exit;
}

function getvars ($names) {
  $arr = explode (',', $names);
  foreach ($arr as $_v_) {
    global $$_v_;
    if (empty ($$_v_))
      if (isset ($_REQUEST[$_v_]))
	$$_v_ = trim ($_REQUEST[$_v_]);
  }
}

function postvars ($names) {
  $arr = explode (',', $names);
  foreach ($arr as $_v_) {
    global $$_v_;
    if (empty ($$_v_))
      if (isset ($_POST[$_v_]))
	$$_v_ = trim ($_POST[$_v_]);
  }
}

function encodeJsEntities ($s) {
  $tr = array ("'" => '&rsquo;');
  return strtr ($s, $tr);
}

function decodeSD ($s) {
  $tr = array ('&rsquo;' => "'",
	       '&colon;' => ':');
  return strtr ($s, $tr);
}

function recodeToUTF8 (&$xml) {
  $encoding = null;

  if (!$encoding)
  {
    if (preg_match ('/<?xml.*encoding=[\'"](.*?)[\'"].*?>/m', $xml, $m))
      $encoding = strtoupper ($m[1]);
    else
      $encoding = 'UTF-8';
  }
  if ($encoding != 'UTF-8')
  {
    $conv = true;

    if (function_exists ('iconv'))
      $xml = iconv ($encoding, 'UTF-8', $xml);
    else if (function_exists ('mb_convert_encoding'))
      $xml = mb_convert_encoding ($xml, 'UTF-8', $encoding);
    else
      $conv = false;

    if ($conv) {
      $xml = preg_replace ('/(<?xml.*encoding=[\'"])(.*?)([\'"].*?>)/m',
			   "\\1UTF-8\\3", $xml, 1);
      $encoding = 'UTF-8';
    }
  }
}

function alterXML (&$xml) {
  $xml = preg_replace ('/(<img.*?|<iframe.*?)(src)(=[\'"].*?[\'"].*?>)/ims', "\\1osrc\\3", $xml);
  $xml = preg_replace ('/(&lt;img.*?|&lt;iframe.*?)(src)(=.*?&gt;)/ims', "\\1osrc\\3", $xml);
}

function printJsError ($message) {
  header ('Content-Type: application/x-javascript; charset=UTF-8');
  echo "js_error ('".encodeJsEntities ($message)."')\n";
}

function printXml ($content) {
  header ('Content-Type: text/xml; charset=UTF-8');
  echo $content;
}

function printXmlWithHeader ($content) {
  header ('Content-Type: text/xml; charset=UTF-8');
  echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
  echo $content;
}

function printXmlError ($code, $message) {
  header ('Content-Type: text/xml; charset=UTF-8');
  if ($code == null) {
    echo <<< END
<?xml version="1.0" encoding="UTF-8"?>
<error>
  <message>$message</message>
</error>
END;
  }
  else {
    echo <<< END
<error>
  <code>$code</code>
  <message>$message</message>
</error>
END;
  }
}

function qp_encode ($str) {
  $str = preg_replace ('/[^\x21-\x3C\x3E-\x7E\x09\x20]/e',
		       'sprintf("=%02X", ord("$0"));', $str);
  preg_match_all ( '/.{1,}([^=]{0,3})?/', $str, $mtch);
  $res = str_replace (' ', '_', implode ('='."\r", $mtch[0]));
  return '=?UTF-8?Q?'.$res.'?=';
}

function checkBool (&$bool) {
  if (is_numeric ($bool)) {
    if ($bool < 0 || $bool > 1)
      $bool = 0;
  }
  else
    $bool = 0;
}

function checkCSRF ($csid) {
  if ($csid != session_id ()) {
    printXmlError (null, 'CSRF');
    exit ();
  }
}

?>
