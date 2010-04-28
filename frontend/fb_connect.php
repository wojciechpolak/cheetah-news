<?php

/*
   Cheetah News fb_connect.php
   Copyright (C) 2010 Wojciech Polak.

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
require_once 'lib/facebook.php';

start_session (null, true);
$session->auth ('iflogged');
$message = '';
$auth = true;

getvars ('link');

if ($session->status['afterlogged'] != 'yes' ||
    $session->email == 'guest')
{
  $message = _('You are using a guest account. You must register in order to do this.');
  $auth = false;
}
else if ($link == '1')
{
  try {
    $fb = new Facebook (array ('appId'  => $CONF['fb.app_id'],
			       'secret' => $CONF['fb.secret_key'],
			       'cookie' => true));
    $fb_session = $fb->getSession ();
    if ($fb_session) {
      $fb_uid = $fb->getUser ();
      if ($fb_uid) {
	$db = new Database ();
	$db->query ("UPDATE user SET fbUID=".$fb_uid." WHERE id='".
		    $session->id."'");
      }
    }
  }
  catch (FacebookApiException $e) {
    error_log ($e);
  }
}
else if ($link == '0')
{
  $db->query ("UPDATE user SET fbUID=0 WHERE id='".$session->id."'");
}

if ($auth) {
  $profile_url = null;

  $db = new Database ();
  $db->query ("SELECT fbUID FROM user WHERE id='".$session->id."'");
  if ($db->next_record ()) {
    $fbUID = $db->f ('fbUID');

    try {
      $fb = new Facebook (array ('appId'  => $CONF['fb.app_id'],
				 'secret' => $CONF['fb.secret_key'],
				 'cookie' => true));
      $fb_session = $fb->getSession ();
      if ($fb_session) {
	$fb_uid = $fb->getUser ();
	if ($fb_uid) {
	  $me = $fb->api ('/me');
	  if ($me && isset ($me['link']))
	    $profile_url = $me['link'];
	}
      }
    }
    catch (FacebookApiException $e) {
      error_log ($e);
    }
  }
}

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:fb="http://www.facebook.com/2008/fbml">
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
<?php }

if ($auth) {
  if ($fbUID) {
    echo '<p>Your account is connected with Facebook UID: ';
    if ($profile_url)
      echo '<a href="'.$profile_url.'" target="_blank">'.$fbUID.'</a>';
    else
      echo $fbUID;
    echo '</p>';
  }
  else {
    echo '<p>Your account is not connected with Facebook</p>'."\n";
    echo '<p><fb:login-button length="long" onlogin="fb_link()" perms="email" /></p>'."\n";
  }
?>

<?php if (isset ($CONF['fb.app_id'])) { ?>
<div id="fb-root"></div>
<script type="text/javascript" src="http://connect.facebook.net/en_US/all.js"></script>
<script type="text/javascript">
  function fb_link () { window.location = 'fb_connect?link=1'; }
  FB.init ({appId: '<?=$CONF['fb.app_id']?>', status: true, cookie: true,
	    xfbml: true});
</script>
<?php } }?>

</body>
</html>
