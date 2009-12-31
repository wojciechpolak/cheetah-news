<?php

/*
   Cheetah News invite.php
   Copyright (C) 2005, 2006 Wojciech Polak.
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

$mail_link = $CONF['secureProto'].'://'.$CONF['site'].'/signup?hash=';

function N_($msg) {
  return $msg;
}

$global_mail_subject = '[Cheetah News] '. N_("You have been invited to open Cheetah News Aggregator account");
$global_mail_text1 = N_("%s has invited you to open a free Cheetah News Aggregator account.");
$global_mail_text2 = N_("Learn more about Cheetah News Aggregator at %s.");
$global_mail_text3 = N_("To accept this invitation and register for your account, visit: %s");
$global_mail_text4 = N_("Please do not reply to this email. If you need further assistance,\nplease mail to %s.");

if ($session->status['afterlogged'] == 'yes')
{
  postvars ('to,firstname,lastname,msg,lang');

  $to = htmlspecialchars (strip_tags ($to));
  $firstname = htmlspecialchars (strip_tags ($firstname));
  $lastname = htmlspecialchars (strip_tags ($lastname));
  $msg = strip_tags ($msg);
  invite ($to, $firstname, $lastname, $msg, $lang);
}
else {
  printXmlError (null, _('Operation not permitted. Access denied'));
}

function encode_body ($text)
{
  $out = '';
  if (function_exists ('mb_strlen')) {
    while ($text != '') {
      $length = 79;
      $inlen = mb_strlen ($text, 'UTF-8');
      if ($length > $inlen) 
	break;

      $s = mb_substr ($text, 0, $length, 'UTF-8');
      mb_ereg_search_init ($s, "\n");
      $rc = mb_ereg_search_pos ();
      if ($rc)
	$pos = $rc[0];
      else {
	mb_ereg_search_init ($s, "[ \t]");
	for ($pos = false; $rc = mb_ereg_search_pos ();) 
	  $pos = $rc[0];
      }
      if (!is_numeric ($pos))
	break;
      $out .= mb_substr ($s, 0, $pos) . "\r\n";
      $text = mb_substr ($text, $pos + 1);
    }
  }
  return chunk_split (base64_encode ($out.$text), 79);
}

function encode_subject ($subj)
{
  if (preg_match ("[^a-zA-Z 0-9-]", $subj))
    return wordwrap ($subj, 75, "\n\t");
  else {
    /*
      Must be: return "=?UTF-8?B?".wordwrap (base64_encode ($subj),
      75, "?=\n\t=?UTF-8?B?", 1)."?="; However PHP mail implementation
      is clearly brain-damaged, it does not allow newlines in the
      Subject. So, until it is fixed:
    */
    return "=?UTF-8?B?" . base64_encode ($subj) . "?=";
  }
}
  
function invite ($i_email, $firstname, $lastname, $invitation, $language)
{
  global $session, $CONF, $mail_link, $locale;
  global $global_mail_subject, $global_mail_text1, $global_mail_text2,
         $global_mail_text3, $global_mail_text4;

  if ($language != 'null') {
    $save_locale = $locale;
    locale_setup ($language);
    $mail_text1 = _($global_mail_text1);
    $mail_text2 = _($global_mail_text2);
    $mail_text3 = _($global_mail_text3);
    $mail_text4 = _($global_mail_text4);
    $mail_subject = _($global_mail_subject);
    locale_setup ($save_locale);
  }
  else {
    $mail_text1 = _($global_mail_text1);
    $mail_text2 = _($global_mail_text2);
    $mail_text3 = _($global_mail_text3);
    $mail_text4 = _($global_mail_text4);
    $mail_subject = _($global_mail_subject);
  }

  $db = new Database ();

  $db->query ("SELECT email, invitation FROM user WHERE id='".$session->id."'");
  if ($db->next_record ()) {
    if ($db->f ('invitation') < 1) {
      printXmlError (-3, _('No invitations left'));
      exit;
    }
  }

  if (empty ($i_email) || !ereg ("^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)+$", $i_email)) {
    printXmlError (-1, _('Please specify a valid e-mail address.'));
    exit;
  }

  $db->query ("SELECT email FROM user WHERE email='".
	      $db->escape ($i_email)."'");
  if ($db->next_record ()) {
    printXmlError (-5, _('This user is already subscribed.'));
    exit;
  }

  $newEntry = true;
  $hash = '';

  $db->query ("SELECT hash FROM registration WHERE email='".
	      $db->escape ($i_email)."'");
  if (!$db->next_record ())
    $hash = sha1 (time().$i_email.rand());
  else {
    $hash = $db->f ('hash');
    $newEntry = false;
  }

  $mail_header = 'From: '.$CONF['mailFrom']."\r\n";
  if (!empty ($firstname) || !empty ($lastname)) {
    $mail_header .= 'To: ';
    $mail_rcpt = '';
    if (!empty ($firstname)) {
      $mail_rcpt = $firstname;
      if (!empty ($lastname))
	$mail_rcpt .= ' ';
    }
    if (!empty ($lastname))
      $mail_rcpt .= $lastname;
    if (!empty ($mail_rcpt))
      $mail_header .= qp_encode ($mail_rcpt) . ' ';
    $mail_header .= "<$i_email>\r\n";
  }

  $mail_header .= "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n".
                  "Content-Transfer-Encoding: base64\r\nContent-Disposition: inline\r\n";

  if (mail ($i_email,
	    encode_subject ($mail_subject),
	    encode_body ($invitation."\n\n---\n\n".
			 sprintf ($mail_text1, $session->email).' '.
			 sprintf ($mail_text2, 'http://'.$CONF['site'].'/')."\n\n".
			 sprintf ($mail_text3, $mail_link).$hash."\n\n".sprintf ($mail_text4, $CONF['mailHelp'])),
            $mail_header))
  {
    if ($newEntry) {
      $db->query ("INSERT INTO registration SET email='".$db->escape ($i_email).
		  "', hash='".$hash."', regtype='I', rdate=UTC_TIMESTAMP()");
      $db->query ("UPDATE user SET invitation = (invitation - 1), invited = (invited + 1) WHERE id='".$session->id."'");
    }
  }
  else {
    printXmlError (-2, _('Service temporarily unavailable. Please try again later.'));
    exit;
  }

  printXmlWithHeader ('<ok/>');
}

?>
