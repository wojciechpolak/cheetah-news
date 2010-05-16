/*
   Cheetah News JS/v2 Login
   Copyright (C) 2005, 2006, 2007, 2008, 2010 Wojciech Polak.

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

(function () {
  if (!(top == self)) top.location.href = './';

  var lastMode = 'signIn';
  var authMech = null;
  var cookieLogin = 'cheetahLogin';

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

    $('#providers a').click (selectAuthMech);

    GID ('guestLogin').onclick = function () {
      window.location = 'login?cEmail=guest&cPassword=guest&SignIn=true';
    };
    GID ('f1').onsubmit = function () {
      if (authMech == 'common') {
	if (GID ('cEmail').value == '')
	  return false;
	GID ('openid_identifier').disabled = true;
	return true;
      }
      else if (authMech) {
	if (authMech == 'auth-facebook') {
	  FB.login (function (res) {
	      if (res.session && res.perms &&
		  res.perms.indexOf ('email') != -1)
		fb_login ();
	    }, {perms: 'email'});
	  return false;
	}
	else if (authMech == 'auth-openid') {
	  if (GID ('openid_identifier').value == '')
	    return false;
	}
	else if (authMech == 'auth-google')
	  GID ('openid_identifier').value = 'https://www.google.com/accounts/o8/id';
	else if (authMech == 'auth-yahoo')
	  GID ('openid_identifier').value = 'http://www.yahoo.com/';

	if (window.location.protocol == 'http:')
	  this.action = this.action.replace (/https:/, 'http:');

	GID ('cEmail').disabled = true;
	GID ('cPassword').disabled = true;
	return true;
      }
      return false;
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
    GID ('l0').onclick = function () { return nw (this, 'Cheetah_News_Blog'); };
    GID ('l1').onclick = function () { return nw (this, 'Privacy_Policy'); };
    GID ('l2').onclick = function () { return nw (this, 'Terms_of_Service'); };
    GID ('l3').onclick = function () { return nw (this); };
    getHash (true);
    setInterval (function () { getHash (false); }, 200);
  }

  function useOpenID () {
    GID ('trCEmail').className = 'hidden';
    GID ('trCPassword').className = 'hidden';
    GID ('trExtAuth').className = '';
    GID ('useOpenID').style.display = 'none';
    GID ('useCommon').style.display = 'inline';
    GID ('trForgotPassword').className = 'hidden';
    GID ('l0wrap').className = 'hidden';

    var c = readCookie (cookieLogin);
    if (c) {
      var m = GID (c);
      if (m) selectAuthMech.call (m);
      if (c == 'common')
	writeCookie (cookieLogin, 'OpenID', 365);
    }

    var m = $('#providers a[class=selected]');
    if (m.length) {
      authMech = m[0].id;
      if (authMech == 'auth-openid') {
	$('#trOpenID').removeClass ('hidden');
	$('#openid_identifier').val ('').focus ();
      }
    }
  }

  function useCommon () {
    GID ('trCEmail').className = '';
    GID ('trCPassword').className = '';
    GID ('trExtAuth').className = 'hidden';
    GID ('trOpenID').className = 'hidden';
    GID ('useOpenID').style.display = 'inline';
    GID ('useCommon').style.display = 'none';
    GID ('trForgotPassword').className = '';
    GID ('l0wrap').className = '';
    GID ('cEmail').focus ();
    authMech = 'common';
    writeCookie (cookieLogin, authMech, 365);
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
    var t = readCookie (cookieLogin);
    if (t == 'common')
      useCommon ();
    else
      useOpenID ();
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
	var t = readCookie (cookieLogin);
	if (t == 'common')
	  useCommon ();
	else
	  useOpenID ();
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

  function selectAuthMech () {
    var t = $(this);
    t.blur ();
    t.siblings ().removeClass ('selected');
    t.addClass ('selected');

    authMech = t.attr ('id');
    writeCookie (cookieLogin, authMech, 365);

    if (authMech == 'auth-openid') {
      $('#trOpenID').removeClass ('hidden');
      $('#openid_identifier').val ('').focus ();
    }
    else
      $('#trOpenID').addClass ('hidden');
    return false;
  }

  function fb_login () {
    var pc = GID ('PersistentCookie');
    var r = 'login?fbConnect=1';
    if (pc && pc.checked) r += '&PersistentCookie=yes';
    writeCookie ('cheetahFBL', 1);
    window.location.replace (r);
  }

  $(document).ready (init);
})();
