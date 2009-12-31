/*
   Cheetah News JS/v1 Invite
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

Modules.Invite = new function () {

  var win = null;

  this.init = function () {
    return true;
  };

  this.js_setup = function () {
    var inf = GID ('inf');
    if (!inf) return;
    if (cheetahData.invitation < 1) {
      inf.style.visibility = 'hidden';
      return;
    }
    if (win == null) {
      win = js_createWindow ('i', null, _('Invite a friend'), true);
      js_prepareWindowClose (GID ('iWindowClose'), js_closeWindow);
      js_setInvitationString ();
      GID ('iWindowT2').innerHTML = _('First Name:');
      GID ('iWindowT3').innerHTML = _('Last Name:');
      GID ('iWindowT4').innerHTML = _('E-mail:');
      GID ('iWindowT5').innerHTML = _('Optional note:');
      GID ('iWindowT6').innerHTML = _('Invitation language:');
      var iWindowSend = GID ('iWindowSend');
      iWindowSend.value = _('Send invitation');
      iWindowSend.onclick = js_sendInvitation;
      var inf = GID ('inf');
      inf.title = inf.alt = _('Invite a friend');
      inf.onclick = js_openWindow;
      js_prepareInput (GID ('inviteEM'));
      js_prepareInput (GID ('inviteFN'));
      js_prepareInput (GID ('inviteLN'));
      js_prepareInput (GID ('inviteDE'));
      inf.style.visibility = 'visible';
    }
  }

  function js_setInvitationString () {
    GID ('iWindowT1').innerHTML =
      js_sprintf (ngettext ('You have %d invitation left, send invitation to:',
			    'You have %d invitations left, send invitation to:',
			    cheetahData.invitation), cheetahData.invitation);
  }

  function js_sendInvitation () {
    if (!js_checkOnline ()) return false;
    GID ('iWindowSend').disabled = true;
    win.style.cursor = 'wait';
    var snd = 'to=' + encodeURIComponent (GID ('inviteEM').value);
    snd += '&firstname=' + encodeURIComponent (GID ('inviteFN').value);
    snd += '&lastname=' + encodeURIComponent (GID ('inviteLN').value);
    snd += '&msg=' + encodeURIComponent (GID ('inviteDE').value);
    snd += '&lang=' + encodeURIComponent (GID ('inviteLA').value);
    var xhs = js_sendX ('invite', snd, 1, js_invitationSent, js_invitationRecover);
    sendIntv = setTimeout (function () {
	if (xhs && xhs.readyState != 0) xhs.abort ();
	win.style.cursor = 'auto';
	alert (_('Timeout Error!'));
	GID ('iWindowSend').disabled = false;
	sendIntv = null; }, 15000);
    return false;
  }

  function js_invitationSent (xml) {
    var sts = js_xmlStatus (xml);
    if (sts) {
      js_error (sts);
    }
    else {
      GID ('inviteEM').value = '';
      GID ('inviteFN').value = '';
      GID ('inviteLN').value = '';
      GID ('inviteDE').value = '';
      GID ('inviteLA').selectedIndex = 0;
      cheetahData.invitation--;
      js_setInvitationString ();
    }
    win.style.cursor = 'auto';
    GID ('iWindowSend').disabled = false;
    if (cheetahData.invitation < 1) {
      js_closeIWindow ();
      inf.style.visibility = 'hidden';
    }
  }

  function js_invitationRecover () {
    js_stderr ('sendInvitation Error: ' + status +': '+ statusText);
    win.style.cursor = 'auto';
    GID ('iWindowSend').disabled = false;
  }

  function js_openWindow () {
    if (msie) js_clearSelection ();
    document.onkeypress = null;
    js_popUp (win);
    js_setupDrag (win);
    js_registerWindow (win);
    GID ('inviteFN').focus ();
    return false;
  }

  function js_closeWindow () {
    GID ('inviteFN').blur ();
    win.style.display = 'none';
    js_initAllKShortcuts ();
  }
}
