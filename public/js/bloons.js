
createjs.SceneManager = (function(){
	
	//Scenes should have names so we can show them
	
	var self = {};
	
	//Scenes are just createjs.Container objects
	self.scenes = [];
	self.activeScene = null;
	
	self.addScene = function(scene, shownCallback, hiddenCallback){
		//We need to do some validation here to stop problems in the future
		//But that takes effort and I'm lazy so we'll see what happens!
		scene.shownCallback = scene.shownCallback || shownCallback;
		scene.hiddenCallback = scene.hiddenCallback || hiddenCallback;
		self.scenes.push(scene);
	}
	
	self.removeScene = function(scene){
		self.scenes = _.without(scenes,scene);
	}
	
	self.showScene = function(name, stage){
		
		var s = _.find(self.scenes,function(x){ return x.name == name });
		
		if (s == null){
			throw "No scene with name " + name;
			return;
		} else {
			if (self.activeScene){
				var current = _.find(stage.children, function(x) { return x.name == self.activeScene.name });
				if (current)
					stage.removeChild(current);
					if (current.hiddenCallback)
						current.hiddenCallback();
			}
			stage.addChild(s);
			if (s.shownCallback)
				s.shownCallback();
			self.activeScene = s;
		}
		
	}
	
	return self;
	
}());

var MAX_BLOONS = 30;

var BLOON_TYPE = {
	NORMAL: 0
}

var game_init_state = {
	score: 0,
	clicks: 0,
	pops: 0,
	time: 60
}

var game_state = _.extend({},game_init_state);
var bloons = [];
var $canvas = $("#game");
var stage = new createjs.Stage($canvas[0]);

$(function(){
	
	stage.snapToPixel = true;
	
	var menu = new createjs.Container().set({name: "menu"});
	var board = new createjs.Container().set({name: "board"});
	
	configMenu(menu, $canvas);
	configBoard(board, $canvas);
	
	createjs.SceneManager.addScene(menu, function(){
		//Shown callback
		stage.enableMouseOver();
	}, function(){
		stage.enableMouseOver(0);
	});
	createjs.SceneManager.addScene(board, function(){
		//Shown callback
		_.each(bloons,function(b){
			b.tween.setPaused(false);
		});
	}, function(){
		//hidden callback
		_.each(bloons,function(b){
			b.tween.setPaused(true);
		});
	});
	
	window.addEventListener("keydown", function(e){
		
		//console.log(e);
		
		if (e.keyCode == 27 && createjs.SceneManager.activeScene.name == "board" ){
			createjs.SceneManager.showScene("menu",stage);
		}

		e.preventDefault();
	});
	
	var manifest = [
		{src:"images/bloon.png", id:"bloon"},
	];
	
	for (var i=1; i < 6; i++)
		manifest.push({src:"sounds/p" + i + ".wav", id:"p" + i});
	
	var queue = new createjs.LoadQueue(true);

	queue.installPlugin(createjs.Sound);
	
	queue.on("error", function(evt){
		console.log(evt);
	}, this);
	
	queue.on("complete", function(evt){
			
		for (var i=0; i < MAX_BLOONS; i++){
			
			var bloon = new Bloon(BLOON_TYPE.NORMAL, $canvas, queue.getResult("bloon"), board);

			//We need to DRY up the creation and deletion of bloons.
			//I want it to be contained in the object but decoupled from the board...
			//events? bloonFactory?
			board.addChild(bloon);
			bloons.push(bloon);

		}
		
		createjs.SceneManager.showScene("menu", stage);
		
		createjs.Ticker.setFPS(60);
		createjs.Ticker.addEventListener("tick",function(event){
			stage.update(event);
		});

	}, this);
	
	queue.loadManifest(manifest);
	
});

function rand(min,max){ //Inclusive
	min = min || 0;
	max = max || 1;
	return Math.random() * (max - min) + min;
}

function configMenu(menuContainer, $canvas){
	
	var title = new createjs.Text("BLOONS!", "bold 90px Arial", "#00FFFF").set({x: $canvas.width()/2, y: $canvas.height()/6.28});
	title.set({regX: title.getMeasuredWidth()/2, regY: title.getMeasuredHeight()/2});
	
	var playMode = new createjs.Text("TIME MODE", "64px Arial", "#FF0000").set({x: $canvas.width()/2, y: title.y + 150});
	playMode.set({regX: playMode.getMeasuredWidth()/2, regY: playMode.getMeasuredHeight()/2});
	
	var hit = new createjs.Shape();
	hit.graphics.beginFill("#000").drawRect(0, 0, playMode.getMeasuredWidth(), playMode.getMeasuredHeight());
	playMode.hitArea = hit;
	
	playMode.flippingOut = false;
	
	playMode.on("mouseover", function(evt){
			playMode.flippingOut = true;
	});
	
	playMode.on("mouseout", function(evt){
		playMode.flippingOut = false;
	});
	
	playMode.on("click", function(evt){
		createjs.SceneManager.showScene("board", stage);
	});
	
	var zenMode = new createjs.Text("ZEN MODE", "64px Arial", "#FF00FF").set({x: $canvas.width()/2, y: title.y + 250});
	zenMode.set({regX: zenMode.getMeasuredWidth()/2, regY: zenMode.getMeasuredHeight()/2});
	
	//This could use some DRYing
	var hit2 = new createjs.Shape();
	hit2.graphics.beginFill("#000").drawRect(0, 0, zenMode.getMeasuredWidth(), zenMode.getMeasuredHeight());
	zenMode.hitArea = hit2;
	
	zenMode.flippingOut = false;
	
	zenMode.on("mouseover", function(evt){
			zenMode.flippingOut = true;
	});
	
	zenMode.on("mouseout", function(evt){
		zenMode.flippingOut = false;
	});
	
	zenMode.on("click", function(evt){
		//Change the mode here too.
		createjs.SceneManager.showScene("board", stage);
	});
	
	
	createjs.Ticker.addEventListener("tick",function(evt){
		if (playMode.flippingOut){
			playMode.color = "#" + _.random(0,255).toString(16) + _.random(0,255).toString(16) + _.random(0,255).toString(16);
		} else {
			playMode.color = "#FF0000";
		}
		
		if (zenMode.flippingOut){
			zenMode.color = "#" + _.random(0,255).toString(16) + _.random(0,255).toString(16) + _.random(0,255).toString(16);
		} else {
			zenMode.color = "#FF0000";
		}
	});
	
	console.log(_.random(0,255).toString(16));
	
	menuContainer.addChild(title);
	menuContainer.addChild(playMode);
	menuContainer.addChild(zenMode);
	
	return menuContainer;
}

function configBoard(boardContainer, $canvas){
	
}

var Bloon = function(type, $canvas, image, stage){
	
	var width = image.width;
	var height = image.height;
	
	var bloon = new createjs.Bitmap(image).set({
		height: height,
		width: width,
		x: _.random(0, $canvas.width()-width),
		y: _.random(-5*height, 0-height),
		v: _.random(10000,15000)
	});
	
	bloon.filters = [new createjs.ColorFilter(0.25,0.25,0.25,1,rand(0,255),rand(0,255),rand(0,255),0)];
	bloon.snapToPixel = true;
	bloon.cache(0, 0, width, height);
	
	bloon.adios = function(){
		stage.removeChild(this);
		bloons = _.without(bloons, this);
		if (bloons.length < MAX_BLOONS){
			var newBloon = new Bloon(BLOON_TYPE.NORMAL, $canvas, image, stage);
			bloons.push(newBloon);
			stage.addChild(newBloon);
		}
	}
	
	bloon.tween = createjs.Tween.get(bloon).to({
		y: $canvas.height()-bloon.height
	}, bloon.v, createjs.Ease.linear)
	.call(function(tween){
		tween._target.adios();
	});
	
	var wave = _.random(-5*bloon.width, 5*bloon.width);
	var origx = bloon.x;
	bloon.wavyTween = createjs.Tween.get(bloon, {loop: true})
		.to({x: bloon.x + wave}, _.random(1000,2000), createjs.Ease.sineInOut)
		.to({ x: origx },_.random(1000,2000), createjs.Ease.sineInOut);
	
	bloon.click = function(evt){
		createjs.Sound.play("p" + _.sample([1,2,3,4,5]), createjs.Sound.INTERRUPT_NONE);
		createjs.Tween.removeTweens(evt.target);
		
		evt.target.set(_.sample([{
			skewX: _.sample([_.random(55,75),_.random(-75,-55)])
		},
		{
			skewY: _.sample([_.random(55,75),_.random(-75,-55)])
		}]));
		
		evt.target.removeAllEventListeners();
		
		var toX = _.sample([-3*evt.target.width, $canvas.width()+3*evt.target.width]);
		var toY = _.random(-3*evt.target.height, $canvas.height()+3*evt.target.height);
		createjs.Tween.get(evt.target).to({y: toY}, 500, createjs.Ease.elasticInOut);
		createjs.Tween.get(evt.target).to({x: toX}, 500, createjs.Ease.linear).call(function(tween){
			evt.target.adios();
		});
		//evt.target.adios();
		//Add the popped bitmap, or better yet play some animation thing?
	};
	
	bloon.addEventListener("click", bloon.click);
	
	switch(type)
	{
		case BLOON_TYPE.NORMAL:
			
			return bloon;
			break;
		default:
			throw "We don't make type " + type + " bloons here. Find another factory!";
	}
}