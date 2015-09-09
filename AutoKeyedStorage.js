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
function AutoKeyedStorage(...materials){
	this.add(...materials);
	return new Proxy(this,this.proxyHandler);
}
AutoKeyedStorage.prototype.deriveKey=function(el){
	return el.name;
}
AutoKeyedStorage.prototype.add=function(...layers){
	layers.map(l=>this._map.set(this.deriveKey(l),l));
}
AutoKeyedStorage.prototype._map=new Map();
AutoKeyedStorage.prototype.proxyHandler={
	get(target, key, receiver){
		if(key in target)
			return target[key];
		if(target._map.has(key))
			return target._map.get(key);
		else return undefined;
	},
	set(target, key, val, receiver){
		if(name in target)
			return false;
		return target._map.set(key,val);
	},
	has(target,key){
		return target._map.has(key)||name in target;
	},
	ownKeys(target){
		return Array.concat(Object.keys(target),Array.from(target._map.keys()));
	},
	iterate(target){//not working
		return target._map.values();
	},
	enumerate(target){
		return target._map.keys();
	},
	deleteProperty(target,key){
		return target._map.delete(key);
	}
};
AutoKeyedStorage.prototype[Symbol.iterator]=function*(){yield* AutoKeyedStorage.prototype.proxyHandler.iterate(this)};//for now