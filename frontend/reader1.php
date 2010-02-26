<?php

/*
   Cheetah News reader1.php
   Copyright (C) 2005, 2006, 2007, 2008, 2010 Wojciech Polak.

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

include 'lib/gz.php';
require 'lib/include.php';

start_session (null);
$session->auth ('afterlogged');
if ($session->status['afterlogged'] == 'yes')
{
  $db = new Database;
  $db->query ("UPDATE user SET lastAccess=UTC_TIMESTAMP(), logCount=logCount+1 WHERE id='".$session->id."'");
  header ('Content-Type: text/html; charset=UTF-8');
  header ('Last-Modified: ' . gmdate ('D, d M Y H:i:s T'));
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html><head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<link id="style1" rel="stylesheet" type="text/css" href="d?q=css/1">
<link id="style1sticky" rel="alternate stylesheet" type="text/css" href="d?q=css/1&amp;sticky" title="sticky">
<script type="text/javascript" src="d?q=bt/1<?php if (!empty ($session->lang)) echo '&amp;'.$session->lang; ?>"></script>
<title>Cheetah News</title>
</head>
<body>
<noscript><?php echo _('JavaScript is required'); ?></noscript>

<div id="header" style="display:none">
  <span style="float:left; text-align:left">
    <span id="about"></span>
    <span id="welcome"></span>&nbsp;<?php echo $session->email.'.';?>&nbsp;&nbsp;
    <span id="menuLink" class="link"></span>
    <?php if ($session->email != 'guest') { ?>
    <img id="inf" src="images/invite.png" width="16" height="16" style="visibility:hidden" />
    <?php } ?>
  </span>
  <table id="controls" cellpadding="0" cellspacing="0">
    <tr><td align="left">
	<span id="weForecast" style="position:absolute;"></span>
	<span id="showAllActive" class="lbutton"></span>&nbsp;<span id="showAllLoaded" class="lbutton"></span>
	<span id="hideAll" class="lbutton"></span>&nbsp;<span id="refreshAll" class="lbutton"></span>
	<span id="filterVisible" class="lbutton"></span>
    </td></tr>
  </table>
</div>

<div id="topRightInfo">
  <span id="errorNotifier" style="display:none"></span>
  <span id="progressBar"></span>
</div>

<div id="aWindowContent" style="display:none">
  <p class="align-center">
    <b><?php printf (_("Bleeding-Edge Personal News Aggregator %s"), 'v1'); ?></b>
    <br />Copyright (C) 2005, 2006, 2007 The Cheetah News Team<br />
    <a href="privacy" target="Privacy Policy"><?php echo _('Privacy Policy'); ?></a> -
    <a href="terms_of_service" target="Terms of Service"><?php echo _('Terms of Service'); ?></a>
  </p>
  <p><?php echo _('Credits:'); ?></p>
  <ul>
    <li><a href="http://wojciechpolak.org/" target="Wojciech Polak">Wojciech Polak</a> -- <?php echo _('main programming and lead developer'); ?></li>
    <li><a href="http://gray.gnu.org.ua/" target="Sergey Poznyakoff">Sergey Poznyakoff</a> -- <?php echo _('additional programming'); ?></li>
    <li><a href="http://www.ranisz.o12.pl/" target="Marcin Raniszewski">Marcin Raniszewski</a> -- <?php echo _('additional programming'); ?></li>
    <li>Paweł Piekarski -- <?php echo _('graphics (icons)'); ?></li>
    <li><a href="http://www.famfamfam.com/" target="Mark James">Mark James</a> -- &quot;Silk&quot; icons</li>
    <li><a href="thanks" target="Thanks">Thanks</a></li>
  </ul>
  <p><?php echo _('Feedback:'); ?></p>
  <ul>
    <li><a href="http://blog.cheetah-news.com/" target="Cheetah News Blog">Cheetah News Blog</a></li>
    <!--<li><a href="mailto:cheetah-discuss@gnu.org.ua">cheetah-discuss@gnu.org.ua</a>
      <?php echo _('-- send us your bug reports and suggestions (public list).'); ?></li>-->
    <li><a href="mailto:cheetah-admins@gnu.org.ua">cheetah-admins@gnu.org.ua</a>
      <?php echo _('-- private list.'); ?></li>
  </ul>
</div>

<div id="controlPanel" style="display:none">
  <input id="cWindowSaveChanges" type="button" />
  <input id="cWindowCloseSettings" type="button" />
</div>

<div id="cWindowContent" style="display:none">
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
      <form id="addURLForm" action="#" autocomplete="off">
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
    <p><span id="addSwitcher" class="link"></span></p>
    <p>
      <span id="feedDirectoryLink" class="link"></span>&nbsp;&nbsp;
      <span id="popularFeedsLink" class="link"></span>
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
      <form id="addFolderForm" action="#" autocomplete="off">
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
      <tr><td id="cWindowLabel_4_Interface"></td><td><input id="cWindowLabel_4_IR1" type="radio" name="interface" value="style1" /> Basic</td></tr>
      <tr><td></td><td><input id="cWindowLabel_4_IR2" type="radio" name="interface" value="style1sticky" /> Sticky</td></tr>
      <tr><td colspan="2"><div class="cth-separator"></div></td></tr>
      <tr><td id="cWindowLabel_4_System"></td></tr>
      <tr><td><span id="cWindowLabel_4_ChangePassword" class="link"></span></td></tr>
    </table>
  </div>
</div>

<div id="movContainer" class="movContainer" style="display:none">
  <input type="hidden" name="feedid" maxlength="255" />
  <input type="text" name="desc" size="35" maxlength="40" />
  &nbsp; <span id="mStories"></span>: <input type="text" name="latest" size="2" maxlength="2" />
  &nbsp; <span id="mExpand"></span>: <input type="text" name="expand" size="2" maxlength="2" />
  &nbsp; <span id="mActive"></span>: <input type="checkbox" name="active" value="1" />
  &nbsp;&nbsp;
  <span>
    <span class="link" action="moveDown"><img src="images/10_down.png" width="10" height="10" /></span>
    <span class="link" action="moveUp"><img src="images/10_up.png" width="10" height="10" /></span>
    <span class="link" action="moveRight"><img src="images/10_right.png" width="10" height="10" /></span>
    <span class="link" action="rem"><img src="images/10_remove.png" width="10" height="10" /></span><br />
  </span>
</div>

<div id="fmovContainer" class="fmovContainer" style="display:none">
  <input type="hidden" name="folderid" maxlength="255" />
  <input type="text" name="desc" size="30" maxlength="30" />
  <span>
    <span class="link" action="moveDown"><img src="images/10_down.png" width="10" height="10" /></span>
    <span class="link" action="moveUp"><img src="images/10_up.png" width="10" height="10" /></span>
    <span class="link" action="rem"><img src="images/10_remove.png" width="10" height="10" /></span><br />
  </span>
</div>

<div id="sWindowModules" style="display:none">
  <div id="moduleNotes" class="module" style="display:none">
    <img src="images/notes.png" width="20" height="20" alt="[N]" />
    <span id="Notes" class="link"></span>
  </div>
  <div id="moduleWebSearch" class="module" style="display:none">
    <img src="images/search.png" width="20" height="20" alt="[S]" />
    <span id="WebSearch" class="link"></span>
  </div>
  <div id="moduleWeather" class="module" style="display:none">
    <img src="images/weather.png" width="20" height="20" alt="[W]" />
    <span id="Weather" class="link"></span>
  </div>
</div>
<div id="sWindowOptions" style="display:none">
  <span id="expandFolders" class="ilink"></span>&nbsp;
  <span id="collapseFolders" class="ilink"></span>
</div>

<?php if ($session->email != 'guest') { ?>
<div id="iWindowContent" style="display:none">
  <form action="#" autocomplete="off">
    <table width="95%">
      <tr><td id="iWindowT1" colspan="2" style="font-weight:bold"></td></tr>
      <tr><td></td></tr>
      <tr><td id="iWindowT2" width="30%"></td><td width="70%"><input id="inviteFN" maxlength="128" /></td></tr>
      <tr><td id="iWindowT3"></td><td><input id="inviteLN" maxlength="128" /></td></tr>
      <tr><td id="iWindowT4"></td><td><input id="inviteEM" maxlength="255" size="30" /></td></tr>
      <tr><td id="iWindowT5"></td><td><textarea id="inviteDE" rows="5" style="width:100%"></textarea></td></tr>
      <tr><td id="iWindowT6"></td>
	<td>
          <select id="inviteLA">
          <?php
            print_option ('null', _('Currently used language'));
            enumerate_languages ('print_option'); echo "\n";
          ?>
          </select>
	</td>
      </tr>
      <tr><td colspan="2"></td></tr>
      <tr><td colspan="2" align="center"><input id="iWindowSend" type="button" /></td></tr>
    </table>
  </form>
</div>
<?php } ?>

<div id="wsWindowContent" class="fWindowContent" style="display:none">
  <div id="wsWindowSE">
    <span id="wsWindowSE_1" class="wsLabelLink"></span>
    <span id="wsWindowSE_2" class="wsLabelLink"></span>
    <span id="wsWindowSE_3" class="wsLabelLink"></span>
    <span id="wsWindowSE_4" class="wsLabelLink"></span>
  </div>
  <div id="wsWindowSP">
    <form id="wsForm" action="#" autocomplete="off">
      <table id="wsWindowSPTable" height="60%" width="97%">
	<tr height="62"><td width="80%"><img id="wsWindowSEImage" src="images/google.png" alt="logo" /></td></tr>
	<tr>
	  <td><input id="phrase" type="text" style="width:100%" maxlength="255" /></td>
	  <td><input id="search" type="submit" /></td>
	</tr>
	<tr><td></td></tr>
	<tr>
	  <td colspan="2"><input id="wsWindowLocal" type="checkbox" />
	    <span id="wsWindowLocalD"></span></td>
	</tr>
	<tr>
	  <td colspan="2"><input id="wsWindowInAll" type="checkbox" />
	    <span id="wsWindowInAllD"></span></td>
	</tr>
      </table>
    </form>
  </div>
</div>

<div id="weWindowContent" class="fWindowContent" style="display:none">
  <div id="weTop">
    <span id="weLogo">
      <a class="channelLink" href="http://weather.yahoo.com/" target="weather.yahoo.com">
	<img src="images/yweather.png" width="142" height="22" alt="Yahoo! Weather"
	     style="vertical-align:top; border-style:none" /></a>
    </span>&nbsp;&nbsp;
    <span id="weAdd" class="ilink" style="display:none"></span>&nbsp;
    <span id="weRefresh" class="ilink" style="display:none"></span>
  </div>
  <div id="weEditArea" style="display:none;margin-top:1em">
    <form id="weLocationForm" action="#" autocomplete="off">
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
  <div id="weLocations"></div>
</div>

<div id="nbWindowContent" class="fWindowContent" style="display:none">
  <form id="nbForm" action="#" autocomplete="off">
    <span id="nbTags"></span>&nbsp;<input type="text" id="nbTagSearch" style="width:30%" maxlength="64" />
    <input type="submit" id="nbSearch" />
    <input type="button" id="nbCreate" />
    <a id="nbXmlFeed" href="http://<?php echo $CONF['site'].'/notes/'.$session->email; ?>" target="<?php echo 'notes/'.$session->email; ?>">
      <img src="images/xml.png" width="36" height="14" alt="[Atom Feed]" style="vertical-align:middle" />
    </a>
  </form>
  <div id="nbProgress"></div>
  <table id="nbNoteList">
    <thead><tr class="thead"><td id="nbWindowT1"></td><td id="nbWindowT2"></td><td id="nbWindowT3" width="30"></td><td></td><td width="15"></td></tr></thead>
    <tbody id="nbNoteListBody"></tbody>
  </table>
</div>

<div id="neWindowContent" class="neWindowContent" style="display:none">
  <div id="neProgress"></div>
  <div id="neForm" style="display:none">
    <form action="#" autocomplete="off">
      <input type="hidden" id="neId" />
      <input type="hidden" id="neStatus" />
      <input type="hidden" id="neColor" />
      <table class="neWindowTable">
	<tr><td id="neWindowT1" width="20%"></td><td><input id="neTitle" maxlength="64" style="width:90%" /></td></tr>
	<tr><td id="neWindowT2"></td><td><input id="neTags" maxlength="64" style="width:90%" />&nbsp<span id="neTagsHelp">(?)</span></td></tr>
	<tr><td id="neWindowT3"></td>
	  <td class="colorSelection">
	    <div class="colorOption" rgb="#ffffff" style="background-color:#ffffff"></div>
	    <div class="colorOption" rgb="#ffffe0" style="background-color:#ffffe0"></div>
	    <div class="colorOption" rgb="#ddceff" style="background-color:#e6dbff"></div>
	    <div class="colorOption" rgb="#eaffef" style="background-color:#caffd8"></div>
	    <div class="colorOption" rgb="#ffdfff" style="background-color:#ffdfff"></div>
	</td></tr>
	<tr>
	  <td id="neWindowT4"></td><td><input type="checkbox" id="nePublic" />
	    <span id="neWindowTDL" class="hidden" style="margin-left:15px">
	      <a id="neDelicious" href="http://del.icio.us/post"><img src="images/delicious.png" width="10" height="10" alt="del.icio.us" <?php echo 'title="'._('Bookmark to del.icio.us').'"'; ?> /></a>&nbsp;&nbsp;<a id="neDigg" href="http://digg.com/submit"><img src="images/digg.png" width="11" height="11" alt="digg" <?php echo 'title="'._('Digg it').'"'; ?> /></a>
	    </span>
	  </td>
	</tr>
      </table>
    </form>
    <div id="neWindowT5" style="margin-bottom:2px"></div>
    <div id="neNote" class="neNote"></div>
    <div style="margin-top:3px"><input id="neAccept" type="button" /></div>
  </div>
</div>

<div id="filterDialog" style="display:none">
  <form id="filterForm" action="#" autocomplete="off">
    <span id="filterText"></span>:&nbsp;&nbsp;
    <input id="filterInput" type="text" maxlength="33" style="width:70%" />
    <div id="filterMsg"></div>
  </form>
</div>

<div id="dWindowContent" class="dWindowContent" style="display:none">
  <div id="dWindowContentMsg1"></div>
  <span id="dWindowContentMsg2"></span>
</div>

<div id="menu">
  <span id="menuOpenSWindow" class="ilinkCM">&nbsp;<img src="images/mstuff.png" width="16" height="16" alt="" /></span><hr />
  <span id="menuOpenCWindow1" class="linkCM">&nbsp;<img src="images/madd.png" width="16" height="16" alt="" /></span>
  <span id="menuOpenCWindow2" class="linkCM">&nbsp;<img src="images/msubs.png" width="16" height="16" alt="" /></span>
  <span id="menuOpenCWindow3" class="linkCM">&nbsp;<img src="images/mfolders.png" width="16" height="16" alt="" /></span>
  <span id="menuOpenCWindow4" class="linkCM">&nbsp;<img src="images/medit.png" width="16" height="16" alt="" /></span>
  <hr /><span id="logout" class="linkCM">&nbsp;<img src="images/mlogout.png" width="16" height="16" alt="" /></span>
</div>

</body>
</html>
<?php
}
?>
