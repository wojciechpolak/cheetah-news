<?php

/*
   Cheetah News openid_manage.php
   Copyright (C) 2008 Wojciech Polak.

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
require_once 'Auth/OpenID/Consumer.php';
require_once 'Auth/OpenID/FileStore.php';
require_once 'Auth/OpenID/SReg.php';

start_session (null, true);
$session->auth ('iflogged');

$qs = false;
$message = '';

postvars ('add');
getvars ('remove');
$add = trim (strip_tags ($add));
$remove = trim (strip_tags ($remove));

if ($session->status['afterlogged'] != 'yes' ||
    $session->email == 'guest')
{
  $message = _('You are using a guest account. You must register in order to do this.');
  $qs = true;
}
else if (isset ($_GET['openid_mode']) && !empty ($_GET['openid_mode']))
{
  $store = new Auth_OpenID_FileStore ($CONF['openIdStorePath']);
  $consumer = new Auth_OpenID_Consumer ($store);

  $return_to = isset ($_GET['openid_return_to']) ?
    $_GET['openid_return_to'] : '';
  $response = $consumer->complete ($return_to);

  if ($response->status == Auth_OpenID_CANCEL) {
    $message = _('Verification cancelled.');
  }
  else if ($response->status == Auth_OpenID_FAILURE) {
    $message = sprintf (_('OpenID authentication failed: %s'),
			$response->message);
  }
  else if ($response->status == Auth_OpenID_SUCCESS)
  {
    $identity = $response->identity_url;
    if ($identity[strlen ($identity) - 1] == '/')
      $identity = substr ($identity, 0, -1);

    $db = new Database ();
    $db->query ("SELECT id FROM openid WHERE identity='".
		$db->escape ($identity)."'");
    if ($db->next_record ()) {
      $message = _('This OpenID is already attached.');
    }
    else {
      $db->query ("INSERT INTO openid SET userid='".$session->id.
		  "', identity='".$db->escape ($identity)."'");
      $message = _('Your OpenID has been successfully attached.');
    }
  }
}
else if (!empty ($add))
{
  $process_url = $CONF['secureProto'].'://'.$CONF['site'].'/openid_manage';
  $trust_root = $CONF['secureProto'].'://'.$CONF['site'].'/';

  $store = new Auth_OpenID_FileStore ($CONF['openIdStorePath']);
  $consumer = new Auth_OpenID_Consumer ($store);
  $auth_request = $consumer->begin ($add);

  if (!$auth_request) {
    $message = _('OpenID authentication failed.');
  }
  else {
    if (strpos ($add, 'http://') !== 0)
      $add = 'http://'.$add;
    if ($add[strlen ($add) - 1] == '/')
      $add = substr ($add, 0, -1);

    $db = new Database ();
    $db->query ("SELECT id FROM openid WHERE identity='".$db->escape ($add)."'");
    if (!$db->next_record ()) {
      $sreg_request = Auth_OpenID_SRegRequest::build (null, null,
						      'http://'.$CONF['site'].'/privacy');
      if ($sreg_request)
	$auth_request->addExtension ($sreg_request);

      $redirect_url = $auth_request->redirectURL ($trust_root, $process_url);
      redirect ($redirect_url);
    }
    else
      $message = _('This OpenID is already attached.');
  }
}
else if (!empty ($remove)) {
  $db = new Database ();
  $db->query ("DELETE FROM openid WHERE userid='".$session->id.
	      "' AND identity='".$db->escape ($remove)."'");
  redirect ('openid_manage');
}

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="<?=$CHEETAH_LANG?>" lang="<?=$CHEETAH_LANG?>">
<head>
<title>Cheetah News</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="robots" content="noindex,nofollow" />
<link rel="stylesheet" href="d?q=css.changepassword" type="text/css" />
<link rel="icon" href="images/favicon.png" type="image/png" />
</head>
<body>

<?php

if (!empty ($message)) {
?>
<div id="box">
  <h2><?php echo $message; ?></h2>
</div>
<p></p>
<?php
if ($qs)
  exit ();
}
?>

<?php
  $db = new Database ();
  $db->query ("SELECT * FROM openid WHERE userid='".$session->id."' ORDER BY identity");
?>

<div id="box">
<h2>Cheetah: <?php echo _('Manage your OpenIDs'); ?></h2>
<form action="openid_manage" method="post">
  <table>
<?php
  while ($db->next_record ()) {
?>
    <tr>
      <td align="left"><?php echo $db->f ('identity'); ?></td>
      <td align="left">
	<a href="?remove=<?php echo urlencode ($db->f ('identity')); ?>"
	   onclick="return confirm ('<?php echo _('Are you sure you want to detach this OpenID?'); ?>');">
	  <img src="images/16_delete.png" style="border:none"
	       alt="<?php echo _('Remove'); ?>" title="<?php echo _('Remove'); ?>" />
	</a>
      </td>
    </tr>
<?php
  }
?>
    <tr><td style="padding-top:10px"></td></tr>
    <tr>
      <td><input type="text" id="add_openid" name="add" size="30" maxlength="255" /></td>
      <td align="left">
	<input type="submit" name="submit" value="<?php echo _('Attach new OpenID'); ?>" />
      </td>
    </tr>
    <tr><td></td></tr>
  </table>
</form>
</div>

</body>
</html>
