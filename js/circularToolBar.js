var toolbar = {
	count: 0,
    setPosition: function(id,pos) {
    	var angle = 2*Math.PI/11;
    	var leftoffset = Math.sin(pos*angle);
    	var leftpos = 40+leftoffset*40;
    	var elem=document.getElementById(id);
    	elem.style.left=leftpos+"%";
	
    	var topoffset = Math.cos(pos*angle);
    	var toppos = 40+topoffset*40;
    	elem.style.top=toppos+"%";
    	toolbar.count++;
    }
};