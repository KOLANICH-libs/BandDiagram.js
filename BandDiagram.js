"use strict";
/*
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
*/
function Material(levels={},name=""){
	this._levels=levels;
	this.name=name;
	this._levels.vacuum=this._levels.vacuum||0;
	this.alignment=this._levels.vacuum;
	return new Proxy(this,this.proxyHandler);
};
Material.prototype.proxyHandler={
	get(target, name, receiver){
		if(name in target)
			return target[name]
		else return (name in target._levels)?target._levels[name]-target.alignment:undefined;
	},
	set(target, name, val, receiver){
		if(name in target)
			target[name]=val;
		else
			target._levels[name]=val+target.alignment;
		return true;
	},
	has(target,name){
		return name in target._levels||name in target;
	},
	ownKeys(target){
		return Array.concat(Object.keys(target),Object.keys(target._levels))
	},
	iterate:function*(target){for(let lvl in target._levels){yield target._levels[lvl];}},//not working
	enumerate:function*(target){yield* Object.keys(target._levels);},
	deleteProperty(target,k){
		(name in target._levels)&&delete(target._levels[name]);
	},
	/*getOwnPropertyDescriptor(target, name){
		return (name in target)?Object.getOwnPropertyDescriptor(l,name):Object.getOwnPropertyDescriptor(l._levels,name);
	}*/
};
Material.prototype[Symbol.iterator]=function*(){yield* Material.prototype.proxyHandler.iterate(this)};//for now
Material.prototype.align=function(level){
	this.alignment=level;
}
Material.prototype.name="";

function Hetero(layers){
	this.layers=layers;
}
Hetero.prototype.colorMapping={};
Hetero.prototype.FermiLevelName="Fermi";
Hetero.prototype.getColorFromName=function(name){
	if(!(name in this.colorMapping)){
		//let colorSeed=crc32(Uint8Array.from(Array.from(name).map(e=>e.codePointAt(0))))&0xFFFFFF;
		let colorSeed=Math.round(Math.random()*0xFFFFFF);
		this.colorMapping[name]=("#"+([colorSeed>>16,(colorSeed>>8)&0xFF,colorSeed&0xFF].map(e=>e.toString(16)).map(e=>e.length>1?e:('0'+e)).join("")));
	}
	return this.colorMapping[name];
};
Hetero.prototype.align=function(by=null){
	by=by||this.FermiLevelName;
	for(let layer of this.layers){
		layer.align(layer._levels[by]);
	}
};
Hetero.prototype.draw=function(ctx=null,width,height,offset=30,bending=30){
	let host=document.createElement("DIV");
	ctx=ctx||SVG(host);
	ctx.size(width, height);
	ctx.attr({id:"het_"+this.layers.map(l=>l.name).join("/")});
	let pos;
	let maxHeight=Number.NEGATIVE_INFINITY;
	let minHeight=Number.POSITIVE_INFINITY;
	for(let layer of this.layers){
		for(let levelName in layer._levels){
			let level=layer[levelName];
			if(level>maxHeight)maxHeight=level;
			if(level<minHeight)minHeight=level;
		}
	}
	let stepX=(width-bending*(this.layers.length-1))/this.layers.length;
	let stepY=(height-2*offset)/(maxHeight-minHeight);
	let defs=ctx.defs().attr({id:null});
	
	let i;
	{
		let layersLabels=ctx.group();
		for(i=0;i<this.layers.length;i++){
			if("name" in this.layers[i])
				layersLabels.add(ctx.plain(this.layers[i].name).attr({id:"lbl_"+i}).cx(i*(stepX+bending)+stepX/2));
		}
		layersLabels.cy(offset/2).attr({id:"layersLabels"});
	}
	{
		let zonesBorders=ctx.group();
		let ifLineProto=ctx.line(0,0,0,height).attr({id:"ifLineProto"});
		defs.add(ifLineProto);
		for(i=0;i<this.layers.length-1;i++){
			zonesBorders.add(ctx.use(ifLineProto).translate(i*(stepX+bending)+stepX+bending/2).attr({id:"if_"+i+"("+this.layers[i].name+")/"+(i+1)+"("+this.layers[i+1].name+")"}));
		}
		zonesBorders.stroke({width: 1}).attr({"stroke-dasharray": "5, 8, 3, 8","id":"zonesBorders"});
	}
	
	let levelsStrokes=ctx.group().attr({id:"levelsStrokes"});
	ctx.strokeStyle="black";
	//window.ctx=ctx;
	i=0;
	
	let fermiProto=ctx.line(-stepX-bending/2,0,+bending/2,0).attr({id:"fermiProto"});
	defs.add(fermiProto);
	
	for(let layer of this.layers){
		let layerGroup=ctx.group().attr({id:"layer"+i+"_"+layer.name});
		let line=[];
		try{
			line.push([-stepX-bending/2,((this.layers[i-1].vacuum-layer.vacuum)/2)*stepY]);
		}catch(e){}
		line.push([-stepX,0]);
		line.push([0,0]);
		try{
			line.push([+bending/2,((this.layers[i+1].vacuum-layer.vacuum)/2)*stepY]);
		}catch(e){}
		
		let lvlProto=ctx.polyline(line).attr({id:"bandFormProto"+i+"("+layer.name+")"});
		ctx.defs().add(lvlProto);
		for(let levelName in layer._levels){
			let level=layer[levelName];
			let lvlLine;
			if(levelName==this.FermiLevelName){
				lvlLine=ctx.use(fermiProto);
			}
			else{
				lvlLine=ctx.use(lvlProto);
			}
			
			layerGroup.add(lvlLine.attr({id:"lvl_"+levelName+":"+i+"("+layer.name+")"}).stroke({color: this.getColorFromName(levelName)}).translate(i*(stepX+bending)+stepX,level*stepY));
		}
		levelsStrokes.add(layerGroup);
		i++;
	}
	levelsStrokes.transform(new SVG.Matrix(1, 0, 0, -1, 0, stepY*maxHeight+offset)).fill('none').stroke({ width: 1});
	ctx.spof();
	return host.childNodes[0];
};