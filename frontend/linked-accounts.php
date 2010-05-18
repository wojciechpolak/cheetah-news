<?php

/*
   Cheetah News linked-accounts.php
   Copyright (C) 2008, 2010 Wojciech Polak.

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
require_once 'lib/d-sigs.php';
require_once 'lib/facebook.php';
require_once 'Auth/OpenID/Consumer.php';
require_once 'Auth/OpenID/FileStore.php';
require_once 'Auth/OpenID/SReg.php';

start_session (null, true);
$session->auth ('iflogged');

$qs = false;
$message = '';

postvars ('sid,link,unlink');
$link = trim (strip_tags ($link));
$unlink = trim (strip_tags ($unlink));

$db = new Database ();

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
else if ($link == 'facebook')
{
  checkCSRF ($sid);
  try {
    $fb = new Facebook (array ('appId'  => $CONF['fb.app_id'],
			       'secret' => $CONF['fb.secret_key'],
			       'cookie' => true));
    $fb_session = $fb->getSession ();
    if ($fb_session) {
      $fb_uid = $fb->getUser ();
      if ($fb_uid) {
	$db->query ("UPDATE user SET fbUID=".$fb_uid." WHERE id='".
		    $session->id."'");
      }
    }
  }
  catch (FacebookApiException $e) {
    error_log ($e);
  }
}
else if ($unlink == 'facebook')
{
  checkCSRF ($sid);
  $db->query ("UPDATE user SET fbUID=0 WHERE id='".$session->id."'");
}
else if (!empty ($link))
{
  checkCSRF ($sid);
  $process_url = 'http://'.$CONF['site'].'/linked-accounts';
  $trust_root = 'http://'.$CONF['site'].'/';

  $store = new Auth_OpenID_FileStore ($CONF['openIdStorePath']);
  $consumer = new Auth_OpenID_Consumer ($store);
  $auth_request = $consumer->begin ($link);

  if (!$auth_request) {
    $message = _('OpenID authentication failed.');
  }
  else {
    if (strpos ($link, 'http://') !== 0)
      $link = 'http://'.$link;
    if ($link[strlen ($link) - 1] == '/')
      $link = substr ($link, 0, -1);

    $db->query ("SELECT id FROM openid WHERE identity='".$db->escape ($link)."'");
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
else if (!empty ($unlink)) {
  checkCSRF ($sid);
  $db->query ("DELETE FROM openid WHERE userid='".$session->id.
	      "' AND identity='".$db->escape ($unlink)."'");
  redirect ('linked-accounts');
}

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>Cheetah News</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="robots" content="noindex,nofollow" />
<link rel="stylesheet" href="<?=dsp('css.cswindow')?>" type="text/css" />
<link rel="icon" href="images/favicon.png" type="image/png" />
</head>
<body>

<a href="#" onclick="window.close()" style="float:right"><?php echo _('Close'); ?></a>

<?php

if (!empty ($message)) {
  echo '<div id="box"><h2>'.$message.'</h2></div><p></p>';
  if ($qs)
    exit ();
}

// Facebook
$fb_profile_url = null;
$db->query ("SELECT fbUID FROM user WHERE id='".$session->id."' AND fbUID!=0");
if ($db->next_record ()) {
  $fbUID = $db->f ('fbUID');
  $fb_profile_url = 'http://www.facebook.com/profile.php?id='.$fbUID;
}

// OpenIDs
$db->query ("SELECT * FROM openid WHERE userid='".$session->id."' ORDER BY identity");

?>

<div id="box">
  <h2><?php echo _('Linked Accounts'); ?></h2>
  <form action="linked-accounts" method="post">
    <ul id="accounts">
      <?php
    if ($fb_profile_url) {
      echo '<li><a href="'.$fb_profile_url.'" target="_blank">Facebook ID '.$fbUID.'</a>
	<a href="#" onclick="return detach(\'facebook\')">
	  <img class="img-16-delete" src="images/t.gif" width="16" height="16" style="border:none"
	       alt="'._('Unlink').'" title="'._('Unlink').'" />
	</a></li>'."\n";
    }
    while ($db->next_record ()) { ?>
      <li>
	<?php echo $db->f ('identity'); ?>
	<a href="#" onclick="return detach('<?=$db->f ('identity')?>')">
	  <img class="img-16-delete" src="images/t.gif" width="16" height="16" style="border:none"
	       alt="<?php echo _('Unlink'); ?>" title="<?php echo _('Unlink'); ?>" />
	</a>
      </li>
      <?php } ?>
    </ul>
    <div style="margin-top:10px; border-top:1px dotted #fffcc9;"></div>
    <div>
      <p class="left"><?php echo _('Link your Cheetah News account with:'); ?></p>
      <p id="providers">
        <?php if (isset ($CONF['fb.app_id'])) { ?>
	<a href="#" id="auth-facebook" title="Facebook"></a>
	<?php } ?>
	<a href="#" id="auth-google" title="Google"></a>
	<a href="#" id="auth-yahoo" title="Yahoo"></a>
	<a href="#" id="auth-openid" title="OpenID"></a>
      </p>
      <div style="clear:both"></div>
    </div>
    <div id="add-openid" class="hidden">
      <input type="hidden" name="sid" value="<?php echo session_id(); ?>" />
      <input type="hidden" id="unlink" name="unlink" disabled="disabled" />
      <input type="text" id="link" class="openid" name="link" size="30" maxlength="255" />
      <input type="submit" value="<?php echo _('Attach'); ?>" />
    </div>
  </form>
</div>

<script type="text/javascript">
function detach (id) {
  var c = confirm ('<?php echo _('Are you sure you want to detach this account?'); ?>');
  if (c) {
    var unlink = document.getElementById ('unlink');
    if (unlink) {
      unlink.value = id;
      unlink.disabled = false;
      document.getElementById ('link').disabled = true;
      document.forms[0].submit ();
    }
  }
  return false;
}
(function () {
  function GID (x) {
    return document.getElementById (x);
  }
  function selectAuthMech () {
    this.blur ();
    var id = this.id;
    if (id == 'auth-facebook') {
      FB.login (function (res) {
	  if (res.session && res.perms &&
	      res.perms.indexOf ('email') != -1) {
	    GID ('link').value = 'facebook';
	    document.forms[0].submit ();
	  }
	}, {perms: 'email'});
    }
    else if (id == 'auth-google') {
      GID ('link').value = 'https://www.google.com/accounts/o8/id';
      document.forms[0].submit ();
    }
    else if (id == 'auth-yahoo') {
      GID ('link').value = 'http://www.yahoo.com/';
      document.forms[0].submit ();
    }
    else if (id == 'auth-openid') {
      GID ('add-openid').className = '';
      GID ('link').focus ();
    }
    return false;
  }
  function init () {
    GID ('auth-facebook').onclick = selectAuthMech;
    GID ('auth-google').onclick = selectAuthMech;
    GID ('auth-yahoo').onclick = selectAuthMech;
    GID ('auth-openid').onclick = selectAuthMech;
  }
  window.onload = init;
})();
</script>

<?php if (isset ($CONF['fb.app_id'])) { ?>
<div id="fb-root"></div>
<script type="text/javascript" src="http://connect.facebook.net/en_US/all.js"></script>
<script type="text/javascript">
FB.init ({appId: '<?=$CONF['fb.app_id']?>', status: true, cookie: true, xfbml: false});
</script>
<?php } ?>

</body>
</html>
