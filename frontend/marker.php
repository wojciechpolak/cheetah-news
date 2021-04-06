<?php

/*
   Cheetah News marker.php
   Copyright (C) 2005, 2006, 2008 Wojciech Polak.

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

start_session (null);
$session->auth ('iflogged');

postvars ('q,add,rem');

$db = null;

if ($session->status['afterlogged'] == 'yes')
{
  $db = new Database ();
  if (!empty ($add))
    addMarkers ();
  if (!empty ($rem))
    remMarkers ();
  if (isset ($_POST['q']))
    getMarkers ();
}
else {
  $msg = _('Operation not permitted. Access denied');
  if (isset ($_POST['q']))
    printXmlError (null, $msg);
  else
    printJsError ($msg);
}

function getMarkers ()
{
  global $session, $db;
  $days = 7;

  header ('Content-Type: application/x-javascript; charset=UTF-8');
  echo 'cheetahMarkers = {';
  $db->query ("SELECT CONCAT(MONTH(mstamp),'/',DAYOFMONTH(mstamp)) date,markers FROM marker WHERE userid='".
	      $session->id."' ORDER BY mstamp");
  $endi = $db->num_rows ();
  $stats = array ();
  $i = 1;
  while ($db->next_record ()) {
    $nr  = $endi - $i + 1;
    $mks = $db->f ('markers');
    $arr = preg_split (',', $mks);
    $endj = count ($arr);
    $stats[$db->f ('date')] = $endj;
    $j = 1;
    foreach ($arr as $hash) {
      if (empty ($hash))
	$hash = 'foo';
      echo "'$hash':$nr";
      if ($j++ < $endj)
	echo ",";
    }
    if ($i++ < $endi)
      echo ",";
  }
  echo "};\n";
  echo 'cheetahMarkersStats = {';
  $endj = count ($stats);
  $i = 1;
  foreach ($stats as $k => $v) {
    echo "'$k':$v";
    if ($i++ < $endj)
      echo ",";
  }
  echo "};\n";

  $cnt = 0;
  $db->query ("SELECT COUNT(*) cnt FROM marker WHERE userid='".$session->id."'");
  if ($db->next_record ())
    $cnt = $db->f ('cnt');
  if ($cnt > $days) {
    $db->query ("DELETE LOW_PRIORITY FROM marker WHERE userid='".$session->id."' ".
		"AND mstamp < DATE_SUB(NOW(), INTERVAL $days DAY) ORDER BY mstamp LIMIT 1");
  }
}

function addMarkers ()
{
  global $session, $db, $add;
  $add = $db->escape ($add);

  $db->query ("SELECT id FROM marker WHERE userid='".$session->id."' ".
	      "AND DATE_FORMAT(mstamp, '%Y-%m-%d')=CURDATE() LIMIT 0,1");
  if ($db->next_record ()) {
    $id = $db->f ('id');
    $db->query ("UPDATE marker SET markers=CONCAT(markers,',','$add') WHERE id='$id'");
  }
  else {
    $db->query ("INSERT INTO marker SET userid='".$session->id."', markers='$add'");
  }
}

function remMarkers ()
{
  global $session, $db, $rem;
  $mem = array ();
  $cache = array ();
  $rem = $db->escape ($rem);

  $arr = preg_split (',', $rem);
  foreach ($arr as $hash) {
    if (!array_search ($hash, $cache)) {
      $hash = $db->escape ($hash);
      $db->query ("SELECT id, markers FROM marker WHERE userid='".$session->id."' ".
		  "AND FIND_IN_SET('$hash', markers)");
      while ($db->next_record ()) {
	$id  = $db->f ('id');
	if (array_key_exists ($id, $mem))
	  continue;
	$mem[$id] = true;
	$mks = $db->f ('markers');

	$arr1 = preg_split (',', $mks);
	$cache = array_merge ($cache, $arr1);

	$out = array_diff ($arr1, $arr);
	$end = count ($out); $i = 1;
	$outbuf = '';
	foreach ($out as $hout) {
	  $outbuf .= $hout;
	  if ($i++ < $end)
	    $outbuf .= ',';
	}
	$db->query ("UPDATE marker SET markers='$outbuf' WHERE id='$id'");
      }
    }
  }
}

?>
