<?php

/*
   Cheetah News signup.php
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

require_once 'lib/include.php';

start_session ('no');

getvars ('hash');
postvars ('Confirm,Decline');

$layout = '';
$message = '';

if (!empty ($hash))
{
  $db = new Database ();

  /* delete unused, expired entries */
  $db->query ("DELETE LOW_PRIORITY FROM registration WHERE rdate < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 DAY)");

  $db->query ("SELECT email, pass, openid_identity ".
	      "FROM registration WHERE hash='".$db->escape ($hash)."'");
  if ($db->next_record ())
  {
    $email = $db->f ('email');
    $pass  = $db->f ('pass');
    $openid_identity = $db->f ('openid_identity');

    $db->query ("SELECT email FROM user WHERE email='".$email."'");
    if ($db->next_record ()) {
      $message = _('Account already exists.');
    }
    else {
      if ($Confirm) {
	$db->query ("INSERT INTO user SET email='".$email."', pass='".$pass."'");
	$db->query ("SELECT LAST_INSERT_ID() as last_id FROM user");
	if ($db->next_record ()) {
	  $last_id = $db->f ('last_id');
	}

	if (!empty ($openid_identity)) {
	  $db->query ("INSERT INTO openid SET userid='".$last_id.
		      "', identity='".$openid_identity."'");
	}

	$db->query ("DELETE FROM registration WHERE hash='".$db->escape ($hash)."'");

	$session->id    = $last_id;
	$session->email = $email;
	$session->pass  = $pass;
	$session->lang  = 'null';
	$session->status['afterlogged'] = 'yes';
	$session->status['iflogged'] = 'yes';
	$_SESSION['session'] = $session;

	redirect ($CONF['secureProto'].'://'.$CONF['site'].'/rd');
      }
      else if ($Decline) {
	$db->query ("DELETE FROM registration WHERE hash='".$db->escape ($hash)."'");
	$message = _('Done, rejected.');
      }
      else
	$layout = 'confirm';
    }
  }
  else if (!empty ($hash))
    $message = _('Your confirmation period or invitation has expired.');
}

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>Cheetah News</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="robots" content="noindex,nofollow" />
<link rel="stylesheet" href="d?q=css.signup" type="text/css" />
<link rel="icon" href="images/favicon.png" type="image/png" />
</head>
<body>

<?php
if ($layout == 'confirm') { ?>
<div id="box">
<h2>Cheetah: <?php echo _('Do you confirm signing up?'); echo '<br />('; echo _('account'); ?> <em><?php echo $email; ?></em>)</h2>
<form action="signup" method="post">
  <table width="100%" border="0">
    <tr>
      <td align="center" style="width:50%">
	<input type="hidden" name="hash" value="<?php echo htmlspecialchars ($hash); ?>" />
	<input type="submit" name="Confirm" value="<?php echo _('Yes, I confirm'); ?>" />
      </td>
      <td align="center" style="width:50%">
	<input type="submit" name="Decline" value="<?php echo _('No, I decline'); ?>" />
      </td>
    </tr>
    <tr style="height:10px"><td></td></tr>
    <tr>
      <td colspan="2" align="center">
	<a href="http://<?php echo $CONF['site']; ?>/privacy"><?php echo _('Privacy Policy'); ?></a>&nbsp;&nbsp;
	<a href="http://<?php echo $CONF['site']; ?>/terms_of_service"><?php echo _('Terms of Service'); ?></a>
      </td>
    </tr>
  </table>
</form>
</div>
<?php } else if ($message) { ?>
<div id="box">
  <h2><?php echo $message; ?></h2>
  <table width="100%" border="0">
    <tr><td><a href="http://<?php echo $CONF['site']; ?>/"><?php echo _('Sign in'); ?></a></td></tr>
  </table>
</div>
<?php } ?>

</body>
</html>
