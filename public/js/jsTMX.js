
//This beast relies heavily on underscore.js

var jsTMX = (function(tmx){
	
	var tmxer = tmx || {};
	
	tmxer.parse = function(data){
		
		var self = this;
		
		var parser = new DOMParser();
		var doc = parser.parseFromString(data, "application/xml");
		
		//Load up the main map object
		var map = _.extend({
				properties: self.propertiesObject(doc.querySelectorAll("map > properties > property")),
				tilesets: [],
				layers: [],
				objectgroups: [],
				imagelayers: []
			},self.attributesObject(doc.childNodes[0].attributes));

		//Add in the tilesets
		_.each(doc.querySelectorAll("tileset"),function(ts){
			
			var tileset = _.extend({
				tileoffsetX: 0,
				tileoffsetY: 0,
				image: self.attributesObject(ts.querySelectorAll("image")[0].attributes),
				properties: self.propertiesObject(ts.querySelectorAll("properties > property")),
				terrainTypes: []
			}, self.attributesObject(ts.attributes));
			
			//We'll worry about terrainTypes later.
			map.tilesets.push(tileset);
			
		});
		
		//Add in the layers
		_.each(doc.querySelectorAll("layer"),function(l){
			
			//console.log(l);
			//console.log(l.querySelectorAll("properties > property"));
			
			var layer = _.extend({
				properties: self.propertiesObject(l.querySelectorAll("properties > property")),
				data: []
			}, self.attributesObject(l.attributes));
			
			//Load the data. Not dealing with TileFlipping either.
			_.each(l.querySelectorAll("data > tile"),function(ti){
				var tile = self.attributesObject(ti.attributes);
				layer.data.push(tile);
			});
			
			map.layers.push(layer);
			
		});
		
		//Eventually need to deal with objectgroups
		_.each(doc.querySelectorAll("objectgroup"),function(og){
			
			var objgroup = _.extend({
				properties: {},
				objects: []
			}, self.attributesObject(og.attributes));
			
			if (og.querySelectorAll("properties")[0] && og.querySelectorAll("properties")[0].parentNode == og){
				objgroup.properties = self.propertiesObject(og.querySelectorAll("properties")[0].querySelectorAll("property"));
			}
			
			//Aaaand the objects
			_.each(og.querySelectorAll("object"), function(o){
				
				//Default to a square because it's the only one
				//without like... anything
				var obj = _.extend({
					points: [],
					objectType: "square",
					properties: self.propertiesObject(o.querySelectorAll("properties > property"))
				}, self.attributesObject(o.attributes));
				
				if (_.has(obj,"gid")){
					//We're an image thing
					obj.objectType = "image";
					
				} else {
					
					if (o.querySelectorAll("ellipse").length != 0){
						obj.objectType = "ellipse";
					}
					if (o.querySelectorAll("polygon").length != 0){
						obj.objectType = "polygon";
					}
					if (o.querySelectorAll("polyline").length != 0){
						obj.objectType = "polyline";
					}
					
					if (obj.objectType  == "polygon" || obj.objectType == "polyline"){
						var points = o.querySelectorAll(obj.objectType)[0].attributes[0].nodeValue;
						_.each(points.split(" "), function(pt){
							var coords = pt.split(",");
							obj.points.push({
								x: coords[0],
								y: coords[1]
							});
						});
					}
					
					objgroup.objects.push(obj);
					
				}

			});
			
			map.objectgroups.push(objgroup);
			
		});
		
		//and imagelayers
		_.each(doc.querySelectorAll("imagelayer"), function(il){
			
			var imageLayer = _.extend({
				properties: self.propertiesObject(il.querySelectorAll("properties > property")),
				image: self.attributesObject(il.querySelectorAll("image")[0].attributes)
			}, self.attributesObject(il.attributes));
			
			map.imagelayers.push(imageLayer);
			
		});
		
		return map;
		
	}
	
	tmxer.attributesObject = function(attributes){
		return _.reduce(attributes,function(obj, attr){
				
				var newObj = {};
				newObj[attr.name] = attr.value;
				return _.extend(obj,newObj);
				
		},{});
	}
	
	tmxer.propertiesObject = function(properties){
		return _.reduce(properties, function(obj, prop){
			var newObj = {};
			newObj[prop.attributes.name.nodeValue] = prop.attributes.value.nodeValue;
			return _.extend(obj, newObj);
		},{});
	}
	
	return tmxer;
	
}(jsTMX));