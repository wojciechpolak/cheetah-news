<?php

/*
   Cheetah News lib/forgotpassword.php
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

$mail_link = $CONF['secureProto'].'://'.$CONF['site'].'/changepassword?hash=';
$mail_subject = '[Cheetah News] '._('Password Change Request');
$mail_text1 = sprintf (_("Greetings,\n\nSomeone (IP: %s), possible you, has requested to recover\nthe password for your Cheetah News Aggregator account."),
		       $_SERVER['REMOTE_ADDR']);
$mail_text2 = _('To set your new password, click the following link:')."\n".$mail_link;
$mail_text3 = sprintf (_("Please do not reply to this email. If you need further assistance,\nplease mail %s."), $CONF['mailHelp']);

function fpSendEmail ($cEmail)
{
  global $CONF, $mail_subject, $mail_text1, $mail_text2, $mail_text3;

  if (empty ($cEmail) || !ereg ("^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)+$", $cEmail))
    return -1;

  $db = new Database ();
  $cEmail = $db->escape ($cEmail);

  /* delete unused, expired requests */
  $db->query ("DELETE LOW_PRIORITY FROM forgotpassword WHERE date < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)");

  $db->query ("SELECT email FROM user WHERE email='".$cEmail."'");
  if ($db->next_record ())
  {
    $newEntry = false;
    $hash = '';

    $db->query ("SELECT hash FROM forgotpassword WHERE email='".$cEmail."'");
    if ($db->next_record ()) {
      $hash = $db->f ('hash');
    }
    else {
      $hash = sha1 (time().$cEmail.rand());
      $newEntry = true;
    }

    if (mail ($cEmail, qp_encode ($mail_subject),
	      chunk_split (base64_encode ($mail_text1."\n\n".$mail_text2.$hash."\n\n".$mail_text3)),
	      'From: '.$CONF['mailFrom']."\r\n".
	      "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n".
	      "Content-Transfer-Encoding: base64\r\nContent-Disposition: inline\r\n"))
    {
      if ($newEntry) {
	$db->query ("INSERT INTO forgotpassword SET email='".$cEmail.
		    "', hash='".$hash."', date=UTC_TIMESTAMP()");
      }
      return 0; /* OK */
    }
    else
      return -2; /* sending mail problem */
  }
  return -3; /* account doesn't exist */
}

?>
