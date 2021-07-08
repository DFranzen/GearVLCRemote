var app; //from app.js
var vlc; //from vlc.js

var serverView = {
		id: -1,
		init: function() {
			document.getElementById("btnGo").addEventListener("click", serverView.btnGo_onclick);
		},
		onKeyboardShow: function() {
			const inputIDs = ['inputName', 'inputIP', 'inputPassword', 'inputPort'];
			inputIDs.forEach(function(id) { serverView.textbox_contract(id);});
			document.getElementById("btnGo").style.display = "none";
		},
		onKeyboardHide: function() {
			const inputIDs = ['inputName', 'inputIP', 'inputPassword', 'inputPort'];
			inputIDs.forEach(function(id) { serverView.textbox_expand(id);});
			document.getElementById("btnGo").style.display = "block";
		},
		showNew: function(ip) {
			ip = ip || app.myip || "";
			console.log("Creating new server with ip" + ip);
			serverView.id = vlc.serverList.length; //create new element
			document.getElementById("inputIP").value = ip;
			document.getElementById("inputName").value = "New Server";
			document.getElementById("inputPassword").value = "";
			document.getElementById("inputPort").value = "8080";
			app.show("server");
		},
		showId: function(id) {
			console.log("Showing server " + id);
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
		},
		textbox_contract: function(id) {
			document.getElementById(id).style.marginRight = "22%";
			document.getElementById(id).style.width  = "56%";
			document.getElementById(id).style.marginLeft  = "22%";
		},
		textbox_expand: function(id) {
				document.getElementById(id).style.marginRight = "10%";
				document.getElementById(id).style.width  = "80%";
				document.getElementById(id).style.marginLeft  = "10%";
		}
};