<?php

/*
   Cheetah News login.php
   Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010 Wojciech Polak.

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
require_once "Auth/OpenID/SReg.php";

getvars ('cEmail,cPassword,openid_identifier,SignIn');
postvars ('feedurl,regPassword,regRPassword,PersistentCookie,SignUp,RecoverPassword');

if (empty ($feedurl) && isset ($_SERVER['QUERY_STRING']))
{
  if (substr ($_SERVER['QUERY_STRING'], 0, 8) == 'feedurl=')
    $feedurl = substr ($_SERVER['QUERY_STRING'], 8);
}

if (!isset ($insideLogin)) {
  if ($cEmail == 'guest') $PersistentCookie = 'no';
  start_session ($PersistentCookie);
}

$cEmail = htmlspecialchars (strip_tags ($cEmail));
$openid_identifier = htmlspecialchars (strip_tags ($openid_identifier));
$feedurl = strip_tags (urldecode ($feedurl));

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
else if ($SignIn)
{
  if (!empty ($openid_identifier)) {
    $message = $_SESSION['session']->openid1 ($openid_identifier, $feedurl);
  }
  else if (!$_SESSION['session']->login ($cEmail, $cPassword, $feedurl))
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
echo '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="'.$CHEETAH_LANG.'" lang="'.$CHEETAH_LANG.'">';
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
<div id="signIn">
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
    <tr id="trOpenID">
      <td align="right"><?php echo _('OpenID: '); ?></td>
      <td align="left">
	<input type="text" id="openid_identifier" name="openid_identifier"
	       class="openid_identifier" style="width:90%" maxlength="255" />
      </td>
    </tr>
    <tr>
      <td align="right"></td>
      <td align="left">
	<span id="useOpenID" class="link" style="display:none"><?php echo _('Use OpenID'); ?></span>
	<span id="useCommon" class="link"><?php echo _('Use username / password'); ?></span>
      </td>
    </tr>
    <tr>
      <td align="right"><input type="checkbox" id="PersistentCookie" name="PersistentCookie" value="yes" /></td>
      <td align="left"><label for="PersistentCookie"><?php echo _('Remember me on this computer.'); ?></label></td>
    </tr>
    <tr>
      <td><?php if (!empty ($feedurl)) echo '<input type="hidden" name="feedurl" value="'.htmlspecialchars ($feedurl).'" />'; ?></td>
      <td align="left">
	<input type="submit" id="SignIn" name="SignIn" value="<?php echo _('Sign in'); ?>" />
	<?php echo '(<a id="l0" href="http://blog.cheetah-news.com/2008/09/ssl-certificate/">'._('About SSL').'</a>)'; ?>
      </td>
    </tr>
    <tr style="height:10px"><td></td></tr>
    <tr id="trForgotPassword">
      <td colspan="2" align="left">
	<span id="forgotPassword" class="link"><?php echo _('Forgot your password?'); ?></span>
      </td>
    </tr>
    <tr id="trWhatIsOpenID">
      <td colspan="2" align="left">
	<a id="whatIsOpenID" href="http://www.wikipedia.org/wiki/OpenID"><?php echo _('What is OpenID?'); ?></a>
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
        var addthis_pub             = 'wojciechpolak'; 
        var addthis_url             = 'http://www.cheetah-news.com/';
        var addthis_title           = 'Cheetah News -- Web-based Personal News Aggregator';
        var addthis_logo            = 'http://www.cheetah-news.com/favicon.ico';
        var addthis_logo_background = 'ffffff';
        var addthis_logo_color      = '666699';
        var addthis_brand           = 'Cheetah News';
        var addthis_options         = 'favorites,email,delicious,twitter,facebook,friendfeed,google,digg,reddit,more';
	</script>
	<a href="http://www.addthis.com/bookmark.php?v=20" onmouseover="return addthis_open(this, '', 'http://www.cheetah-news.com/', 'Cheetah News -- Web-based Personal News Aggregator')" onmouseout="addthis_close()" onclick="return addthis_sendto()"><img src="images/share.png" width="83" height="16" alt="Bookmark and Share" style="border-style:none" /></a>
<?php if (isset ($_SERVER['HTTPS'])) { ?>
	<script type="text/javascript" src="https://secure.addthis.com/js/200/addthis_widget.js"></script>
<?php } else { ?>
	<script type="text/javascript" src="http://s7.addthis.com/js/200/addthis_widget.js"></script>
<?php } ?>
      </td>
    </tr>
  </table>
</form>
</div>
<div id="passwordRecovery">
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
<div id="registration">
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
<div id="about">
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
