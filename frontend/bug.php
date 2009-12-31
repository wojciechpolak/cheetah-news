<?php

/*
   Cheetah News bug.php
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

start_session (null, false);
$session->auth ('iflogged');

if ($session->status['afterlogged'] == 'yes')
{
  postvars ('msg');
  if (empty ($msg))
    exit;

  $logfile = 'errorlog';

  if ($fh = @fopen ($CONF['baseDir'].'/'.$logfile, 'a'))
  {
    @fwrite ($fh, gmdate ('Y-m-d D H:i:s'));
    @fwrite ($fh, ', UID: '.$session->id);
    @fwrite ($fh, ', MSG: '.$msg);

    if (isset ($_SERVER['HTTP_USER_AGENT']))
      @fwrite ($fh, ', User-Agent: '.$_SERVER['HTTP_USER_AGENT'].')');

    @fwrite ($fh, "\n");
    @fclose ($fh);
  }
}

?>
