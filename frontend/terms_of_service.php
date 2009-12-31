<?php

/*
   Cheetah News terms_of_service.php
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

require 'lib/include.php';
header ("Content-Type: text/html; charset=UTF-8");

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<?php
echo '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="'.$CHEETAH_LANG.'" lang="'.$CHEETAH_LANG.'">';
?>
<head>
<title><?php echo _('Terms of Service'); ?></title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="description" content="Policies for Use in Cheetah News Aggregator" />
<link rel="icon" href="images/favicon.png" type="image/png" />
</head>
<body>

<?php
i18n_get_content ('terms_of_service');
?>

</body>
</html>
