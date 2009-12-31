<?php

/*
   Cheetah News rd.php
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

include 'lib/gz.php';
require 'lib/include.php';

$feedurl = '';
if (isset ($_SERVER['QUERY_STRING']))
{
  if (substr ($_SERVER['QUERY_STRING'], 0, 8) == 'feedurl=')
    $feedurl = urldecode (substr ($_SERVER['QUERY_STRING'], 8));
}
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html><head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<script type="text/javascript">
window.location.replace("<?php echo 'http://'.$CONF['site'].'/';
if (!empty ($feedurl)) echo 'add?feedurl='.urlencode ($feedurl); ?>");
</script></head><body>
<noscript><?php echo _('JavaScript is required'); ?></noscript>
</body>
</html>
