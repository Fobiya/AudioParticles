;(function(main){
	
	main(this,document,Vector2,undefined);
	
})(function(window,document,vec2){
	
	var Particle = (function(){
		function Particle(index, parent){
			this.parent = parent;
			this.index = index;
			this.velocity = new Vector2(3 - Math.random() * 6,0);
			this.minSize = 5;
			this.init();
		}
		return Particle;
	})();
	
	Particle.prototype.init = function(){
		this.freqVal = this.parent.freqData[this.index] * 0.01;
		this.size = (this.freqVal * 30) + this.minSize;
		this.position = new Vector2(Math.random() * this.parent.dimensions.x, this.parent.dimensions.y + this.size);
	};
	
	Particle.prototype.update = function(){
		this.freqVal = this.parent.freqData[this.index] * 0.01;
		
		this.size = (this.freqVal * 30) + this.minSize;
		this.offset = this.size/2;
		
		this.hue = ((this.index/this.parent.bufferLen) * 360) + 120 + this.parent.tick / 6;
		this.saturation = this.freqVal * 35;
		this.alpha = this.freqVal * 0.3;
		
		this.fill = 'hsla(' + this.hue + ',' + this.saturation + '%,50%,' + this.alpha + ')';
		
		this.lift = Math.pow(this.freqVal,3);
		
		this.position.subY(this.lift);
		this.position.add(this.velocity);
		
		this.checkBounds();
	};
	
	Particle.prototype.checkBounds = function(){
		if(this.position.y < -this.size || this.position.x < -this.size || this.position.x > this.parent.dimensions.x + this.size){
			this.init();
		}
	};
	
	var App = (function(){
		function App(){
			this.tick = 0;
			this.currentSong = 1;
			this.globalMovement = new vec2();
			this.initCanvas();
			this.initUI();
			this.initAudio();
			this.loadAudio();
			this.populate();
			this.render();
		}
		return App;
	})();
	
	App.prototype.initCanvas = function(){
		this.canvas = document.getElementById('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.dimensions = {};
		this.resize();
	};
	
	App.prototype.resize = function(){
		this.canvas.width = this.dimensions.x = window.innerWidth;
		this.canvas.height = this.dimensions.y = window.innerHeight;
	};
	
	App.prototype.initUI = function(){
    var self = this;
    this.background = document.getElementById('background');
    this.title = document.getElementById('title');
    this.btnPlay = document.getElementById('check-audio-toggle');
		this.gui = new dat.GUI();
		this.switchSong = this.gui.add(this,'currentSong').min(1).max(4).step(1);
		this.switchSong.onFinishChange(function(){
			self.loadAudio();
		});
	};
	
	App.prototype.initAudio = function(){
    var self = this;
		this.baseURL = 'http://www.seanalexanderfree.com/codepen/audio/';
    this.fileNames = ['dmwaltz.mp3', 'nocturne92.mp3', 'mozart25.mp3', 'trista.mp3'];
    this.songTitles = ['Dmitri Shostakovich - Waltz No. 2', 'Frederic Chopin - Nocturne op. 9 no. 2','Mozart - Symphony no. 25','Heitor Villa-Lobos - Tristorosa'];
		
    this.audio = document.getElementById('audio');
    this.audio.addEventListener('ended', function(){
      self.audio.currentTime = 0;
      self.audio.pause();
      self.btnPlay.checked = false;
      self.currentSong = self.currentSong < 4 ? self.currentSong + 1 : 0;
      self.loadAudio();
    }); 
		this.audioCtx = new AudioContext();
		
		this.analyser = this.audioCtx.createAnalyser();
		this.source = this.audioCtx.createMediaElementSource(this.audio);
		
		this.source.connect(this.analyser);
		this.analyser.connect(this.audioCtx.destination);
		
		this.bufferLen = this.analyser.frequencyBinCount;
		this.freqData = new Uint8Array(this.bufferLen);
	};
	
	App.prototype.loadAudio = function(){
    var self = this;
    
    this.btnPlay.classList.add('disabled');
    this.background.classList.add('loading');
		
		var request = new XMLHttpRequest();
    
		request.open('GET', this.baseURL + this.fileNames[this.currentSong - 1], true);
		request.responseType = 'blob';

		request.onload = function() {
      self.title.innerHTML = self.songTitles[self.currentSong - 1];
      self.background.classList.remove('loading');
			self.btnPlay.classList.remove('disabled');
      
			self.audio.src = window.URL.createObjectURL(request.response);
		  self.audio.play();
      
			self.btnPlay.checked = true;
			self.btnPlay.onchange = function(e){
				if(this.checked){
					self.audio.play();
				}
				else{
					self.audio.pause();
				}
			};
		}

		request.send();
	}
	
	App.prototype.populate = function(){
		this.particles = [];
		for(var i = 0; i < this.bufferLen; i++){
			this.particles.push(new Particle(i, this));
		}
		console.log('populated');
	};
	
	App.prototype.draw = function(){
		this.ctx.clearRect(0,0,this.dimensions.x,this.dimensions.y);
		this.ctx.save();
		for(var i = 0, len = this.particles.length; i < len; i++){
			var particle = this.particles[i];
			particle.update();
			particle.position.add(this.globalMovement);
      if(particle.freqVal > 0){
        this.ctx.beginPath();
        this.ctx.fillStyle = particle.fill;
        this.ctx.beginPath();
        this.ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI*180);
        this.ctx.fill();
        this.ctx.closePath();
      }
		}
		this.ctx.restore();
	};
	
	App.prototype.render = function(){
		var self = this;
		this.tick++;
		this.globalMovement.x = Math.sin(this.tick * 0.01) * 2;
		this.analyser.getByteFrequencyData(this.freqData);
		this.draw();
		window.requestAnimationFrame(self.render.bind(self));
	};
	
	window.onload = function(){
		var app = new App;
		window.onresize = function(){
			app.resize();
		}
	};
	
	window.requestAnimationFrame = (function(){
	return  window.requestAnimationFrame       ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame    ||
					window.oRequestAnimationFrame      ||
					window.msRequestAnimationFrame     ||
					function (callback) {
						window.setTimeout(callback, 1000 / 60);
					};
	})();
	
});