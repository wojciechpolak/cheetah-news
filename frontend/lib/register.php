<?php

/*
   Cheetah News lib/register.php
   Copyright (C) 2005, 2006, 2010, 2014 Wojciech Polak.

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

$mail_link = $CONF['secureProto'].'://'.$CONF['site'].'/signup?hash=';
$mail_subject = '[Cheetah News] '._('Confirm Registration');
$mail_text1 = _("Greetings,\n\nTo confirm or decline signing up for the Cheetah News Aggregator account,\nplease click the following link:")."\n".$mail_link;
$mail_text2 = sprintf (_("Please do not reply to this email. If you need further assistance,\nplease mail %s."), $CONF['mailHelp']);

function rpNewSendEmail ($cEmail, $regPassword, $openid_identity = '')
{
  global $CONF, $mail_subject, $mail_text1, $mail_text2;

  if (empty ($cEmail) || !ereg ("^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)+$", $cEmail))
    return -1;

  $db = new Database ();

  $db->query ("SELECT email FROM user WHERE email='".$db->escape ($cEmail)."'");
  if (!$db->next_record ())
  {
    $newEntry = false;
    $hash = '';

    $db->query ("SELECT hash FROM registration WHERE email='".$db->escape ($cEmail)."'");
    if ($db->next_record ()) {
      $hash = $db->f ('hash');
    }
    else {
      $hash = sha1 (time().$cEmail.rand());
      $newEntry = true;
    }

    if (mail ($cEmail, qp_encode ($mail_subject),
	      chunk_split (base64_encode ($mail_text1.$hash."\n\n".$mail_text2)),
	      'From: '.$CONF['mailFrom']."\r\n".
	      "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n".
	      "Content-Transfer-Encoding: base64\r\nContent-Disposition: inline\r\n"))
    {
      if ($newEntry) {
	$db->query ("INSERT INTO registration SET email='".$db->escape ($cEmail)."', ".
		    "rdate=UTC_TIMESTAMP(), hash='".$hash."', pass='".
		    make_password ($regPassword)."', openid_identity='".
		    $db->escape ($openid_identity)."'");
      }
      return 0; /* OK */
    }
    else
      return -2; /* sending mail problem */
  }
  else
    return -3; /* account already exists */
}

?>
