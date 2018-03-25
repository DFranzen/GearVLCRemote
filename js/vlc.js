var app; //from app.js

var vlc = {
	serverList: [],
	password: "",
	serverIP: "",
	serverPort: "8080",
	serverName: "VLCTest",
	timeoutForHTTPRequest: 4000,
	
	init: function() {
		console.log("reading serverList");
		vlc.serverList = JSON.parse(localStorage.getItem("serverList")) || [];
		console.log("serverList: "+vlc.serverList.length);
	},
	incVol: function() {
		if (vlc.volume >= 499 ) {
			vlc.makeRequest('command=volume&val=512',
					null, //onSuccess
					vlc.onDisconnect,  //onErrorCode
					vlc.onDisconnect,  //onTimeout
					vlc.onDisconnect   //onConnError
			);
		}
		vlc.makeRequest('command=volume&val=%2B13',
				null, //onSuccess
				vlc.onDisconnect,  //onErrorCode
				vlc.onDisconnect,  //onTimeout
				vlc.onDisconnect   //onConnError
		);
	},
	decVol: function() {
		if (vlc.volume <= 5) {
			vlc.makeRequest('command=volume&val=0',
					null, //onSuccess
					vlc.onDisconnect,  //onErrorCode
					vlc.onDisconnect,  //onTimeout
					vlc.onDisconnect   //onConnError
			);
		}
		vlc.makeRequest('command=volume&val=-13',
				null, //onSuccess
				vlc.onDisconnect,  //onErrorCode
				vlc.onDisconnect,  //onTimeout
				vlc.onDisconnect   //onConnError
		);
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
						var title  = res.information || {};
						title  = title.category || {};
						title  = title.meta || {};
						title  = title.filename || '--';
						vlc.title    = title;
						vlc.status   = res.state.toLowerCase();
						vlc.volume   = res.volume || 0;
						vlc.length   = res.length || 0;
						vlc.seek     = res.time || 0;
						vlc.progress = Math.round(vlc.seek *100 / vlc.length);
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
		return xhr;
	},
	connect: function(index, newServer) {
		var xhr;
		newServer = newServer || false;
		if (vlc.connecting) {return; }
		vlc.connecting = true;
		vlc.serverIP   = vlc.serverList[index].serverIP;
		vlc.serverPort = vlc.serverList[index].serverPort;
		vlc.serverName = vlc.serverList[index].serverName;
		vlc.password   = vlc.serverList[index].password;
		
		xhr = vlc.makeRequest("", 
			function() {
				if (app.viewStack[app.viewStack.length-1] === "spinner") { 
					//close viewSpinner
					app.onback = function() {};
					app.back(); 
				}
				if (newServer) {
					//close viewServer
					app.back();
					newServer = false;
				}
				app.show("remote");
				if (vlc.watcher) {
					window.clearInterval(vlc.watcher);
					vlc.watcher=null;
				}
	    		vlc.watcher=window.setInterval(vlc.updateStatus, 1000);
	    		vlc.connecting = false;
			}, 
			function(xhr) {
				if (app.viewStack[app.viewStack.length-1] === "spinner") {
					app.onback = function() {};
					app.back();
				}
				app.showMessage("Could not connect to server: Error code " + xhr.status.toString());
				if (newServer) {
					//delete candidate from serverList
					vlc.serverList.splice(-1,1);
					newServer = false;
				}
				vlc.connecting = false;
			},
			function() {
				if (app.viewStack[app.viewStack.length-1] === "spinner") {
					app.onback = function() {};
					app.back();
				}
				app.showMessage("No response from server " + vlc.serverIP);
				if (newServer) {
					vlc.serverList.splice(-1,1);
					newServer = false;
				}
				vlc.connecting = false;
			},
			function() {
				if (app.viewStack[app.viewStack.length-1] === "spinner") {
					app.onback = function() {};
					app.back();
				}
				app.showMessage("Failed to connect");
				if (newServer) {
					vlc.serverList.splice(-1,1);
					newServer = false;
				}
				vlc.connecting = false;			
			}
		);
		app.abort = function() {
			console.log("aborting");
			xhr.abort();
			if (newServer) {
				vlc.serverList.splice(-1,1);
				newServer = false;
			}
			app.onback = function() {};
			vlc.connecting = false;
		};
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
	testServer: function(ip,port,handlerSuccess,handlerError) {
		handlerSuccess= handlerSuccess || function() {};
		handlerError  = handlerError   || function() {};
		
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'http://' + ip + ':' + port + '/requests/status.json', true);
		xhr.timeout = 12000;
		var handler = function() {
			var success = false;
			if ( (xhr.status < 300) && (xhr.status >= 200) ) {
				success = true;
			}
			if ( xhr.status === 401 ) {
				console.log("401 received");
				success = true;
			}
			console.log("Status "+xhr.status);
			if (success) {
				console.log("executing Success");
				handlerSuccess();
			} else {
				console.log("executing Error");
				handlerError();
			}
		};
		xhr.onerror = xhr.onload = handler;
		xhr.ontimeout = handlerError;
		xhr.send();
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