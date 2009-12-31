#! /usr/local/bin/php
<?php
/* This file is part of Cheetah News Aggregator
   Copyright (C) 2006 The Cheetah News Team

   This program is free software; you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation; either version 3 of the License, or (at your
   option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License along
   with this program.  If not, see <http://www.gnu.org/licenses/>. */

$confvars = array("dbDatabase" => "cheetah-database",
		  "dbHost" => "cheetah-host",
		  "dbUser" => "cheetah-user",
		  "dbPassword" => "cheetah-password",
		  "secureProto" => "cheetah-secure-proto",
		  "site" => "cheetah-site",
		  "mailFrom" => "cheetah-mail-from",
		  "mailHelp" => "cheetah-mail-help",
		  "siteContentDir" => "cheetah-site-content-dir",
		  "mailAdmin" => "cheetah-admin-email",
		  "sysName" => "cheetah-sys-name",
		  "textdomain" => "cheetah-textdomain",
		  "localePath" => "cheetah-locale-path",
                  "miscDir" => "cheetah-misc-dir",
		  "guestAccount" => "cheetah-guest-account",
		  "initInvUsers" => "cheetah-init-inv-users",
		  "invBase" => "cheetah-inv-base",
		  "invMod" => "cheetah-inv-mod",
		  "invLastAccessDays" => "cheetah-inv-last-access-days",
		  "invLogCount" => "cheetah-inv-log-count",
		  "baseDir" => "cheetah-base-dir",
		  "trsExpireDays" => "cheetah-trs-expire-days"
		  );

$outname = "/etc/cheetah.conf.scm";
$default_configfile = "/websites/cheetah/frontend/lib/config.php";

function help()
{
  global $argv, $outname, $default_configfile;
  
  echo <<<EOT
usage: $argv[0] [-o OUTPUT] [CONFIG]

Options are:

    -o, --output FILE      Create FILE instead of the default '$outname'
    -h, --help             Display this help summary.

Default CONFIG is $default_configfile
    
EOT
;
  exit(0);
}

error_reporting(E_ALL ^ E_NOTICE);
for ($i = 1; $i < $argc; $i++)
{
  switch ($argv[$i])
    {
    case "-o":
    case "--o":
    case "--ou":
    case "--out":
      $outname = $argv[++$i];
      break;

    case "-h":
    case "--h":
    case "--he":
    case "--hel":
    case "--help":
      help();
      break;
      
    default:
      if (preg_match ("/^-.*/", $argv[$i]))
	trigger_error ("Unknown option $argv[$i]", E_USER_ERROR);
      else if (!isset($configfile))
	$configfile = $argv[$i];
      else
	trigger_error ("Extra arguments", E_USER_ERROR);
    }
}

if (!isset ($configfile))
     $configfile = $default_configfile;
if (!isset($outname))
     trigger_error ("Use -o option", E_USER_ERROR);
     
require "$configfile";

function emit_str($file, $name, $value)
{
  fwrite ($file, "(set! $name \"$value\")\n");
}
     
function emit_num($file, $name, $value)
{
  fwrite ($file, "(set! $name $value)\n");
}
     
if (!($fp = fopen($outname, "wt")))
     exit(1);
fwrite($fp, ";;; Configuration file for Cheetah backend jobs.\n");
fwrite($fp, ";;; This file is generated automatically. Please do not edit.\n");
fwrite($fp, ";;; To regenerate this file, run $argv[0]\n\n");

foreach ($confvars as $var => $name)
{
  eval ("\$setp = isset (\$CONF[$var]);");
  if ($setp)
    {
      eval ("\$s=\$CONF[$var];");
      if (is_string ($s))
	{
	  if ($name == "cheetah-host")
	    $s = preg_replace ("/^:/", "", $s);
	  emit_str ($fp, $name, $s);
	}
      else
	emit_num ($fp, $name, $s);
    }
  else
    trigger_error ("Variable $var not set.", E_USER_NOTICE);
}

fclose ($fp);

?>
