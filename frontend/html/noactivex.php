<?php

/*
   Cheetah News html/noactivex.php
   Copyright (C) 2005 Wojciech Polak.

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

require '../lib/config.php';
require '../lib/i18n.php';
header ("Content-Type: text/html; charset=UTF-8");

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<?php echo '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="'.$CHEETAH_LANG.'" lang="'.$CHEETAH_LANG.'">'."\n"; ?>
<head>
<title>Cheetah News</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<link rel="stylesheet" href="../d?q=css.notice" type="text/css" />
<link rel="icon" href="../images/favicon.png" type="image/png" />
</head>
<body>
  <p><b><?php echo _('Cheetah News Aggregator requires ActiveX controls to be enabled.'); ?></b></p>
  <p><?php echo _('Your browser seems to be Internet Explorer, and ActiveX seems to be disabled.'); ?></p>
  <p><?php echo _('Please enable ActiveX controls in Internet Explorer. You can do this by going to the Tools menu,<br />selecting Internet Options, Security tab, Internet zone, and either select the Default Level,<br />or selecting Custom Level and scrolling down to "Run ActiveX controls and plug-ins" and selecting Enable.'); ?></p>
  <p><?php echo sprintf (_("After enabling ActiveX controls, %stry again%s."), '<a href="../">', '</a>'); ?></p>
</body>
</html>
