<?php

/*
   Cheetah News login.php
   Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012 Wojciech Polak.

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
require_once 'lib/register.php';
require_once 'Auth/OpenID/Consumer.php';
require_once 'Auth/OpenID/FileStore.php';
require_once 'Auth/OpenID/SReg.php';

getvars ('cEmail,cPassword,openid_identifier,PersistentCookie,SignIn');
getvars ('fbConnect,signed_request');
postvars ('regPassword,regRPassword,SignUp,RecoverPassword');

if (!isset ($insideLogin)) {
  if ($cEmail == 'guest') $PersistentCookie = 'no';
  start_session ($PersistentCookie);
}

$cEmail = htmlspecialchars (strip_tags ($cEmail));
$openid_identifier = htmlspecialchars (strip_tags ($openid_identifier));

$validPass = true;
$validPassLen = true;
$message = false;
$mode = 'signIn';
$SignUpEnabled = true;

if (isset ($_GET['openid_mode']) && !empty ($_GET['openid_mode']))
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
    $message = sprintf (_('OpenID authentication failed: %s'), $response->message);
  }
  else if ($response->status == Auth_OpenID_SUCCESS)
  {
    $sreg_resp = Auth_OpenID_SRegResponse::fromSuccessResponse ($response);
    $sreg = $sreg_resp->contents ();

    $email = '';
    if (isset ($sreg['email']))
      $email = strip_tags ($sreg['email']);
    $message = $_SESSION['session']->openid2 ($response->identity_url,
					      $email);
  }
}
else if ($fbConnect && isset ($CONF['fb.app_id']) &&
	 isset ($CONF['fb.secret_key'])) {
  require 'lib/facebook.php';
  $fb = new Facebook (array ('appId'  => $CONF['fb.app_id'],
			     'secret' => $CONF['fb.secret_key'],
			     'cookie' => true));
  $fb_uid = $fb->getUser ();
  if ($fb_uid) {
    $insideFB = $signed_request ? true : false;
    $message = $_SESSION['session']->fb_login ($fb, $fb_uid, $insideFB);
  }
}
else if ($SignIn)
{
  if (!empty ($openid_identifier)) {
    $message = $_SESSION['session']->openid1 ($openid_identifier);
  }
  else if (!$_SESSION['session']->login ($cEmail, $cPassword))
    $message = _('E-mail and password do not match.');
}
else if ($RecoverPassword)
{
  include 'lib/forgotpassword.php';
  $res = fpSendEmail ($cEmail);
  switch ($res) {
    case 0:
      $message = _('E-mail has been sent to you.');
      break;
    case -1:
      $message = _('Please specify a valid e-mail address.');
      $mode = 'passwordRecovery';
      break;
    case -2:
      $message = _('Service temporarily unavailable. Please try again later.');
      $mode = 'passwordRecovery';
      break;
    case -3:
      $message = _("Account doesn't exist.");
      $mode = 'passwordRecovery';
  }
}
else if ($SignUp && $SignUpEnabled)
{
  if (empty ($cEmail)) {
    $message = _('Please specify a valid e-mail address.');
    $mode = 'registration';
  }
  else if (empty ($regPassword)) {
    $message = _('Password cannot be an empty string.');
    $mode = 'registration';
  }
  else if ($regPassword != $regRPassword) {
    $message = _('Passwords do not match.');
    $mode = 'registration';
  }
  else {
    $res = rpNewSendEmail ($cEmail, $regPassword);
    switch ($res) {
      case 0:
	$message = _('A registration confirmation e-mail has been sent to you.');
	break;
      case -1:
	$message = _('Please specify a valid e-mail address.');
	$mode = 'registration';
	break;
      case -2:
	$message = _('Service temporarily unavailable. Please try again later.');
	$mode = 'registration';
	break;
      case -3:
	$message = _('Account already exists.');
	$mode = 'registration';
	break;
    }
  }
}

header ("Content-Type: text/html; charset=UTF-8");
if (isset ($_SERVER['HTTPS']))
  header ("X-XRDS-Location: https://".$CONF['site']."/xrds.xml");
else
  header ("X-XRDS-Location: http://".$CONF['site']."/xrds.xml");
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<?php
echo '<html xmlns="http://www.w3.org/1999/xhtml">';
?>

<head>
<title><?php echo _('Welcome to Cheetah News'); ?></title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta http-equiv="X-XRDS-Location" content="/xrds.xml" />
<meta name="description" content="Web-based Personal News Aggregator. The Google Reader Alternative." />
<meta name="keywords" content="cheetah news, web-based personal news aggregator, feedreader, feeds, rss, atom, rdf, web 2.0" />
<meta name="robots" content="index,nofollow" />
<link rel="stylesheet" href="<?=dsp('css.login')?>" type="text/css" />
<link rel="icon" href="images/favicon.png" type="image/png" />
<script type="text/javascript" src="<?=dsp('login')?>"></script>
</head>
<body>

<div id="main">
<div id="signIn" class="box">
<form id="f1" action="<?php echo $CONF['secureProto'].'://'.$CONF['site'].'/login'; ?>" method="post">
  <table width="100%" border="0">
    <tr id="trCEmail" class="hidden">
      <td style="width:35%" align="right"><?php echo _('E-mail: '); ?></td>
      <td style="width:65%" align="left">
	<input type="text" id="cEmail" name="cEmail" value="<?php echo $cEmail; ?>" style="width:95%" maxlength="255" />
      </td>
    </tr>
    <tr id="trCPassword" class="hidden">
      <td align="right"><?php echo _('Password: '); ?></td>
      <td align="left"><input type="password" id="cPassword" name="cPassword" style="width:95%" maxlength="255" /></td>
    </tr>
    <tr id="trExtAuth">
      <td colspan="2">
	<div class="left">
	  <p><?php echo _('Sign in using your account with: '); ?></p>
	  <p id="providers">
	    <a href="#" id="auth-facebook" title="Facebook"></a>
	    <a href="#" id="auth-google" title="Google"></a>
	    <a href="#" id="auth-yahoo" title="Yahoo"></a>
	    <a href="#" id="auth-openid" title="OpenID"></a>
	  </p>
	  <div style="clear:both"></div>
	</div>
      </td>
    </tr>
    <tr id="trOpenID" class="hidden">
      <td align="right"><?php echo _('OpenID: '); ?></td>
      <td>
	<input type="text" id="openid_identifier" name="openid_identifier"
	       style="width:90%" maxlength="255" />
      </td>
    </tr>
    <tr>
      <td align="right"><input type="checkbox" id="PersistentCookie" name="PersistentCookie" value="yes" /></td>
      <td align="left"><label for="PersistentCookie"><?php echo _('Remember me on this computer.'); ?></label></td>
    </tr>
    <tr>
      <td align="right"></td>
      <td align="left">
	<input type="submit" id="SignIn" name="SignIn" value="<?php echo _('Sign in'); ?>" />
	<span id="l0wrap" class="hidden">
	  (<a id="l0" href="http://blog.cheetah-news.com/2008/09/ssl-certificate/"><?php echo _('About SSL'); ?></a>)
	</span>
      </td>
    </tr>
    <tr style="height:10px"><td></td></tr>
    <tr>
      <td align="left" colspan="2">
	<span id="useOpenID" class="link" style="display:none"><?php echo _('Use OpenID'); ?></span>
	<span id="useCommon" class="link"><?php echo _('Use e-mail / password'); ?></span>
      </td>
    </tr>
    <tr id="trForgotPassword">
      <td colspan="2" align="left">
	<span id="forgotPassword" class="link"><?php echo _('Forgot your password?'); ?></span>
      </td>
    </tr>
    <tr>
      <td colspan="2" align="left">
	<span class="smaller"><?php echo _("Don't have an account?"); ?></span>
	<span id="signUp" class="<?php echo ($SignUpEnabled) ? 'link' : 'deadlink'; ?>"><?php echo _('Sign Up'); ?></span>
	<span class="smaller">&nbsp;<?php echo _('or'); ?>&nbsp;</span>
	<span id="guestLogin" class="link"><?php echo _('Guest login'); ?></span>
      </td>
    </tr>
    <tr style="height:15px"><td></td></tr>
    <tr>
      <td colspan="2" align="left"><span id="learnMore" class="link"><?php echo _('Learn more'); ?></span></td>
    </tr>
    <tr>
      <td align="left" colspan="2">
	<a id="l1" href="http://<?php echo $CONF['site']; ?>/privacy"><?php echo _('Privacy Policy'); ?></a>&nbsp;&nbsp;
	<a id="l2" href="http://<?php echo $CONF['site']; ?>/terms_of_service"><?php echo _('Terms of Service'); ?></a>&nbsp;&nbsp;
      </td>
    </tr>
    <tr>
      <td align="right" colspan="2">
	<script type="text/javascript">
	  var addthis_config = {
	    username: 'wojciechpolak',
	    ui_header_color: '#ffffff',
	    ui_header_background: '#000000',
	    data_track_clickback: false,
	    services_compact: 'delicious,twitter,facebook,friendfeed,googlebuzz,google,stumbleupon,digg,reddit,more'
          };
          var addthis_share = {
	    url: 'http://www.cheetah-news.com/',
	    title: 'Cheetah News -- Web-based Personal News Aggregator'
          };
	</script>
	<a href="http://www.addthis.com/bookmark.php?v=250" class="addthis_button"><img src="images/share.png" width="83" height="16" alt="Bookmark and Share" style="border-style:none" /></a>
<?php if (isset ($_SERVER['HTTPS'])) { ?>
	<script type="text/javascript" src="https://secure.addthis.com/js/250/addthis_widget.js"></script>
<?php } else { ?>
        <script type="text/javascript" src="http://s7.addthis.com/js/250/addthis_widget.js"></script>
<?php } ?>
      </td>
    </tr>
  </table>
</form>
</div>
<div id="passwordRecovery" class="box">
<form id="f2" action="login" method="post">
  <table width="100%" border="0">
    <tr><td colspan="2"><?php echo _('Password Recovery'); ?></td></tr>
    <tr>
      <td style="width:35%" align="right"><?php echo _('E-mail: '); ?></td>
      <td style="width:65%" align="left">
	<input type="text" id="prCEmail" name="cEmail" style="width:95%" maxlength="255" value="" />
      </td>
    </tr>
    <tr>
      <td></td>
      <td align="left">
	<input type="submit" id="prSubmit" name="RecoverPassword" value="<?php echo _('Submit'); ?>" />
      </td>
    </tr>
    <tr><td></td></tr>
    <tr>
      <td colspan="2" align="left">
	<span id="prSignIn" class="link"><?php echo _('Sign in'); ?></span>
      </td>
    </tr>
  </table>
</form>
</div>
<div id="registration" class="box">
<form action="<?php echo $CONF['secureProto'].'://'.$CONF['site'].'/login'; ?>" method="post">
  <table width="100%" border="0">
    <tr><td colspan="2"><?php echo _('Registration Process'); ?></td></tr>
    <tr>
      <td style="width:35%" align="right"><?php echo _('E-mail: '); ?></td>
      <td style="width:65%" align="left">
	<input type="text" id="reCEmail" name="cEmail" style="width:95%" maxlength="255" value="<?php echo $cEmail?>" />
      </td>
    </tr>
    <tr>
      <td align="right"><?php echo _('Password: '); ?></td>
      <td align="left"><input type="password" name="regPassword" style="width:95%" maxlength="255" /></td>
    </tr>
    <tr>
      <td align="right"><?php echo _('Re-type password: '); ?></td>
      <td align="left"><input type="password" name="regRPassword" style="width:95%" maxlength="255" /></td>
    </tr>
    <tr>
      <td></td>
      <td align="left"><input type="submit" id="reSubmit" name="SignUp" value="<?php echo _('Sign Up'); ?>" /></td>
    </tr>
    <tr><td></td></tr>
    <tr>
      <td colspan="2" align="left">
	<span id="registrationSignIn" class="link"><?php echo _('I already have an account'); ?></span>
      </td>
    </tr>
  </table>
</form>
</div>
<div id="about" class="box">
  <p style="font-weight:bold;text-align:left">
    <?php printf (_("Bleeding-Edge Personal News Aggregator %s"), 'v2'); ?>
  </p>
  <div>
<?php i18n_get_content ('description'); ?>
  </div>
  <p><span id="aboutSignIn" class="link"><?php echo _('Sign in'); ?></span>&nbsp;</p>
  <p>&nbsp;</p>
</div>
<div id="banner">
  <?php
   echo '<a id="l3" href="http://www.cheetah.org/" title="'._('[External link] Help Save the Wild Cheetah').'">';
   echo _('Help Save the Wild Cheetah') . '</a>'; ?>
</div>
<div id="mode" style="display:none"><?php echo $mode; ?></div>
<?php
if ($message)
  echo '<div id="message">'.$message.'</div>';
?>

</div>

<?php if (isset ($CONF['fb.app_id'])) { ?>
<div id="fb-root"></div>
<script type="text/javascript">
window.fbAsyncInit = function() {
  FB.init ({appId: '<?=$CONF['fb.app_id']?>', oauth: true, status: true, cookie: true, xfbml: false});
};
(function(d) {
  var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement('script'); js.id = id; js.async = true;
  js.src = "//connect.facebook.net/en_US/all.js";
  ref.parentNode.insertBefore(js, ref);
}(document));
</script>
<?php } ?>

<?php if (isset ($CONF['google.analytics']) && !isset ($_GET['openid_mode'])) { ?>
<script type="text/javascript">
var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
</script>
<script type="text/javascript">
var pageTracker = _gat._getTracker('<?=$CONF["google.analytics"]?>');
pageTracker._trackPageview();
</script>
<?php } ?>

</body>
</html>
