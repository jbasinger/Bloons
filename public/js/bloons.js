
var Entity = function(){
	
	var self = this;
	
	self.addComponent = function(component){
		if (!component){
			console.log("Attempted adding a null component.");
			return;
		}
			
		_.extend(self,component);
		if (_.isFunction(component.added))
			component.added(self);
	}
	
	//This is probably terrible. =)
	self.removeComponent = function(component){
		
		if (!component){
			console.log("Attempted removing a null component.");
			return;
		}
		
		_.each(_.keys(component),function(k){
			if (self[k])
				delete self[k];
		});
		if (_.isFunction(component.removed))
			component.removed(self);
	}
	
	return self;
	
}

var Component = function(){
	
	var self = this;
	var added = function(entity){};
	
}

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
var queue = new createjs.LoadQueue(true);
var timer = new Entity();

$(function(){
	
	stage.snapToPixel = true;
	
	var menu = new createjs.Container().set({name: "menu"});
	var board = new createjs.Container().set({name: "board"});
	
	
	
	createjs.SceneManager.addScene(menu, function(){
		//Shown callback
		stage.enableMouseOver();
	}, function(){
		stage.enableMouseOver(0);
	});
	
	createjs.SceneManager.addScene(board);
	
	window.addEventListener("keydown", function(e){
		if (e.keyCode == 27 && createjs.SceneManager.activeScene.name == "board" ){
			createjs.SceneManager.showScene("menu",stage);
			pauseBoard();
		}
		e.preventDefault();
	});
	
	var manifest = [
		{src:"images/bloon.png", id:"bloon"},
	];
	
	for (var i=1; i < 6; i++){
		manifest.push({src:"sounds/p" + i + ".wav", id:"p" + i});
	}
	
	queue.installPlugin(createjs.Sound);
	
	queue.on("error", function(evt){
		console.log(evt);
	}, this);
	
	queue.on("complete", function(evt){
			
		configMenu(menu, $canvas);
		configBoard(board, $canvas);
		
		createjs.SceneManager.showScene("menu", stage);
		
		createjs.Ticker.setFPS(60);
		createjs.Ticker.addEventListener("tick",function(event){
			stage.update(event);
		});

	}, this);
	
	queue.loadManifest(manifest);
	
});

//Misc functions
function rand(min,max){ //Inclusive
	min = min || 0;
	max = max || 1;
	return Math.random() * (max - min) + min;
}

function showBoard(){
	createjs.SceneManager.showScene("board", stage);
	_.each(bloons, function(b){
		b.SwayHorizontal.setPaused(false);
		b.AnimateDown.setPaused(false);
	});
	timer.timers["timer"].paused = false;
}

function pauseBoard(){
	_.each(bloons, function(b){
		b.SwayHorizontal.setPaused(true);
		b.AnimateDown.setPaused(true);
	});
	timer.timers["timer"].paused = true;
}

// Game specific functions
function configMenu(menuContainer, $canvas){
		
	var title = new Entity();
	title.addComponent(new Text("BLOONS!", "bold 90px Arial", "#00FFFF"));
	title.addComponent(new Position($canvas.width()/2, $canvas.height()/6.28, title.getMeasuredWidth()/2, title.getMeasuredHeight()/2));
	
	var playMode = new MenuOption("TIME MODE", "64px Arial", "#FF0000", $canvas.width()/2, title.y + 150, function(evt){
		showBoard();
	});
	var zenMode = new MenuOption("ZEN MODE", "64px Arial", "#FF0000", $canvas.width()/2, title.y + 250, function(evt){
		showBoard();
	});
	
	menuContainer.addChild(title);
	menuContainer.addChild(playMode);
	menuContainer.addChild(zenMode);
	
	return menuContainer;
}

function configBoard(boardContainer, $canvas){

		for (var i=0; i < MAX_BLOONS; i++){
			
			var bloon = new Bloon();

			boardContainer.addChild(bloon);
			bloons.push(bloon);

		}

		timer.addComponent(new Timer("timer",{duration:60000, pause:true}, function(n,e){
			console.log("GET TO TWERK!");
		}));
		
		timer.getSeconds = function(){
			
			var t = this.timers["timer"];
			
			if (!t)
				return 0 + "";
			
			return Math.round(t.duration/1000) + "";
			
		}
		
		timer.addComponent(new Text("Time Left: " + timer.getSeconds(), "32px Arial", "#00FFFF", 0, 0));
		
		createjs.Ticker.on("tick", function(evt){
			timer.text = "Time Left: " + timer.getSeconds();
		});
		
		boardContainer.addChild(timer);
		
}

//Components
var RandomColor = function(){
	
	var comp = new Component();
	
	comp.filters = [new createjs.ColorFilter(0.25,0.25,0.25,1,rand(0,255),rand(0,255),rand(0,255),0)];
	
	comp.added = function(e){
		e.cache(0,0,e.width, e.height);
	}
	
	return comp;
}

var Bitmap = function(image){
	
	var comp = new Component();
	
	_.extend(comp,new createjs.Bitmap(image).set({
		height: image.height,
		width: image.width
	}));
	
	return comp;
	
}

var Position = function(x,y, regX, regY){
	
	//TODO: Add functions here to allow centering on things
	//this component is kind of boring
	
	var comp = new Component();
	
	comp.x = x;
	comp.y = y;
	
	if (regX){
		comp.regX = regX;
	}
	
	if (regY){
		comp.regY = regY;
	}
	
	comp.added = function(e){
		//console.log(e.y);
	}
	
	return comp;
}

var Text = function(text, font, color){
	
	var comp = new Component();
	
	_.extend(comp, new createjs.Text(text, font, color));
	
	comp.added = function(e){
		var hit = new createjs.Shape();
		hit.graphics.beginFill("#000").drawRect(0, 0, e.getMeasuredWidth(), e.getMeasuredHeight());
		e.hitArea = hit;
	}
	
	return comp;
	
}

var MouseOverFlipOut = function(){
	
	var comp = new Component();
	comp.flippingOut = false;
	
	comp.added = function(e){
		
		e.on("mouseover", function(evt){
			e.flippingOut = true;
		});
		
		e.on("mouseout", function(evt){
			e.flippingOut = false;
		});
		
		createjs.Ticker.addEventListener("tick",function(evt){
			if (e.flippingOut && e.color){
				e.color = "#" + _.random(0,255).toString(16) + _.random(0,255).toString(16) + _.random(0,255).toString(16);
			} else {
				e.color = "#FF0000";
			}
		});

	}
	
	return comp;
	
}

var SwayHorizontal = function(dt){
	
	var comp = new Component();
	
	comp.added = function(e){
		var wave = _.random(-5*e.width, 5*e.width);
		var origX = e.x;
		e.SwayHorizontal = createjs.Tween.get(e, {loop: true})
			.to({x: e.x + wave}, dt, createjs.Ease.sineInOut)
			.to({ x: origX }, dt, createjs.Ease.sineInOut);
	}
	
	return comp;
	
}

var AnimateDown = function(dt, height, onDone){

	var comp = new Component();
	
	comp.added = function(e){
		var tween = createjs.Tween.get(e).to({
			y: height
		}, dt, createjs.Ease.linear);
		
		if (_.isFunction(onDone)){
			tween.call(onDone);
		}
		
		e.AnimateDown = tween;
		
	}
	
	return comp;
}

var Removeable = function(onRemoved){

	var comp = new Component();
	
	comp.added = function(e){
		e.remove = function(){
			var parent = e.parent;
			e.parent.removeChild(e);
			if (_.isFunction(onRemoved)){
				onRemoved(e, parent);
			}
		}
	}
	
	return comp;
}

var Poppable = function(){
	
	var comp = new Component();
	
	comp.added = function(e){
		
		e.on("click", function(evt){
			
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
				evt.target.remove();
			});
			
		});
		
	}
	
	return comp;
}

var Timer = function(name, options, callback){
	
	var comp = new Component();
	
	comp.added = function(e){
	
		e.timers = e.timers || {};
		options = _.extend({duration: 1000, paused: false, loop: false},options);
		e.timers[name] = options;
		
		var origDuration = options.duration;
		
		createjs.Ticker.on("tick",function(evt){
			//Should probably make this remove the tick event on destruction somehow.
			//console.log(evt);
			//if (!e.timers[name])
			//	return;
				
			if (!e.timers[name].paused)
				e.timers[name].duration -= evt.delta;
			
			if (e.timers[name].duration <= 0){
				e.timers[name].duration = 0;
				callback(name, e);
				if (e.timers[name].loop){
					e.timers[name].duration = origDuration;
				}
			}
				
		});
		
	}
	
	return comp;
	
}

//Factories
var Bloon = function(container){
	
	var bloon = new Entity();
	
	bloon.addComponent(new Bitmap(queue.getResult("bloon")));
	bloon.addComponent(new Position(_.random(0, $canvas.width()-bloon.width), _.random(-$canvas.height(), 0-bloon.height)));
	bloon.addComponent(new RandomColor());
	bloon.addComponent(new SwayHorizontal(_.random(1000,2000)));
	bloon.addComponent(new AnimateDown(_.random(10000,15000),$canvas.height()+bloon.height,function(tween){
		bloon.remove();
	}));
	bloon.addComponent(new Removeable(function(e, parent){
		bloons = _.without(bloons, e);
		if (bloons.length < MAX_BLOONS){
			var newBloon = new Bloon(parent);
			newBloon.SwayHorizontal.setPaused(false);
			newBloon.AnimateDown.setPaused(false);
			bloons.push(newBloon);
			parent.addChild(newBloon);
		}
	}));
	bloon.addComponent(new Poppable());
	
	bloon.snapToPixel = true;
	bloon.SwayHorizontal.setPaused(true);
	bloon.AnimateDown.setPaused(true);
	
	return bloon;
	
}

var MenuOption = function(text, font, color, x, y, onClick){

	var menu = new Entity();
	
	menu.addComponent(new Text(text,font,color));
	menu.addComponent(new Position(x, y, menu.getMeasuredWidth()/2, menu.getMeasuredHeight()/2));
	menu.addComponent(new MouseOverFlipOut());
	
	if (_.isFunction(onClick)){
		menu.on("click",onClick);
	}
	
	return menu;
	
}