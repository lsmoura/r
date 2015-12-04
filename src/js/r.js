"use strict";

(function(exports) {
	var sessionCredentialsKey = 'authentication';
	var credentials = {
		username: '',
		password: '',
		client_id: '',
		client_secret: '',
		authorization: null,
		expires_in: 0
	};

	function loadCredentials() {
		if (sessionStorage.getItem(sessionCredentialsKey) != null) {
			credentials = JSON.parse(sessionStorage.getItem(sessionCredentialsKey));
			if (credentials.lastFetch && typeof(credentials.lastFetch) === 'string')
				credentials.lastFetch = new Date(credentials.lastFetch);
		}
		redditapi.auth(credentials);
		return(credentials);
	}

	function saveCredentials(data) {
		Object.keys(data).forEach(function(k) {
			credentials[k] = data[k];
		});

		sessionStorage.setItem(sessionCredentialsKey, JSON.stringify(credentials));
	}

	function reloadCredentials() {
		var parameters = {
			url: 'https://www.reddit.com/api/v1/access_token',
			method: 'POST',
			username: credentials.client_id,
			password: credentials.client_secret,
			data: {
				grant_type: 'password',
				username: credentials.username,
				password: credentials.password
			}
		};

		redditapi.apiCall(parameters, function(data) {
			credentials.authorization = data['access_token'];
			credentials.lastFetch = new Date();
			credentials.expires_in = data['expires_in'];
			saveCredentials(credentials);
			redditapi.auth(credentials);
		});
	};	

	exports.loadCredentials = loadCredentials;
	exports.saveCredentials = saveCredentials;
	exports.reloadCredentials = reloadCredentials;
})(window.r = window.r || {});

$(window).ready(function() {
	$('#settings').on('show.bs.modal', function() {
		var credentials = r.loadCredentials();
		$('#settings-clientid').val(credentials.client_id);
		$('#settings-clientsecret').val(credentials.client_secret);
		$('#settings-username').val(credentials.username);
		$('#settings-password').val(credentials.password);
	});

	$('#settings-save').on('click', function() {
		$('#settings').modal('hide');

		var newCredentials = {
			username: $('#settings-username').val(),
			password: $('#settings-password').val(),
			client_id: $('#settings-clientid').val(),
			client_secret: $('#settings-clientsecret').val()
		};

		r.saveCredentials(newCredentials);
	})
});