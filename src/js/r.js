"use strict";

(function(exports, $) {
	var sessionCredentialsKey = 'authentication';
	var credentials = {
		username: '',
		password: '',
		client_id: '',
		client_secret: '',
		authorization: null,
		expires_in: 0
	};

	// Dust stuff;
	var template = null;
	var compiled = null;

	// Setup common functions on posts.
	function setupClicks() {
		$('.expand-button').click(function() {
			$(this).parent().find('.contents').toggle()
		});
	}

	// Initialize dust for posts and leave it ready to roll.
	function postsDust() {
		if (template == null) {
			template = $('#r_dust').html();
		}
		if (compiled == null) {
			compiled = dust.compile(template, 'r');
		}

		dust.loadSource(compiled);
		return(dust);
	}

	function parseText(text) {
		if (!text)
			return(text);

		var ret = text;

		ret = ret.replace(/\*\*([^\*\n]*)\*\*/g, '<b>$1</b>');
		ret = ret.replace(/\*([^\*\n]*)\*/g, '<i>$1</i>');
		ret = ret.replace(/\n\n/g, '<br />');

		return(ret);
	}

	function renderPosts(posts) {
		postsDust();
		tiptoe(
			function first() {
				var rank;
				for (rank = 0; rank < posts.length; rank++) {
					var entry = posts[rank];
					if (entry.data.thumbnail && entry.data.thumbnail == 'self')
						delete(entry.data.thumbnail);
					if (entry.data.selftext) {
						entry.data.formattedText = parseText(entry.data.selftext);
						console.log(entry.data.formattedText);
					}
					if (entry.data.likes !== undefined) {
						if (entry.data.likes === true)
							entry.data.thingCss = 'upvoted';
						else if (entry.data.likes === false)
							entry.data.thingCss = 'downvoted';
					}
					entry.data.rank = rank + 1;
					dust.render('r', entry.data, this.parallel());
				}
			},
			function populate() {
				var contents = Array.prototype.slice.call(arguments).join('');
				this(null, contents);
			},
			function finish(err, contents) {
				if (err)
					throw(err);

				$('#content').html(contents);
				setupClicks();
			}
		);
	}

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

	// This function needs a better name.
	// Return remaining seconds that our current credentials are valid.
	function getTTL() {
		if (credentials.expires_in <= 0)
			return(0);

		var ttl = (credentials.expires_in - ((new Date()).getTime() - credentials.lastFetch.getTime()) / 3600).toFixed(0);
		if (ttl <= 0) {
			credentials.expires_in = 0; // Expired.
			ttl = 0;
		}

		return(ttl);
	}

	function loadPosts(subreddit, method) {
		redditapi.posts(function(answer) {
			// Save cache
			sessionStorage.setItem('cache', JSON.stringify(answer));
			renderPosts(answer.data.children);
		}, subreddit, method);
	}

	function init() {
		var cacheRaw = sessionStorage.getItem('cache');
		if (cacheRaw == null)
			return;

		var cache = JSON.parse(cacheRaw);
		renderPosts(cache.data.children);
	}

	exports.loadCredentials = loadCredentials;
	exports.saveCredentials = saveCredentials;
	exports.reloadCredentials = reloadCredentials;
	exports.getTTL = getTTL;
	exports.loadPosts = loadPosts;

	if (window) {
		$(window).ready(init);
	}
})((window.r = window.r || {}), jQuery || $);

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
	});

	$('#btn-home').on('click', function() {
		r.loadPosts();
	});

	// This is experimental
	function DisplayTTL() {
		var ttl = r.getTTL();
		$('#ttl').html(ttl + ' sec');

		if (ttl > 0) {
			setTimeout(DisplayTTL, 998);
		}
	}
	r.loadCredentials();
	window.DisplayTTL = DisplayTTL;
	DisplayTTL();
});