<?php

/*
   Cheetah News reader.php
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

require 'lib/include.php';
require 'lib/d-sigs.php';

start_session (null);
$session->auth ('afterlogged');
if ($session->status['afterlogged'] == 'yes')
{
  getvars ('insideFB');

  $db = new Database;
  $db->query ("UPDATE user SET lastAccess=UTC_TIMESTAMP(), logCount=logCount+1 WHERE id='".$session->id."'");
  header ('Content-Type: text/html; charset=UTF-8');
  header ('Last-Modified: ' . gmdate ('D, d M Y H:i:s T'));
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:fb="http://www.facebook.com/2008/fbml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<link id="style" rel="stylesheet" type="text/css" href="<?=dsp('css')?>" />
<?php if ($CONF['feedEngine'] != 'cthonly') { ?><script type="text/javascript" src="http://www.google.com/jsapi?key=<?=$CONF['google.key']?>"></script>
<? } ?>
<script type="text/javascript">
<?php echo "var CONF = {'fbe': '".($insideFB ? 'google' : $CONF['feedEngine']).
   "', 'lang': '".($session->lang ? $session->lang : substr ($locale, 0, 2))
   ."', 'whatsnew': ".(int)$CONF['whatsnew']."};
var SIGS = {'js':'".$SIGS["js"]."', 'tr':'".$SIGS["tr"]."', 'wt':'".
   $SIGS["wt"]."', 'op':'".$SIGS["op"]."', 'dir':'".$SIGS["dir"]."'};\n"; ?>
</script>
<script type="text/javascript" src="<?=dsp('bt')?><?php if (!empty ($session->lang)) echo '&amp;lang='.$session->lang; ?>"></script>
<?php if ($insideFB) { ?><style type="text/css">body { font-size: 75%; }</style><?php } ?>

<title>Cheetah News</title>
</head>
<body>
<noscript><p><?php echo _('JavaScript is required'); ?></p></noscript>

<div id="header" style="display:none">
  <span style="float:left; text-align:left">
    <span id="about"></span>
    <span id="welcome"></span>&nbsp;<?php echo $session->email.'.';?>&nbsp;&nbsp;
    <span id="menuLink" class="link"></span>
  </span>
  <span style="float:right; text-align:left; margin-right:0.5em">
    <span id="whatsnew" class="link hidden"><?php echo _("What's New"); ?></span>
  </span>
  <table id="controls" cellpadding="0" cellspacing="0">
    <tr><td align="left">
	<span id="weForecast" class="pointer" style="position:absolute;"></span>
	<span id="showAllActive" class="lbutton"></span>&nbsp;<span id="showAllLoaded" class="lbutton"></span>
	<span id="hideAll" class="lbutton"></span>&nbsp;<span id="refreshAll" class="lbutton"></span>
	<span id="filterVisible" class="lbutton"></span>
    </td></tr>
  </table>
</div>

<div id="settings" style="display:none">
  <div id="cWindowBar">
    <span id="cWindowClose2" class="link pointer">
      <img class="img-12-remove" src="images/t.gif" width="12" height="12" alt="" />
    </span>
    <span id="cWindowTitle"></span>
    <span id="cWindowClose1" class="link"></span>
  </div>
  <div id="cWindowLabels">
    <span id="cWindowLabelLink_1" class="dLink"></span>
    <span id="cWindowLabelLink_2" class="dLink"></span>
    <span id="cWindowLabelLink_3" class="dLink"></span>
    <span id="cWindowLabelLink_4" class="dLink"></span>
  </div>
  <!-- Add New Feed -->
  <div id="cWindowLabel_1" class="cWindowLabel" style="display:none">
    <div id="addURL">
      <p id="cWindowLabel_1DescURL"></p>
      <form id="addURLForm" action="#">
	<input id="addURLInput" type="text" name="addURL" size="50" maxlength="255" />
	<input id="addURLAdd" type="submit" />
	<span id="addURLStatusBar" class="statusBar" style="display:none"></span>
      </form>
    </div>
    <div id="addOPML" style="display:none">
      <p id="cWindowLabel_1DescOPML"></p>
      <form enctype="multipart/form-data" action="import" target="uploadResult" method="post">
	<input type="hidden" name="MAX_FILE_SIZE" value="250000" />
	<input id="opmlfile" name="opmlfile" size="50" type="file" />
	<input id="uploadOPML" type="submit" />
	<span id="uploadStatusBar" class="statusBar" style="display:none"></span>
      </form>
      <iframe id="uploadResult" name="uploadResult" style="display:none"></iframe>
    </div>
    <div style="height:4px"></div>
    <p><?php echo _('or'); ?>&nbsp;
      <span id="addSwitcher" class="link"></span>&nbsp;&nbsp;
      &#8226; <span id="feedDirectoryLink" class="link"></span>&nbsp;&nbsp;
      &#8226; <span id="popularFeedsLink" class="link"></span>&nbsp;&nbsp;
      &#8226; <span id="followFriends" class="link"></span>&nbsp;&nbsp;
    </p>
    <div id="popularFeeds" style="display:none"></div>
  </div>
  <!-- Manage Subscriptions  -->
  <div id="cWindowLabel_2" class="cWindowLabel" style="display:none">
    <div id="separator2" class="cth-separator"></div>
    <table style="font-size:100%">
      <tr>
	<td>
	  <span id="cWindowLabel_2Desc"></span>
	  <input id="cWindowRefreshRate" type="text" size="4" maxlength="4" /> <span id="minutes"></span>.
	  &nbsp;&nbsp;&nbsp;&nbsp;
	</td>
	<td>
	  <span id="cWindowLabel_2Desc2"></span>
	  <input id="cWindowShowActive" type="checkbox" />
	  &nbsp;&nbsp;&nbsp;&nbsp;
	</td>
	<td>
	  <span id="cWindowLabel_2Desc3"></span>
	  <input id="cWindowOldestFirst" type="checkbox" />
	</td>
    </tr></table>
    <div class="cth-separator"></div>
    <div id="moveBoxes"></div>
  </div>
  <!-- Manage Folders -->
  <div id="cWindowLabel_3" class="cWindowLabel" style="display:none">
    <div>
      <form id="addFolderForm" action="#">
	<p id="cWindowLabel_3Desc"></p>
	<input id="addFolderInput" type="text" name="folder" size="40" maxlength="255" />
	<input id="addFolderAdd" type="submit" />
	<span id="addFolderStatusBar" class="statusBar" style="display:none"></span>
      </form>
    </div>
    <div class="cth-separator"></div>
    <p id="separator3"></p>
    <div id="fmoveBoxes"></div>
  </div>
  <!-- User Settings -->
  <div id="cWindowLabel_4" class="cWindowLabel" style="display:none">
    <div id="separator4" class="cth-separator"></div>
    <table id="msettings">
      <tr>
	<td id="cWindowLabel_4_Language"></td>
	<td>
	  <select id="changeLangOptions">
            <?php
	       function print_option ($code, $lang) {
	         echo '<option value="'.$code.'">'.$lang.'</option>';
               }
               print_option ('null', _('Browser preferred language'));
               enumerate_languages ('print_option'); echo "\n";
            ?>
	  </select>
	</td>
      </tr>
      <tr><td colspan="2"><div class="cth-separator"></div></td></tr>
      <tr><td id="cWindowLabel_4_Goodies"></td></tr>
      <tr><td colspan="2"><span id="cWindowLabel_4_AddHandler" class="link"></span></td></tr>
      <tr><td colspan="2"><div class="cth-separator"></div></td></tr>
      <tr><td id="cWindowLabel_4_System"></td></tr>
      <tr><td><span id="cWindowLabel_4_LinkedAccounts" class="link"></span>
	      <span class="cWindowHint">(OpenID, Facebook, etc.)</span></td></tr>
      <tr><td><span id="cWindowLabel_4_LinkFB" class="link"></span></td></tr>
      <tr><td><span id="cWindowLabel_4_ChangePassword" class="link"></span></td></tr>
    </table>
  </div>
</div>

<div id="weatherContent" style="display:none">
  <div id="weatherHeader">
    <span id="weClose2" class="link pointer" style="display:none">
      <img class="img-12-remove" src="images/t.gif" width="12" height="12" alt="" />
    </span>
    <span id="weLogo">
      <a class="channelLink" href="http://weather.yahoo.com/" target="weather.yahoo.com">
	<img src="images/yweather.png" width="142" height="22" alt="Yahoo! Weather"
	     style="vertical-align:top; border-style:none" /></a>
    </span>&nbsp;
    <span id="weClose1" class="link pointer"></span>&nbsp;&nbsp;
    <span id="weAdd" class="link pointer" style="display:none"></span>&nbsp;
    <span id="weRefresh" class="link pointer" style="display:none"></span>
  </div>
  <div id="weEditArea" style="display:none;margin-top:1em">
    <form id="weLocationForm" action="#">
      <p id="weLocationD0"></p>
      <table>
	<tr><td id="weLocationD1"></td><td><input id="weLocationId" type="hidden" /><input id="weLocationCode" type="text" size="12" maxlength="8" /></td></tr>
	<tr><td id="weLocationD2"></td><td><input id="weLocationDesc" type="text" size="24" maxlength="64" /></td></tr>
	<tr><td id="weLocationD3"></td><td><select id="weLocationUnit"><option value="c">C&deg;</option><option value="f">F&deg;</option></select></td></tr>
      </table>
      <p>
	<input id="weLocationSave" type="submit" />
	<input id="weLocationRem" type="button" />
	<input id="weLocationCancel" type="button" />
	<span id="weLocationStatusBar" class="statusBar" style="display:none"></span>
      </p>
      <p>
<?php i18n_get_content ('yweather'); ?>
      </p>
    </form>
  </div>
  <div id="weatherReports">
    <div id="weLocationsNames"></div>
    <div id="weLocationsBox">
      <div id="weLocations"></div>
    </div>
    <div style="clear:both"></div>
  </div>
</div>

<div id="notesContent" style="display:none">
  <div id="nbClose">
    <span id="nbClose2" class="pointer"><img class="img-12-remove" src="images/t.gif" width="12" height="12" alt="" /></span>
    <span id="nbClose1" class="link"></span>
  </div>
  <form id="nbForm" action="#">
    <span id="nbTags"></span>&nbsp;<input type="text" id="nbTagSearch" style="width:30%" maxlength="64" />
    <input type="submit" id="nbSearch" />
    <input type="button" id="nbCreate" />
    <a id="nbXmlFeed" href="http://<?php echo $CONF['site'].'/notes/'.$session->email; ?>" target="_blank">
      <img class="img-16-feed" src="images/t.gif" width="16" height="16" alt="[WebFeed]" style="vertical-align:middle" />
    </a>
  </form>
  <div id="nbProgress"></div>
  <div id="nbNoteList"></div>
  <div id="neWindowContainer" style="display:none">
    <div id="neWindowContent">
      <div id="neProgress"></div>
      <div id="neForm">
        <form action="#">
          <input type="hidden" id="neId" />
          <input type="hidden" id="neStatus" />
          <input type="hidden" id="neColor" />
          <table class="neWindowTable">
            <tr><td id="neWindowT1" style="width:4em"></td><td><input type="text" id="neTitle" maxlength="64" style="width:90%" /></td></tr>
	    <tr><td id="neWindowT2"></td><td><input type="text" id="neTags" maxlength="64" style="width:90%" />&nbsp;<span id="neTagsHelp">(?)</span></td></tr>
            <tr valign="top"><td id="neWindowT5"></td><td><div id="neNote"></div></td></tr>
            <tr><td id="neWindowT4"></td><td><input type="checkbox" id="nePublic" /></td></tr>
          </table>
        </form>
        <div><input id="neAccept" type="button" /> <input id="neCancel" type="button" /></div>
      </div>
    </div>
  </div>
</div><!-- /notes -->

<div id="reader"></div><!-- /reader -->

<div id="containers" style="display:none">

<div id="aboutContentWrap" style="display:none">
 <div id="aboutContent">
  <p class="align-center">
    <b><?php printf (_("Personal News Aggregator %s"), 'v2'); ?></b>
    <br />Copyright &copy; 2005-2010 The Cheetah News Team<br />
    <a href="privacy" target="Privacy_Policy"><?php echo _('Privacy Policy'); ?></a> -
    <a href="terms_of_service" target="Terms_of_Service"><?php echo _('Terms of Service'); ?></a>
  </p>
  <p><?php echo _('Credits:'); ?></p>
  <ul>
    <li><a href="http://wojciechpolak.org/" target="Wojciech_Polak">Wojciech Polak</a> -- <?php echo _('main programming and lead developer'); ?></li>
    <li><a href="http://gray.gnu.org.ua/" target="Sergey_Poznyakoff">Sergey Poznyakoff</a> -- <?php echo _('additional programming'); ?></li>
    <li><a href="http://www.ranisz.o12.pl/" target="Marcin_Raniszewski">Marcin Raniszewski</a> -- <?php echo _('additional programming'); ?></li>
    <li><a href="http://www.famfamfam.com/" target="Mark_James">Mark James</a> -- &quot;Silk&quot; icons</li>
    <li><a href="thanks" target="Thanks">Thanks</a></li>
  </ul>
  <p><?php echo _('Feedback:'); ?></p>
  <ul>
    <li><a href="http://blog.cheetah-news.com/" target="Cheetah_News_Blog">Cheetah News Blog</a></li>
    <li><a href="http://groups.google.com/group/cheetah-news" target="Cheetah_News_Group">Cheetah News Group</a>
      <?php echo _('-- send us your bug reports and suggestions (public list).'); ?></li>
    <li><a href="mailto:cheetah-admins@gnu.org.ua">cheetah-admins@gnu.org.ua</a>
      <?php echo _('-- private list.'); ?></li>
  </ul>
</div>
</div>

<div id="controlPanel" style="display:none">
  <input id="cWindowSaveChanges" type="button" />
  <input id="cWindowCloseSettings" type="button" />
  <span id="controlPanelStatusBar" class="statusBar" style="display:none"></span>
</div>

<div id="movContainer" class="movContainer" style="display:none">
  <input type="hidden" name="feedid" maxlength="255" />
  <input type="text" name="desc" size="35" maxlength="40" />
  &nbsp; <span id="mStories"></span>: <input type="text" name="latest" size="2" maxlength="2" />
  &nbsp; <span id="mExpand"></span>: <input type="text" name="expand" size="2" maxlength="2" />
  &nbsp; <span id="mActive"></span>: <input type="checkbox" name="active" value="1" />
  &nbsp;&nbsp;
  <span>
    <span class="link" action="moveDown"><img class="img-10-down" src="images/t.gif" width="10" height="10" alt="" /></span>
    <span class="link" action="moveUp"><img  class="img-10-up" src="images/t.gif" width="10" height="10" alt="" /></span>
    <span class="link" action="moveRight"><img class="img-10-right" src="images/t.gif" width="10" height="10" alt="" /></span>
    <span class="link" action="rem"><img  class="img-10-remove" src="images/t.gif" width="10" height="10" alt="" /></span><br />
  </span>
</div>

<div id="fmovContainer" class="fmovContainer" style="display:none">
  <input type="hidden" name="folderid" maxlength="255" />
  <input type="text" name="desc" size="30" maxlength="30" />
  <span>
    <span class="link" action="moveDown"><img class="img-10-down" src="images/t.gif" width="10" height="10" alt="" /></span>
    <span class="link" action="moveUp"><img class="img-10-up" src="images/t.gif" width="10" height="10" alt="" /></span>
    <span class="link" action="rem"><img class="img-10-remove" src="images/t.gif" width="10" height="10" alt="" /></span><br />
  </span>
</div>

<div id="sWindowOptions" style="display:none">
  <span id="expandFolders" class="ilink"></span>&nbsp;
  <span id="collapseFolders" class="ilink"></span>
</div>

</div><!-- /containers -->

<div id="topRightInfo">
  <span id="errorNotifier" style="display:none"></span>
  <span id="progressBar"></span>
</div>

<div id="filterDialog" style="display:none">
  <form id="filterForm" action="#">
    <span id="filterText"></span>:&nbsp;&nbsp;
    <input id="filterInput" type="text" maxlength="33" style="width:70%" />
    <div id="filterMsg"></div>
  </form>
</div>

<div id="menu">
  <span id="menuOpenSWindow" class="ilinkCM">&nbsp;<img src="images/t.gif" width="16" height="16" alt="" /></span>
  <span id="menuOpenFacebook" class="ilinkCM">&nbsp;<img src="images/t.gif" width="16" height="16" alt="" /></span>
  <span id="menuOpenNotes" class="linkCM">&nbsp;<img src="images/t.gif" width="16" height="16" alt="" /></span>
  <span id="menuOpenWeather" class="linkCM">&nbsp;<img src="images/t.gif" width="16" height="16" alt="" /></span>
  <span id="menuOpenFanbox" class="linkCM">&nbsp;<img src="images/t.gif" width="16" height="16" alt="" /></span><hr />
  <span id="menuOpenCWindow1" class="linkCM">&nbsp;<img src="images/t.gif" width="16" height="16" alt="" /></span>
  <span id="menuOpenCWindow2" class="linkCM">&nbsp;<img src="images/t.gif" width="16" height="16" alt="" /></span>
  <span id="menuOpenCWindow3" class="linkCM">&nbsp;<img src="images/t.gif" width="16" height="16" alt="" /></span>
  <span id="menuOpenCWindow4" class="linkCM">&nbsp;<img src="images/t.gif" width="16" height="16" alt="" /></span>
  <hr /><span id="logout" class="linkCM">&nbsp;<img src="images/t.gif" width="16" height="16" alt="" /></span>
</div>

<?php if (isset ($CONF['fb.app_id'])) { ?>
<script type="text/javascript">CONF.fb_app_id = '<?=$CONF["fb.app_id"]?>';</script>
<div id="fb-root"></div>
<div id="fbFanbox" style="display:none">
  <iframe src="http://www.facebook.com/plugins/fan.php?id=<?=$CONF['fb.app_id']?>&amp;width=500&amp;height=300&amp;connections=10&amp;stream=false&amp;header=false" scrolling="no" frameborder="0" allowTransparency="true" style="border:none; overflow:hidden; width:500px; height:300px"></iframe>
</div>
<?php } ?>

<?php if (isset ($CONF['google.analytics'])) { ?>
<script type="text/javascript">
var tracker;
setTimeout (function () {
  $.getScript ('http://www.google-analytics.com/ga.js', function () {
    if (typeof _gat != 'undefined') {
      tracker = _gat._getTracker ('<?=$CONF["google.analytics"]?>');
      tracker._initData (); tracker._trackPageview ();
    }}); }, 5000);
</script>
<?php } ?>

</body>
</html>
<?php
}
?>
