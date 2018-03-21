(function () {
	window.addEventListener("tizenhwkey", function (ev) {
		var activePopup = null,
			page = null,
			pageid = "";

		/*if (ev.keyName === "back") {
			activePopup = document.querySelector(".ui-popup-active");
			page = document.getElementsByClassName("ui-page-active")[0];
			pageid = page ? page.id : "";

			if (pageid === "main" && !activePopup) {
				try {
					//tizen.application.getCurrentApplication().exit();
				} catch (ignore) {
				}
			} else {
				window.history.back();
			}
		}*/
	});
}());

var setPosition; //From circularToolBar.js
var vlc; //From vlc.js

var app = {
	back: function () {},
		
    updateView: function () {
    	document.getElementById("serverName").innerHTML = vlc.serverName;
    	document.getElementById("serverIP").innerHTML = vlc.serverIP;
    	document.getElementById("whatson").innerHTML = vlc.title;
    	if (vlc.status === "playing") {
    		document.getElementById("play").style.display = "none";
    		document.getElementById("pause").style.display = "block";
    	} else {
    		document.getElementById("pause").style.display = "none";
    		document.getElementById("play").style.display = "block";
    	}
    },
    init: function () {
    	
    	//Load 
    	var lastIP = localStorage.getItem("lastIP");
    	var lastPassword = localStorage.getItem("lastPassword");
    	if (lastIP !== null) {
    		document.getElementById("inputIP").value=lastIP;
    	}
    	if (lastPassword !== null) {
    		document.getElementById("inputPassword").value = lastPassword;
    	}
    	window.addEventListener("tizenhwkey", function (ev) {
    		if (ev.keyName === "back") {
    			app.back(ev);
    		}
    	});
    	//Init remote View
    	setPosition("btn1", 0);
    	setPosition("btn2", 1);
    	setPosition("btn3", -1);
    	document.getElementById("btn3").addEventListener("click", function(){vlc.makeRequest("command=seek&val=-10S");});
    	document.getElementById("btn2").addEventListener("click", function(){vlc.makeRequest("command=seek&val=%2B10S");});
    	document.getElementById("btn1").addEventListener("click", function(){vlc.makeRequest("command=pl_pause");});
    	
    	//Init Server view 
    	setPosition("btnGo", 0);
    	document.getElementById("btnGo").addEventListener("click", function(){ app.show("remote"); });
		
    	app.show("server");
    },
    show: function(view) {
    	var divs,i;
    	if (view==="remote") {
    		app.view=view;
    		divs=document.getElementsByClassName("viewRemote");
    		for (i=0;i<divs.length;i++) {
    			divs[i].style.display="block";
    		}
    		divs=document.getElementsByClassName("viewServer");
    		for (i=0;i<divs.length;i++) {
    			divs[i].style.display="none";
    		}
    		vlc.serverIP=document.getElementById("inputIP").value;
    		vlc.password=document.getElementById("inputPassword").value;
    		
    		localStorage.setItem("lastIP", vlc.serverIP);
    		localStorage.setItem("lastPassword", vlc.password);
    		
    		vlc.getStatus();
        	app.back=function(ev) {app.show("server"); ev.stopPropagation();};
    	} else if (view==="server") {
    		divs=document.getElementsByClassName("viewRemote");
    		for (i=0;i<divs.length;i++) {
    			divs[i].style.display="none";
    		}
    		divs=document.getElementsByClassName("viewServer");
    		for (i=0;i<divs.length;i++) {
    			divs[i].style.display="block";
    		}
    		app.view=view;
    		app.back = function() {};
    	}
    }
};

window.addEventListener("load", app.init);