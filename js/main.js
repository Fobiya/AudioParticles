;(function(main){
	
	main(this,document,Vector2,undefined);
	
})(function(window,document,vec2){
	
	var canvas, ctx,
			dimensions, center,
			particles, props, 
			audio, audioCtx, source, tick, 
      background, title, gui,
      baseURL, fileNames, songTitles, currentSong,
			analyser, bufferLen, freqData, btnPlay, globalMovement;
	
	var Particle = (function(){
		function Particle(index){
			this.index = index;
			this.velocity = new Vector2(3 - Math.random() * 6,0);
			this.minSize = 5;
			this.init();
		}
		return Particle;
	})();
	
	Particle.prototype.init = function(){
		this.freqVal = freqData[this.index] * 0.01;
		this.size = (this.freqVal * 30) + this.minSize;
		this.position = new Vector2(Math.random() * dimensions.x, dimensions.y + this.size);
	};
	
	Particle.prototype.update = function(){
		this.freqVal = freqData[this.index] * 0.01;
		
		this.size = (this.freqVal * 30) + this.minSize;
		this.offset = this.size/2;
		
		this.hue = ((this.index/bufferLen) * 360) + 120 + tick / 6;
		this.saturation = this.freqVal * 35;
		this.alpha = this.freqVal * 0.3;
		
		this.fill = 'hsla(' + this.hue + ',' + this.saturation + '%,50%,' + this.alpha + ')';
		
		this.lift = Math.pow(this.freqVal,3);
		
		this.position.add(globalMovement);
		this.position.subY(this.lift);
		this.position.add(this.velocity);
		
		this.checkBounds();
	};
	
	Particle.prototype.checkBounds = function(){
		if(this.position.y < -this.size || this.position.x < -this.size || this.position.x > dimensions.x + this.size){
			this.init();
		}
	};
	
  function initAudio(){
		audio = document.getElementById('audio');
		audioCtx = new AudioContext();
		
		analyser = audioCtx.createAnalyser();
		source = audioCtx.createMediaElementSource(audio);
		
		source.connect(analyser);
		analyser.connect(audioCtx.destination);
		
		bufferLen = analyser.frequencyBinCount;
		freqData = new Uint8Array(bufferLen);
    
  }
  
	function loadAudio(index){
		var request = new XMLHttpRequest();
    
    btnPlay.classList.add('disabled');
    background.classList.add('loading');
    title.innerHTML = songTitles[index];
    
		request.open('GET', baseURL + fileNames[index], true);
		request.responseType = 'blob';

		request.onload = function() {
      background.classList.remove('loading');
			btnPlay.classList.remove('disabled');
      
			audio.src = window.URL.createObjectURL(request.response);
		  audio.play();
      audio.addEventListener('ended', function(){
        audio.currentTime = 0;
				audio.pause();
        btnPlay.checked = false;
      }); 
      
			btnPlay.checked = true;
			btnPlay.onchange = function(e){
				if(this.checked){
					audio.play();
				}
				else{
					audio.pause();
				}
			};
		}

		request.send();
	}
	
	function populate(){
		particles = [];
		for(var i = 0; i < bufferLen; i++){
			particles.push(new Particle(i));
		}
	}
	
	function resize(){
		canvas.width = dimensions.x = window.innerWidth;
		canvas.height = dimensions.y = window.innerHeight;
		center = new Vector2(dimensions.x/2,dimensions.y/2);
	}
	
	function draw(){
		ctx.clearRect(0,0,dimensions.x,dimensions.y);
		ctx.save();
		for(var i = 0, len = particles.length; i < len; i++){
			var particle = particles[i];
			particle.update();
      if(particle.freqVal > 0){
        ctx.beginPath();
        ctx.fillStyle = particle.fill;
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI*180);
        ctx.fill();
        ctx.closePath();
      }
		}
		ctx.restore();
	}
	
	function render(){
		tick++;
		globalMovement.x = Math.sin(tick * 0.01) * 2;
		analyser.getByteFrequencyData(freqData);
		draw();
		window.requestAnimationFrame(render);
	}
	
	function init(){
		canvas = document.getElementById('canvas');
		ctx = canvas.getContext('2d');
		dimensions = {};
    
    background = document.getElementById('background');
    title = document.getElementById('title');
    btnPlay = document.getElementById('check-audio-toggle');
		tick = 0;
    
		globalMovement = new vec2();
    
    baseURL = 'http://www.seanalexanderfree.com/codepen/audio/';
    fileNames = ['dmwaltz.mp3', 'nocturne92.mp3', 'mozart25.mp3', 'trista.mp3'];
    songTitles = ['Dmitri Shostakovich - Waltz No. 2', 'Frederic Chopin - Nocturne op. 9 no. 2','Mozart - Symphony no. 25','Heitor Villa-Lobos - Tristorosa'];
    currentSong = {
      Song: 1
    };
    
    gui = new dat.GUI();
    var switchSong = gui.add(currentSong,'Song').min(1).max(4).step(1);
    switchSong.onFinishChange(function(){
      audio.pause();
      loadAudio(currentSong.Song - 1);
    });
		resize();
    initAudio();
		loadAudio(currentSong.Song - 1);
		populate();
		render();
	}
	
	window.onload = init;
	
	window.onresize = resize;
	
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