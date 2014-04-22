<?php

/*
   Cheetah News lib/session.class.php
   Copyright (C) 2005, 2006, 2007, 2008, 2010, 2014 Wojciech Polak.

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

function start_session ($persistentCookie, $noCache=true, $age=30)
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

  function login ($email, $raw_password)
  {
    global $CONF;

    session_regenerate_id ();

    $db = new Database ();

    if ($CONF['guestAccount'] && $email == 'guest' && $raw_password == 'guest')
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
		  "WHERE email='".$db->escape ($email).
		  "' AND active != 'no' AND failogCount < 10");

      if ($db->next_record ())
      {
	$this->id   = $db->f ('id');
	$this->pass = $db->f ('pass');

	if ($this->check_password ($raw_password))
	{
	  $this->email = $db->f ('email');
	  $this->lang  = $db->f ('lang');
	  $this->status['afterlogged'] = 'yes';
	  $this->status['iflogged'] = 'yes';

	  $db->query ("UPDATE user SET lastLog='".gmdate ('Y-m-d H:i:s')."', ".
		      "active='yes', failogCount=0 WHERE id='".$this->id."'");

	  if (isset ($_SERVER['HTTPS']))
	    redirect ($CONF['secureProto'].'://'.$CONF['site'].'/rd');
	  else
	    redirect ('http://'.$CONF['site'].'/');
	}
	else { /* failog, protection against dictionary attack */
	  $db->query ("UPDATE user SET failogCount=failogCount+1 WHERE ".
		      "email='".$db->escape ($email).
		      "' AND active != 'no' AND failogCount < 10");
	}
      }
    }
  }

  function openid1 ($openid_identifier)
  {
    global $CONF;

    session_regenerate_id ();

    $process_url = 'http://'.$CONF['site'].'/login';
    $trust_root = 'http://'.$CONF['site'].'/';

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

  function openid2 ($identity, $email)
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

	if (isset ($_SERVER['HTTPS']))
	  redirect ($CONF['secureProto'].'://'.$CONF['site'].'/rd');
	else
	  redirect ('http://'.$CONF['site'].'/');
      }
      else
	return "OpenID account match error";
    }
    else if (ereg ("^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)+$", $email))
    {
      $db->query ("SELECT id FROM user WHERE email='".$db->escape ($email)."'");
      if ($db->next_record ()) {
	return _("To enable OpenID support, please visit Menu/User Settings/Linked Accounts.");
      }

      $res = rpNewSendEmail ($email, '', $identity);
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
    else {
      /*
       *  New account via OpenID.
       */
      $db->query ("SELECT id, hash FROM registration WHERE openid_identity='".
		  $db->escape ($identity)."'");
      if (!$db->next_record ()) {
	$hash = sha1 (time().$identity.rand());
	$pass = '';
	$db->query ("INSERT INTO registration SET rdate=UTC_TIMESTAMP(), ".
		    "hash='".$hash."', pass='".$pass."', openid_identity='".
		    $db->escape ($identity)."'");
      }
      else {
	$hash = $db->f ('hash');
      }
      if (isset ($_SERVER['HTTPS']))
	redirect ($CONF['secureProto'].'://'.$CONF['site'].
		  '/signup?hash='.$hash);
      else
	redirect ('http://'.$CONF['site'].'/signup?hash='.$hash);
    }
  }

  function fb_login (&$fb, $fb_uid, $insideFB=false)
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

      if ($insideFB)
	$r = 'http://'.$CONF['site'].'/reader?insideFB=1';
      else
	$r = 'http://'.$CONF['site'].'/';
      redirect ($r);
    }
    else
    {
      $me = $fb->api ('/me');
      if ($me && isset ($me['email']))
	$email = $me['email'];
      else
	return _('E-mail address is required.');

      $db->query ("SELECT id FROM user WHERE email='".$db->escape($email)."'");
      if ($db->next_record ()) {
	return _('To link your Facebook account, please visit Menu/User Settings');
      }

      $pass = '';
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

  function auth ($res)
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
      else
	redirect ('http://'.$CONF['site'].'/login');
    }
  }

  function check_password ($raw_password)
  {
    if (!$raw_password || $this->pass === '!')
      return false;

    if (strlen ($this->pass) == 32 && $this->pass == md5 ($raw_password)) {
      /* good pass, old format */
      $this->set_password ($raw_password); /* regenerate */
      return true;
    }
    else {
      list ($algo, $iterations, $salt, $hash) = explode (':', $this->pass, 4);
      $encoded_2 = encode_password ($raw_password, $algo, $salt,
				    intval ($iterations));
      return $this->pass === $encoded_2;
    }
    return false;
  }

  function set_password ($raw_password)
  {
    $this->pass = make_password ($raw_password);
    $db = new Database ();
    $db->query ("UPDATE user SET pass='".$this->pass."' WHERE id=".$this->id);
  }

  function change_password ($raw_password_old, $raw_password_new, $repeat)
  {
    if ($raw_password_new == $repeat &&
	$this->check_password ($raw_password_old))
    {
      $this->set_password ($raw_password_new);
      return true;
    }
    return false;
  }
}

function make_password ($raw_password, $salt=null)
{
  if (!$raw_password)
    return '!';

  if (!$salt)
    $salt = substr (str_shuffle ('abcdefghijklmnopqrstuvwxyz'.
				 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.
				 '0123456789'), 0, 12); /* 12 random chars */

  return encode_password ($raw_password, 'pbkdf2_sha256', $salt);
}

function encode_password ($raw_password, $algo, $salt, $iterations=20000)
{
  if ($algo == 'pbkdf2_sha256')
    $hash = cth_pbkdf2 ('sha256', $raw_password, $salt, $iterations, 32, true);
  else
    return '!';

  $hash = trim (base64_encode ($hash));
  return sprintf ('%s:%d:%s:%s', $algo, $iterations, $salt, $hash);
}

function cth_pbkdf2 ($algo, $password, $salt, $iterations, $length=0,
		     $raw_output=false)
{
  if (!in_array (strtolower ($algo), hash_algos ())) {
    trigger_error (sprintf ('cth_pbkdf2(): Unknown hashing algorithm: %s',
			    $algo), E_USER_WARNING);
    return false;
  }

  $derived_key = '';
  $loops = 1;

  if ($length > 0)
    $loops = (int)ceil ($length / strlen (hash ($algo, '', $raw_output)));

  for ($i = 1; $i <= $loops; $i++)
  {
    $digest = hash_hmac ($algo, $salt . pack ('N', $i), $password, true);
    $block = $digest;
    for ($j = 1; $j < $iterations; $j++)
    {
      $digest = hash_hmac ($algo, $digest, $password, true);
      $block ^= $digest;
    }
    $derived_key .= $block;
  }

  if (!$raw_output)
    $derived_key = bin2hex ($derived_key);

  if ($length > 0)
    return substr ($derived_key, 0, $length);

  return $derived_key;
}

?>
