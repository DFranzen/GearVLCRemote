var app; //from app.js
var vlc; //from vlc.js

var serverView = {
		id: -1,
		init: function() {
			document.getElementById("btnGo").addEventListener("click", serverView.btnGo_onclick);
		},
		showNew: function() {
			serverView.id = vlc.serverList.length; //create new element
			document.getElementById("inputIP").value = app.myip || "";
			document.getElementById("inputName").value = "New Server";
			document.getElementById("inputPassword").value = "";
			document.getElementById("inputPort").value = "8080";
			app.show("server");
		},
		showId: function(id) {
			serverView.id = id;
			document.getElementById("inputIP").value = vlc.serverList[id].ip;
			document.getElementById("inputName").value = vlc.serverList[id].name;
			document.getElementById("inputPassword").value = vlc.serverList[id].password;
			document.getElementById("inputPort").value = vlc.serverList[id].port;
			app.show("server");
		},
		btnGo_onclick: function(e) {
			var server = {};
			console.log("Click on Button BtnGo: "+e);
			server.ip       = document.getElementById("inputIP").value;
			server.password = document.getElementById("inputPassword").value;
			server.port     = document.getElementById("inputPort").value;
			server.name     = document.getElementById("inputName").value;
			server.id       = serverView.id;
			
			
			app.showSpinner("Waiting for " + server.name + " on " + server.ip + ":" + server.port);
			vlc.connect(server);
		}
};