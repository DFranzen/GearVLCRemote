function HTML_getdef(element) {
	var htmlText = element.outerHTML;
	var start  = htmlText.search(/</);
	var end  = htmlText.search(/>/);
	return htmlText.substr(start, end + 1);
}

function secToStr(sec) {
	var hh, mm, ss,
	    hhString, mmString, ssString;
	hh = Math.floor( sec / (60*60) );
	sec -= hh*60*60;
	mm = Math.floor( sec / 60 );
	ss = sec - mm * 60;
	hhString = (hh === 0) ? "" : ( (hh < 10) ? "0" + hh + ":" : hh + ":");
	mmString = (mm < 10) ? "0" + mm :  "" + mm;
	ssString = (ss < 10) ? "0" + ss :  "" + ss;
	
	return hhString + mmString + ":" + ssString;
}

function colorSetter(element,color) {
	var that = element;
	return function() {
		that.children[1].style.color=color;
	};
}

// Use each function once to avoid warnings due to modularity
if (false) { 
	colorSetter(null, null);
	secToStr(10);
	HTML_getdef(null);
}