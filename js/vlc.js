var app; //from app.js

var vlc = {
	serverList: [],
	password: "",
	serverIP: "",
	serverPort: "8080",
	serverName: "VLCTest",
	timeoutForHTTPRequest: 12000,
	
	init: function() {
		console.log("reading serverList");
		vlc.serverList = JSON.parse(localStorage.getItem("serverList")) || [];
		console.log("serverList: "+vlc.serverList.length);
	},
	makeRequest: function (request, handlerSuccess, handlerErrorCode, handlerTimeout, handlerConnError) {
		request = request || '';
		handlerSuccess= handlerSuccess || function() {};
		
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
						handlerSuccess(xhr);
						app.updateView();
					} else {
						console.log('Invalid response received! ' + JSON.stringify(xhr));
						//sendAppMessage('Error: Invalid response received!');
					}
				} else {
					console.log('Request returned error code ' + xhr.status.toString());
					handlerErrorCode(xhr);
					//sendAppMessage('Error: ' + xhr.statusText);
				}
			}
		};
		handlerTimeout = handlerTimeout || function() {
				console.log('HTTP request timed out');
				//sendAppMessage('Error: Request timed out!');
			}; 
		handlerConnError = handlerConnError || function() {
				console.log('HTTP request return error');
				//sendAppMessage('Error: Failed to connect!');
			}; 
		xhr.ontimeout = handlerTimeout; 
		xhr.onerror = handlerConnError; 
		xhr.send(null);
	},
	connect: function(index) {
		vlc.serverIP   = vlc.serverList[index].serverIP;
		vlc.serverPort = vlc.serverList[index].serverPort;
		vlc.serverName = vlc.serverList[index].serverName;
		vlc.password   = vlc.serverList[index].password;
		
		vlc.makeRequest("", 
			function() {
				app.show("remote");
				if (vlc.watcher) {
					window.clearInterval(vlc.watcher);
					vlc.watcher=null;
				}
	    		vlc.watcher=window.setInterval(vlc.updateStatus, 1000);
			}, 
			function(xhr) {
				app.showMessage("Could not connect to server: Error code " + xhr.status.toString());
			},
			function() {
				app.showMessage("No response from server " + vlc.serverIP);
			},
			function() {
				app.showMessage("Failed to connect");
			}
		);
	},
	disconnect: function() {
		if (vlc.watcher) {
			window.clearInterval(vlc.watcher);
			vlc.watcher=null;
		}
	},
	onDisconnect: function() {
		vlc.disconnect();
		if (app.view === "remote") {
			app.back();
		}
		app.showMessage("Server disconnected");
	},
	updateStatus: function() {
		vlc.makeRequest("",
					null, //onSuccess
					vlc.onDisconnect,  //onErrorCode
					vlc.onDisconnect,  //onTimeout
					vlc.onDisconnect   //onConnError
				);
	}
};