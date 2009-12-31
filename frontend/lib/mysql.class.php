<?php

/*
   Cheetah News lib/mysql.class.php
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

class MySQL
{
  var $Host;
  var $Database;
  var $User;
  var $Password;

  var $AutoFree = false;
  var $Record   = array ();
  var $Row;
  var $Errno   = 0;
  var $Error   = '';
  var $LinkId  = 0;
  var $QueryId = 0;

  function link_id () {
    return $this->LinkId;
  }

  function query_id () {
    return $this->QueryId;
  }

  function connect ($database = '', $host = '', $user = '', $password = '') {
    if ($database == '')
      $database = $this->Database;
    if ($host == '')
      $host = $this->Host;
    if ($user == '')
      $user = $this->User;
    if ($password == '')
      $password = $this->Password;
      
    if ($this->LinkId == 0)
    {
      @$this->LinkId = mysql_pconnect ($host, $user, $password);
      if (!$this->LinkId) {
        $this->halt ('cannot connect to database '.$host);
      }
      if (!@mysql_select_db ($database, $this->LinkId)) {
        $this->halt ('cannot select database '.$database);
      }
      mysql_query ('SET NAMES utf8', $this->LinkId);
    }
    return $this->LinkId;
  }

  function free () {
    @mysql_free_result ($this->QueryId);
    $this->QueryId = 0;
  }

  function escape ($str) {
    if ($this->LinkId == 0) {
      if (!$this->connect ())
	return addslashes ($str);
    }
    $s = mysql_real_escape_string ($str, $this->LinkId);
    if ($s == false)
      return addslashes ($str);
    return $s;
  }

  function query ($queryString) {
    if ($queryString == '')
      return 0;
    if ($this->LinkId == 0) {
      if (!$this->connect ())
	return 0;
    }
    if ($this->QueryId)
      $this->free ();

    $this->QueryId = @mysql_query ($queryString, $this->LinkId);
    $this->Row   = 0;
    $this->Errno = mysql_errno ();
    $this->Error = mysql_error ();
    if (!$this->QueryId)
      $this->halt ('invalid SQL query: '.$queryString);

    return $this->QueryId;
  }

  function next_record () {
    if (!$this->QueryId) {
      $this->halt ('next_record called without query.');
      return 0;
    }

    $this->Record = @mysql_fetch_assoc ($this->QueryId);
    $this->Row   += 1;
    $this->Errno  = mysql_errno ();
    $this->Error  = mysql_error ();

    $stat = is_array ($this->Record);
    if (!$stat && $this->AutoFree)
      $this->free ();

    return $stat;
  }

  function data_seek ($row_number) {
    return @mysql_data_seek ($this->QueryId, $row_number);
  }

  function num_rows () {
    return @mysql_num_rows ($this->QueryId);
  }

  function affected_rows () {
    return @mysql_affected_rows ($this->LinkId);
  }

  function f ($name) {
    return $this->Record[$name];
  }

  function halt ($msg) {
    $this->Error = @mysql_error ($this->LinkId);
    $this->Errno = @mysql_errno ($this->LinkId);
    header ('Location: html/nodatabase');
    $this->haltmsg ($msg);
    exit;
  }

  function haltmsg ($msg) {
    trigger_error (sprintf ("Database error: %s", $msg), E_USER_ERROR);
    trigger_error (sprintf ("MySQL Error: %s (%s)", $this->Errno, $this->Error), E_USER_ERROR);
  }
}

?>
