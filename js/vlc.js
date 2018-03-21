var app //from app.js

var vlc = {
	password: "",
	serverIP: "",
	serverPort: "8080",
	timeoutForHTTPRequest: 12000,
	serverName: "VLCTest",

	makeRequest: function (request) {
		request = request || '';
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'http://' + vlc.serverIP + ':' + vlc.serverPort + '/requests/status.json?' + request, true);
			//xhr.setRequestHeader('Authorization', 'Basic ' + encode64(serverUser + ':' + serverPass));
		xhr.setRequestHeader("Authorization", "Basic " + window.btoa(":" + vlc.password));
		xhr.timeout = vlc.timeoutForHTTPRequest;
		xhr.onload = function() {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					if (xhr.responseText) {
						var res    = JSON.parse(xhr.responseText);
						var title  = res.information || '--';
						title  = title.category || '--';
						title  = title.meta || '--';
						title  = title.filename || '--';
						vlc.title = title;
						vlc.status = res.state.toLowerCase();
						vlc.volume = res.volume || 0;
						vlc.volume = (vlc.volume / 512) * 200;
						vlc.volume = (vlc.volume > 200) ? 200 : vlc.volume;
						vlc.volume = Math.round(vlc.volume);
						vlc.length = res.length || 0;
						vlc.seek   = res.time || 0;
						vlc.seek   = (vlc.seek / vlc.length) * 100;
						vlc.seek   = Math.round(vlc.seek);
						app.updateView();
					} else {
						console.log('Invalid response received! ' + JSON.stringify(xhr));
						//sendAppMessage('Error: Invalid response received!');
					}
				} else {
					console.log('Request returned error code ' + xhr.status.toString());
					//sendAppMessage('Error: ' + xhr.statusText);
				}
			}
		};
		xhr.ontimeout = function() {
			console.log('HTTP request timed out');
			//sendAppMessage('Error: Request timed out!');
		};
		xhr.onerror = function() {
			console.log('HTTP request return error');
			//sendAppMessage('Error: Failed to connect!');
		};
		xhr.send(null);
	},
	getStatus: function() {
		vlc.makeRequest();
	}
}