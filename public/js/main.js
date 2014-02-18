

$(function(){
	
	var $canvas = $("#game");
		
	var stage = new createjs.Stage($canvas[0]);
	
	window.addEventListener("keydown", function(e){
		console.log(e);
		e.preventDefault();
	});
	
	var image = new Image();
	image.src = "images/derp.png";
	image.onload = function(){
	
		var derpSheet = new createjs.SpriteSheet({
			images: [image],
			frames: {width: image.width, height: image.height, regX: image.width/2, regY: image.height/2}
		});
		var derp = new createjs.Sprite(derpSheet).set({
			x: 50,
			y: 50,
			name: "Derp"
		});
		
		derp.on("keypress",function(event){
			console.log(event);
		});
		
		stage.addChild(derp);
		
		// createjs.Ticker.addEventListener("tick",function(event){
			// stage.update(event);
		// });
		
	};
	
	$.get("data/filetest.tmx",function(data){
	
		var map = jsTMX.parse(data);
		console.log(map);
		
		var queue = new createjs.LoadQueue(true);
		
		queue.on("error", function(evt){
			console.log(evt);
		}, this);
		
		//Check out queue.loadManifest to load an array.
		_.each(map.imagelayers, function(il){
			var filename = _.last(il.image.source.split("/"));
			queue.loadFile({src:"images/" + filename, id: filename});
		});
		
		_.each(map.tilesets, function(ts){
			var filename = _.last(ts.image.source.split("/"));
			queue.loadFile({src:"images/" + filename, id: filename});
		});
		
		queue.on("complete", function(evt){
			
			var sheets = [];
			_.each(map.tilesets, function(ts){
				var filename = _.last(ts.image.source.split("/"));
				var sh = new createjs.SpriteSheet({
					images: [queue.getResult(filename)],
					frames: {width: ts.tilewidth, height: ts.tileheight, regX: ts.tileoffsetX, regY: ts.tileoffsetY}
				});
				sheets.push(sh);
			});
			
			//This is half a hack. It doesn't figure out which tileset the gid is in
			//We're just using the first one for now.
			_.each(map.layers, function(layer){
				var xOff = 0, yOff = 0;
				_.each(layer.data, function(tileData){
					
					var tile = new createjs.Sprite(sheets[0]).set({
						x: xOff,
						y: yOff
					});
					
					tile.gotoAndStop(tileData.gid-1);
					stage.addChild(tile);
					stage.update();
					
					xOff += +map.tilewidth;
					yOff += xOff >= (+map.tilewidth * +map.width) ? +map.tileheight : 0;
					
					if (xOff >= (+map.tilewidth * +map.width))
						xOff = 0;
					
				});
			});
			
			//Cheating to just get it to work.
			//var thing = new createjs.Sprite(sheets[0]);
			//thing.gotoAndStop(0);
			/*var thing = new createjs.Sprite(sheets[0].getFrame(0)).set({
				x: 100,
				y: 100});*/
			//stage.addChild(thing);
			stage.update();
			
			createjs.Ticker.addEventListener("tick",function(event){
				stage.update(event);
			});
			
		}, this);
		
		queue.load();
		
	});
	
});

