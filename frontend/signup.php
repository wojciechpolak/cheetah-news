<?php

/*
   Cheetah News signup.php
   Copyright (C) 2005, 2006, 2008 Wojciech Polak.

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
postvars ('cEmail,regPassword,regRPassword,SignUp,Confirm,Decline');

$cEmail = htmlspecialchars (strip_tags ($cEmail));
$layout = '';
$validPass = true;
$validPassLen = true;
$message = '';
$showSignIn = true;

if ($SignUp)
{
  require_once 'lib/register.php';

  if (empty ($regPassword)) {
    $validPassLen = false;
    $layout = 'form';
  }
  else if ($regPassword != $regRPassword) {
    $validPass = false;
    $layout = 'form';
  }
  else {
    $res = rpInvSendEmail ($hash, $cEmail, $regPassword);
    switch ($res) {
      case 0:
	$message = _('A registration confirmation e-mail has been sent to you.');
	$showSignIn = false;
	break;
      case -1:
	$message = _('Please specify a valid e-mail address.');
	$layout = 'form';
	break;
      case -2:
	$message = _('Service temporarily unavailable. Please try again later.');
	$layout = 'form';
	break;
      case -3:
	$message = _('Account already exists.');
	$layout = 'form';
	break;
      case -4:
	$message = _('Your confirmation period or invitation has expired.');
	break;
    }
  }
}
else if (!empty ($hash))
{
  $db = new Database ();

  /* delete unused, expired entries */
  $db->query ("DELETE LOW_PRIORITY FROM registration WHERE rdate < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 14 DAY) AND invitation=1;");
  $db->query ("DELETE LOW_PRIORITY FROM registration WHERE rdate < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 DAY) AND invitation=0;");

  $db->query ("SELECT email, pass, openid_identity, invitation, regtype ".
	      "FROM registration WHERE hash='".$db->escape ($hash)."'");
  if ($db->next_record ())
  {
    $cEmail = $db->f ('email');
    $pass   = $db->f ('pass');
    $openid_identity = $db->f ('openid_identity');
    $invitation = $db->f ('invitation');
    $regtype = $db->f ('regtype');

    $db->query ("SELECT email FROM user WHERE email='".$cEmail."'");
    if ($db->next_record ()) {
      $message = _('Account already exists.');
    }
    else {
      if ($invitation == 0)
      {
	if ($Confirm) {
	  $db->query ("INSERT INTO user SET email='".$cEmail."', pass='".
		      $pass."', regtype='".$regtype."'");
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
	  $session->email = $cEmail;
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
      else if ($invitation == 1)
	$layout = 'form';
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
<h2>Cheetah: <?php echo _('Do you confirm signing up?'); echo '<br />('; echo _('account'); ?> <em><?php echo $cEmail; ?></em>)</h2>
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
<?php } else if ($layout == 'form') { ?>
<div id="box">
<form action="signup" method="post">

  <table width="100%" border="0">
    <tr><td colspan="2"><?php echo _('Sign Up'); ?></td></tr>
    <tr>
      <td style="width:50%" align="right">
	<input type="hidden" name="hash" value="<?php echo htmlspecialchars ($hash); ?>" />
	<?php echo _('E-mail: '); ?>
      </td>
      <td style="width:50%" align="left"><input type="text" name="cEmail" size="20" maxlength="255" value="<?php echo $cEmail; ?>" /></td>
    </tr>
    <tr>
      <td align="right"><?php echo _('Password: '); ?></td>
      <td align="left"><input type="password" name="regPassword" size="20" maxlength="255" /></td>
    </tr>
    <tr>
      <td align="right"><?php echo _('Re-type password: '); ?></td>
      <td align="left"><input type="password" name="regRPassword" size="20" maxlength="255" /></td>
    </tr>
    <?php
       if ($message)
	 echo '<tr><td colspan="2"><span class="warning">'.$message.'</span></td></tr>';
       else if (!$validPassLen)
	 echo '<tr><td colspan="2"><span class="warning">'._('Password cannot be an empty string.').'</span></td></tr>';
       else if (!$validPass)
	 echo '<tr><td colspan="2"><span class="warning">'._('Passwords do not match.').'</span></td></tr>';
    ?>
    <tr>
      <td></td>
      <td align="left"><input type="submit" name="SignUp" value="<?php echo _('Sign Up'); ?>" /></td>
    </tr>
    <tr><td></td></tr>
    <tr>
      <td colspan="2" align="left">
	<a href="http://<?php echo $CONF['site']; ?>/"><?php echo _('I already have an account'); ?></a>&nbsp;&nbsp;
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
  <?php if ($showSignIn) { ?>
  <table width="100%" border="0">
    <tr><td><a href="http://<?php echo $CONF['site']; ?>/"><?php echo _('Sign in'); ?></a></td></tr>
  </table>
  <?php } ?>
</div>
<?php } ?>

</body>
</html>
