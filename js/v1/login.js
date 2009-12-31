/*
   Cheetah News JS/v1 Login
   Copyright (C) 2005, 2006, 2007 Wojciech Polak.

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

var nua = navigator.userAgent.toLowerCase ();
if (!(top == self)) top.location.href = './';

var lastMode = 'signIn';
window.onload = init;

function GID (x) {
  return document.getElementById (x);
}

function init () {
  GID ('learnMore').onclick = about;
  GID ('useOpenID').onclick = useOpenID;
  GID ('useCommon').onclick = useCommon;
  GID ('forgotPassword').onclick = passwordRecovery;
  GID ('prSignIn').onclick = signIn;
  GID ('aboutSignIn').onclick = signIn;
  GID ('registrationSignIn').onclick = signIn;
  GID ('signUp').onclick = registration;
  GID ('guestLogin').onclick = function () {
    document.location = 'login?cEmail=guest&cPassword=guest&SignIn=true';
  };
  GID ('cEmail').onchange = function () {
    var persistentCookie = GID ('PersistentCookie');
    if (this.value == 'guest') {
      persistentCookie.checked  = false;
      persistentCookie.disabled = true;
    }
    else
      persistentCookie.disabled = false;
  };
  GID ('l1').onclick = function () { return nw (this, 'Privacy Policy'); };
  GID ('l2').onclick = function () { return nw (this, 'Terms of Service'); };
  GID ('l3').onclick = function () { return nw (this); };
  GID ('whatIsOpenID').onclick = function () { return nw (this, 'OpenID'); };
  getHash (true);
  setInterval (function () { getHash (false); }, 200);
}

function useOpenID () {
  GID ('trCEmail').className = 'hidden';
  GID ('trCPassword').className = 'hidden';
  GID ('trOpenID').className = '';
  GID ('useOpenID').style.display = 'none';
  GID ('useCommon').style.display = 'inline';
  GID ('trForgotPassword').className = 'hidden';
  GID ('trWhatIsOpenID').className = '';
  GID ('openID').focus ();
  writeCookie ('cheetahLogin', 'openID', 365);
}

function useCommon () {
  GID ('trCEmail').className = '';
  GID ('trCPassword').className = '';
  GID ('trOpenID').className = 'hidden';
  GID ('useOpenID').style.display = 'inline';
  GID ('useCommon').style.display = 'none';
  GID ('trWhatIsOpenID').className = 'hidden';
  GID ('trForgotPassword').className = '';
  GID ('cEmail').focus ();
  writeCookie ('cheetahLogin', 'common', 365);
}

function registration () {
  GID ('signIn').style.display = 'none';
  GID ('about').style.display = 'none';
  GID ('registration').style.display = 'block';
  GID ('reSubmit').onclick = function () {
    if (GID ('reCEmail').value == '')
      return false;
  };
  setHash ('registration');
  GID ('reCEmail').focus ();
}

function passwordRecovery () {
  GID ('signIn').style.display = 'none';
  GID ('passwordRecovery').style.display = 'block';
  GID ('f2').autocomplete = 'off';
  GID ('prSubmit').onclick = function () {
    if (GID ('prCEmail').value == '')
      return false;
  };
  setHash ('passwordRecovery');
  GID ('prCEmail').focus ();
}

function about () {
  GID ('signIn').style.display = 'none';
  GID ('about').style.display = 'block';
  GID ('about').scrollTop = 0;
  setHash ('about');
}

function signIn () {
  GID ('passwordRecovery').style.display = 'none';
  GID ('registration').style.display = 'none';
  GID ('about').style.display = 'none';
  GID ('signIn').style.display = 'block';
  setHash ('signIn');
  var t = readCookie ('cheetahLogin');
  if (t == 'openID')
    useOpenID ();
  else
    useCommon ();
}

function setHash (h) {
  document.location.hash = h;
}

function getHash (ini) {
  var mode = document.location.hash.length > 0 ?
             document.location.hash.substr (1) : 'signIn';
  if (ini) {
    mode = GID ('mode').innerHTML;
    if (mode == 'signIn') {
      GID ('signIn').style.display = 'block';
      var t = readCookie ('cheetahLogin');
      if (t == 'openID')
	useOpenID ();
      else
	useCommon ();
    }
  }
  if (lastMode != mode) {
    lastMode = mode;
    if (!ini) {
      var msg = GID ('message');
      if (msg) msg.style.display = 'none';
    }
    if (mode == 'about')
      about ();
    else if (mode == 'passwordRecovery')
      passwordRecovery ();
    else if (mode == 'registration')
      registration ();
    else
      signIn ();
  }
}

function nw (el, target) {
  if (el.href) {
    window.open (el.href, target ? target : el.href);
    el.blur ();
  }
  return false;
}

function writeCookie (name, value, days) {
  var expires = '';
  if (days) {
    var date = new Date ();
    date.setTime (date.getTime () + (days * 86400000));
    var expires = '; expires=' + date.toGMTString ();
  }
  document.cookie = name +'='+ value + expires + '; path=/';
}

function readCookie (name) {
  var nameEq = name + '=';
  var ca = document.cookie.split (';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt (0) == ' ')
      c = c.substring (1, c.length);
    if (c.indexOf (nameEq) == 0)
      return c.substring (nameEq.length, c.length);
  }
  return null;
}
