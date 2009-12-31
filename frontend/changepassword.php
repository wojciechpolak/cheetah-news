<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<?php

/*
   Cheetah News changepassword.php
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

require_once 'lib/include.php';

start_session (null, true);
$session->auth ('iflogged');

echo '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="'.$CHEETAH_LANG.'" lang="'.$CHEETAH_LANG.'">';
?>
<head>
<title>Cheetah News</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="robots" content="noindex,nofollow" />
<link rel="stylesheet" href="d?q=css.changepassword" type="text/css" />
<link rel="icon" href="images/favicon.png" type="image/png" />
</head>
<body>

<?php

getvars ('hash');
postvars ('submit,pass,rpass,opass');

$auth = 0;
$validPass = true;
$validPassLen = true;
$validOPass = true;
$message = '';
$email = '';

if ($session->status['afterlogged'] == 'yes')
{
  if ($session->email == 'guest') {
    echo '<h2>'._('You are using a guest account. You must register in order to do this.').'</h2>';
    echo "\n</body></html>\n";
    exit ();
  }

  $auth = 1;
  $email = $session->email;
  if (!empty ($submit))
  {
    if (empty ($pass))
      $validPassLen = false;
    if ($pass != $rpass)
      $validPass = false;

    if ($validPassLen && $validPass) {
      $success = $session->change_password ($opass, $pass, $rpass);
      if ($success)
	$message = _('Your password has been successfully changed.');
      else
	$validOPass = false;
    }
  }
}
else if (!empty ($hash))
{
  $auth = 2;
  $db = new Database ();
  $db->query ("SELECT email, UNIX_TIMESTAMP(date) AS forgot_date ".
	      "FROM forgotpassword WHERE hash='".$db->escape ($hash)."'");
  if ($db->next_record ())
  {
    $email = $db->f ('email');
    $forgot_date = $db->f ('forgot_date');
    $db->query ("SELECT email FROM user WHERE email='".$email."'");
    if ($db->next_record ())
    {
      $now = time ();
      $db->query ("SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP()) AS now");
      if ($db->next_record ())
	$now = $db->f ('now');

      $diff = $now - $forgot_date;
      if ($diff > (3600 * 24)) { /* 24 hours */
	$message = _('Your password recovery session has expired.');
      }
      else if (!empty ($submit))
      {
	if (empty ($pass))
	  $validPassLen = false;
	if ($pass != $rpass)
	  $validPass = false;

	if ($validPassLen && $validPass) {
	  $db->query ("UPDATE user SET pass='".md5 ($pass).
		      "', failogCount=0 WHERE email='".$email."'");
	  $db->query ("DELETE FROM forgotpassword WHERE email='".$email."'");
	  $message = _('Your password has been successfully changed.');
	}
      }
    }
    else
      $message = printf (_("Account %s doesn't exist."), $email);
  }
  else
    $message = _('Your password recovery session has expired.');
}

if ($auth) {
  if ($message) {
?>
<div id="box">
  <h2><?php echo $message; ?></h2>
  <?php if ($auth == 2) { ?><p><a href="http://<?php echo $CONF['site']; ?>/"><?php echo _('Sign in'); ?></a></p><?php } ?>
</div>
<?php } else { ?>
<div id="box">
<h2>Cheetah: <?php echo _('Set New Password'); if ($auth == 2) { echo ' ('._('account').' <em>'.$email.'</em>)'; } ?></h2>
<form action="changepassword" method="post">
  <table>
    <?php if ($auth == 1) { ?>
    <tr>
      <td align="right"><?php echo _('Old password: '); ?></td>
      <td align="left">
	<input type="password" name="opass" size="20" maxlength="255" />
      </td>
    </tr>
    <?php } ?>
    <tr>
      <td align="right"><?php echo _('New password: '); ?></td>
      <td align="left">
	<?php if ($auth == 2) { ?><input type="hidden" name="hash" value="<?php echo htmlspecialchars ($hash); ?>" /><?php } ?>
	<input type="password" name="pass" size="20" maxlength="255" />
      </td>
    </tr>
    <tr>
      <td align="right"><?php echo _('Re-type password: '); ?></td>
      <td align="left"><input type="password" name="rpass" size="20" maxlength="255" /></td>
    </tr>
    <?php
       if (!$validPassLen)
	 echo '<tr><td colspan="2"><span class="warning">'._('Password cannot be an empty string.').'</span></td></tr>';
       else if (!$validPass)
	 echo '<tr><td colspan="2"><span class="warning">'._('Passwords do not match.').'</span></td></tr>';
       else if (!$validOPass)
	 echo '<tr><td colspan="2"><span class="warning">'._('Invalid old password.').'</span></td></tr>';
    ?>
    <tr>
      <td></td>
      <td align="left"><input type="submit" name="submit" value="<?php echo _('Change Password'); ?>" /></td>
    </tr>
    <tr><td></td></tr>
    <?php if ($auth == 2) { ?>
    <tr>
      <td colspan="2" align="left">
	<a href="http://<?php echo $CONF['site']; ?>/"><?php echo _('Sign in'); ?></a>
      </td>
    </tr>
    <?php } ?>
  </table>
</form>
</div>
<?php }
} ?>

</body>
</html>
