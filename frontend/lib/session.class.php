<?php

/*
   Cheetah News lib/session.class.php
   Copyright (C) 2005, 2006, 2007, 2008 Wojciech Polak.

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

function start_session ($persistentCookie, $noCache = true, $age = 30)
{
  global $session;

  if ($noCache) {
    session_cache_limiter ('private');
    session_cache_expire (0);
  }
  else {
    session_cache_limiter ('private_no_expire');
    session_cache_expire (1);
  }

  session_name ('cheetah');
  session_start ();

  if ($persistentCookie == 'yes')
  {
    session_write_close ();
    session_set_cookie_params (86400*182);
    session_start ();
  }

  if (!isset($_SESSION['session']))
    $_SESSION['session'] = new Session ();

  $session = $_SESSION['session'];

  if ($noCache)
  {
    header ("Expires: 0");
    header ("Cache-Control: no-store, no-cache, must-revalidate");
    header ("Cache-Control: post-check=0, pre-check=0", false);
  }
  else {
    header ("Cache-Control: public, must-revalidate, max-age=$age, pre-check=$age");
  }

  if ($session->status['afterlogged'] == 'yes') {
    if ($session->lang)
      locale_setup ($session->lang);
  }
}

class Session
{
  var $id;
  var $email;
  var $pass;
  var $lang;
  var $status;

  function Session ()
  {
    $this->init ();
  }

  function init ()
  {
    $this->id = 0;
    $this->email = '';
    $this->pass  = '';
    $this->lang  = '';
    $this->status  = array ();
    $this->status['public'] = 'yes';
    $this->status['afterlogged'] = '';
    $this->status['iflogged'] = '';
  }

  function login ($email, $pass, $feedurl='')
  {
    global $CONF;

    session_regenerate_id ();

    $db = new Database ();

    if ($CONF['guestAccount'] && $email == 'guest' && $pass == 'guest')
    {
      $db->query ("SELECT id FROM user WHERE email='".$CONF['guestAccount'].
		  "' AND active='yes'");
      if ($db->next_record ())
      {
	$this->id    = $db->f('id');
	$this->email = 'guest';
	$this->pass  = 'guest';
	$this->lang  = '';
	$this->status['afterlogged'] = 'yes';
	$this->status['iflogged'] = 'yes';

	if (isset ($_SERVER['HTTPS']))
	  redirect ($CONF['secureProto'].'://'.$CONF['site'].'/rd');
	else
	  redirect ('http://'.$CONF['site'].'/');
      }
    }
    else {
      $db->query ("SELECT id,email,pass,lang FROM user ".
		  "WHERE email='".$db->escape ($email)."' AND pass='".
		  md5 ($pass)."' AND active != 'no' AND failogCount < 10");

      if ($db->next_record ())
      {
	$this->id    = $db->f ('id');
	$this->email = $db->f ('email');
	$this->pass  = $db->f ('pass');
	$this->lang  = $db->f ('lang');
	$this->status['afterlogged'] = 'yes';
	$this->status['iflogged'] = 'yes';

	$db->query ("UPDATE user SET lastLog='".gmdate ('Y-m-d H:i:s')."', ".
		    "active='yes', failogCount=0 WHERE id='".$this->id."'");

	$r = $CONF['secureProto'].'://'.$CONF['site'].'/rd';
	if (!empty ($feedurl))
	  $r .= '?feedurl=' . urlencode ($feedurl);
	redirect ($r);
      }
      else /* failog, protection against dictionary attack */
      {
	$db->query ("UPDATE user SET failogCount=failogCount+1 WHERE ".
		    "email='".$db->escape ($email).
		    "' AND active != 'no' AND failogCount < 10");
      }
    }
  }

  function openid1 ($openid_identifier, $feedurl='')
  {
    global $CONF;

    session_regenerate_id ();

    $process_url = $CONF['secureProto'].'://'.$CONF['site'].'/login';
    $trust_root = $CONF['secureProto'].'://'.$CONF['site'].'/';

    $store = new Auth_OpenID_FileStore ($CONF['openIdStorePath']);
    $consumer = new Auth_OpenID_Consumer ($store);
    $auth_request = $consumer->begin ($openid_identifier);

    if (!$auth_request)
      return _('OpenID authentication failed.');

    if (strpos ($openid_identifier, 'http://') !== 0)
      $openid_identifier = 'http://'.$openid_identifier;
    if ($openid_identifier[strlen ($openid_identifier) - 1] == '/')
      $openid_identifier = substr ($openid_identifier, 0, -1);

    $db = new Database ();
    $db->query ("SELECT id FROM openid WHERE identity='".
		$db->escape ($openid_identifier)."'");
    if (!$db->next_record ()) {
      $sreg_request = Auth_OpenID_SRegRequest::build (array ('email'), null,
						      'http://'.$CONF['site'].'/privacy');
      if ($sreg_request)
	$auth_request->addExtension ($sreg_request);
    }

    $redirect_url = $auth_request->redirectURL ($trust_root, $process_url);
    redirect ($redirect_url);
  }

  function openid2 ($identity, $email, $feedurl='')
  {
    global $CONF;

    $db = new Database ();

    if ($identity[strlen ($identity) - 1] == '/')
      $identity = substr ($identity, 0, -1);

    $db->query ("SELECT userid FROM openid WHERE identity='".
		$db->escape ($identity)."'");
    if ($db->next_record ())
    {
      $userid = $db->f ('userid');
      $db->query ("SELECT id,email,pass,lang FROM user ".
		  "WHERE id='".$userid."' AND active != 'no'");
      if ($db->next_record ())
      {
	$this->id    = $db->f('id');
	$this->email = $db->f('email');
	$this->pass  = $db->f('pass');
	$this->lang  = $db->f('lang');
	$this->status['afterlogged'] = 'yes';
	$this->status['iflogged'] = 'yes';

	$db->query ("UPDATE user SET lastLog='".gmdate ('Y-m-d H:i:s')."', ".
		    "active='yes' WHERE id='".$this->id."'");

	$r = $CONF['secureProto'].'://'.$CONF['site'].'/rd';
	if (!empty ($feedurl))
	  $r .= '?feedurl=' . urlencode ($feedurl);
	redirect ($r);
      }
      else
	return "OpenID account match error";
    }
    else if (ereg ("^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)+$", $email))
    {
      $db->query ("SELECT id FROM user WHERE email='".$db->escape ($email)."'");
      if ($db->next_record ()) {
	return _("To enable OpenID support, please visit Menu/User Settings/Manage your OpenIDs.");
      }

      $res = rpNewSendEmail ($email, uniqid (rand(), true), $identity);
      switch ($res) {
      case 0:
	return _('A registration confirmation e-mail has been sent to you.');
	break;
      case -1:
	return _('Please specify a valid e-mail address.');
	break;
      case -2:
	return _('Service temporarily unavailable. Please try again later.');
	break;
      case -3:
	return _('Account already exists.');
	break;
      }
    }
    else
      return _("New OpenID accounts without email address are not supported.");
  }

  function fb_login (&$fb, $fb_uid, $insideFB=false, $feedurl='')
  {
    global $CONF;

    $db = new Database ();
    $db->query ("SELECT id,email,pass,lang,fbUID FROM user ".
		"WHERE fbUID=".$fb_uid." AND active != 'no'");
    if ($db->next_record ())
    {
      $this->id    = $db->f('id');
      $this->email = $db->f('email');
      $this->pass  = $db->f('pass');
      $this->lang  = $db->f('lang');
      $this->status['afterlogged'] = 'yes';
      $this->status['iflogged'] = 'yes';

      $db->query ("UPDATE user SET lastLog='".gmdate ('Y-m-d H:i:s')."', ".
		  "active='yes' WHERE id='".$this->id."'");

      if ($insideFB) {
	$r = 'http://'.$CONF['site'].'/reader?insideFB=1';
      }
      else {
	if (!empty ($feedurl))
	  $r = 'http://'.$CONF['site'].'/rd?feedurl='.urlencode ($feedurl);
	else
	  $r = 'http://'.$CONF['site'].'/';
      }
      redirect ($r);
    }
    else
    {
      $user_details = $fb->api_client->users_getInfo ($fb_uid,
						      array ('email'));
      if ($user_details && isset ($user_details[0]['email']))
	$email = $user_details[0]['email'];
      else
	return _('E-mail address is required.');

      $db->query ("SELECT id FROM user WHERE email='".$db->escape($email)."'");
      if ($db->next_record ()) {
	return _('To link your Facebook account, please visit Menu/User Settings');
      }

      $pass = uniqid (rand(), true);
      $db->query ("INSERT INTO user SET email='".$email.
		  "', pass='".$pass."', fbUID=".$fb_uid);
      $db->query ("SELECT LAST_INSERT_ID() as last_id FROM user");
      if ($db->next_record ()) {
	$last_id = $db->f ('last_id');
	$this->id    = $last_id;
	$this->email = $email;
	$this->pass  = $pass;
	$this->lang  = 'null';
	$this->status['afterlogged'] = 'yes';
	$this->status['iflogged'] = 'yes';

	if ($insideFB)
	  redirect ('http://'.$CONF['site'].'/reader?insideFB=1');
	else
	  redirect ('http://'.$CONF['site'].'/');
      }
    }
  }

  function logout ()
  {
    global $CONF;

    $this->id     = 0;
    $this->email  = '';
    $this->pass   = '';
    $this->lang   = '';
    $this->status = array ();
    $this->status['public'] = 'yes';
    $this->status['afterlogged'] = '';
    $this->status['iflogged'] = '';

    $sessionName = session_name ();
    $sessionCookie = session_get_cookie_params ();
    session_destroy ();
    setcookie ($sessionName, '', time() - 3600, $sessionCookie['path'],
	       $sessionCookie['domain'], $sessionCookie['secure']);
    redirect ('http://'.$CONF['site'].'/');
  }

  function auth ($res, $feedurl = '')
  {
    global $_ARGS, $CONF;
    
    if ($this->email == 'guest') {
      return true;
    }
    else {
      $db = new Database ();
      $db->query ("SELECT email,pass,lang FROM user WHERE id='".$this->id."'");
      $db->next_record ();

      if (($this->status[$res] == 'yes' && $this->email == $db->f('email')
	   && $this->pass == $db->f('pass')) || $res == 'public')
      {
	$this->lang = $db->f('lang');
	return true;
      }
      else if ($this->status[$res] == 'yes' && $this->email == $db->f('email')
	       && $this->pass != $db->f('pass'))
      {
	$headers = getallheaders ();
	if (isset ($headers['Referer'])) {
	  $this->status['afterlogged'] = 'no';
	  $this->status['iflogged'] = 'no';
	  return false;
	}
	redirect ('http://'.$CONF['site'].'/logout');
      }
      else if ($res == 'iflogged')
	return false;
      else {
	$r = 'http://'.$CONF['site'].'/login';
	if (!empty ($feedurl))
	  $r .= '?feedurl=' . urlencode ($feedurl);
	redirect ($r);
      }
    }
  }

  function change_password ($old, $new, $repeat)
  {
    if ($new == $repeat && md5 ($old) == $this->pass)
    {
      $db = new Database ();
      $db->query ("UPDATE user SET pass='".md5 ($new)."' WHERE id=".$this->id);
      $this->pass = md5 ($new);
      return true;
    }
    else
      return false;
  }
}

?>
