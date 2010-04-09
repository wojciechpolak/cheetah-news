#!/usr/bin/env php
<?php

/*
   Cheetah News backend/d-update.php
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

require '/websites/cheetah/frontend/lib/config.php';
require '/websites/cheetah/frontend/lib/d-files.php';

$sigs = array ();

foreach ($files as $k => $d)
{
  if (!isset ($sigs[$k]))
    $sigs[$k] = '';

  foreach ($d[1] as $f) {
    $sigs[$k] .= @md5_file ($CONF['baseDir'].'/'.$f);
  }
}

$len = count ($sigs);
$i = 1;

echo "<?php\n";
echo "\$SIGS = array (\n";
foreach ($sigs as $k => $sig)
{
  $s = substr (md5 ($sig), 0, 5);
  echo "  '$k' => '$s'";
  if ($i < $len) echo ',';
  echo "\n";
  $i++;
}
echo ");\n";
echo "?>\n";

?>
