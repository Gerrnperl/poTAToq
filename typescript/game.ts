import { Layer, StaticComponent, DynamicComponent, Character,Player, poTATo} from "./components.js";
import { loadTexture, setPresentationReference, Percent } from "./utils.js";
import { score, changeBlood } from "./index.js";

// alias
let P = Percent;

interface GameLayers {
	background: Layer;
	play: Layer;
}

export class Game {
	player: Player;
	enemies: Character[] = [];
	background: StaticComponent;
	layers: GameLayers;
	container: HTMLElement;
	started: boolean = false;
	boss: number = 0;
	timeStamp: number = 0;

	constructor(container: HTMLElement, start:Promise<any>) {
		this.container = container;
		console.log(this.container.offsetWidth);
		
		setPresentationReference('width', this.container.offsetWidth);
		setPresentationReference('height', this.container.offsetHeight);
		// create layers
		this.layers = {
			background: new Layer(container.offsetWidth,container.offsetHeight,0),
			play: new Layer(container.offsetWidth,container.offsetHeight,1)
		}
		for(let layer of Object.values(this.layers)){
			container.appendChild(layer.canvas);
		}
		// create component
		this.background = new StaticComponent(
			'background',
			loadTexture("image/background.png"),
			new P(0, 'width'),
			new P(0, 'height'),
			new P(100, 'width'),
			new P(100, 'height')
		);
		this.layers.background.addComponent(this.background);
		this.player = new Player(
			'player',
			loadTexture("image/player.svg"),
			loadTexture("image/player-bullet.svg"),
			40,
			100,
			new P(50, 'width'),
			new P(90, 'height'),
			new P(5, 'height'),
			new P(6, 'height')
		);
		changeBlood(40);
		this.resizeBackground();
		this.initEvent();
		
		start.then(()=>{
			this.layers.play.addComponent(this.player);
			this.started = true;	
			this.update();

		})
	}

	initEvent(){
		document.addEventListener("keydown",(e)=>{
			if(!this.started){
				return;
			}
			let velocity = 3;
			let acceleration = 0.1;
			switch(e.key){
				case "ArrowLeft":
					this.player.vx = this.player.vx === 0 ? -velocity : this.player.vx;
					this.player.ax = -acceleration;					
					break;
				case "ArrowRight":
					this.player.vx = this.player.vx === 0 ? velocity : this.player.vx;
					this.player.ax = acceleration;
					break;
				case "ArrowUp":
					this.player.vy = this.player.vy === 0 ? -velocity : this.player.vy;
					this.player.ay = -acceleration;
					break;
				case "ArrowDown":
					this.player.vy = this.player.vy === 0 ? velocity : this.player.vy;
					this.player.ay = acceleration;
					break;
			}
		});
		document.addEventListener("keyup",(e)=>{
			if(!this.started){
				return;
			}
			switch(e.key){
				case "ArrowLeft":
					this.player.vx = 0;
					this.player.ax = 0;
					break;
				case "ArrowRight":
					this.player.vx = 0;
					this.player.ax = 0;
					break;
				case "ArrowUp":
					this.player.vy = 0;
					this.player.ay = 0;
					break;
				case "ArrowDown":
					this.player.vy = 0;
					this.player.ay = 0;
					break;
			}
		});
		// move player to the touch point
		let touchEvent = (e:TouchEvent)=>{
			if(!this.started){
				return;
			}
			e.preventDefault();
			let x = e.touches[0].clientX;
			let y = e.touches[0].clientY;
			let currentX = this.player.x.v;
			let currentY = this.player.y.v;
			let deltaX = x - currentX;
			let deltaY = y - currentY;
			
			if(Math.abs(deltaX) < this.player.w.v  && Math.abs(deltaY) < this.player.h.v ){

			console.log(deltaX,deltaY);
				this.player.vx = 0;
				this.player.vy = 0;
				this.player.ax = 0;
				this.player.ay = 0;
				return;
			}
			let k = 6 / Math.sqrt(deltaX ** 2 + deltaY ** 2)
			this.player.vx = k * deltaX;
			this.player.vy = k * deltaY;
			this.player.ax = 0;
			this.player.ay = 0;
		}
		document.addEventListener("touchstart",touchEvent, { passive: false });
		document.addEventListener("touchmove",touchEvent, { passive: false });
		document.addEventListener("touchend",(e)=>{
			if(!this.started){
				return;
			}
			e.preventDefault();
			this.player.vx = 0;
			this.player.vy = 0;
			this.player.ax = 0;
			this.player.ay = 0;
		}
		,false);


		window.addEventListener("resize", ()=>{
			setPresentationReference('width', this.container.offsetWidth);
			setPresentationReference('height', this.container.offsetHeight);
			// resize all canvas
			for (const layer of Object.values(this.layers)) {
				layer.resize(this.container.offsetWidth,this.container.offsetHeight);
			}
			this.resizeBackground();
		})
	}

	resizeBackground(){
		let originalWidth = this.background.texture.width;
		let originalHeight = this.background.texture.height;
		let containerWidth = this.container.offsetWidth;
		let containerHeight = this.container.offsetHeight;
		// resize background
		if(originalWidth/originalHeight > containerWidth/containerHeight){
			this.background.h.v = containerHeight;
			// scale the width of background, to keep the aspect ratio
			this.background.w.v = originalWidth * (containerHeight / originalHeight);
		}
		else{
			this.background.w.v = containerWidth;
			// scale the height of background, to keep the aspect ratio
			this.background.h.v = originalHeight * (containerWidth / originalWidth);
		}
		// center the background
		this.background.x.v = containerWidth/2 - this.background.w.v/2;
		this.background.y.v = containerHeight/2 - this.background.h.v/2;
	}

	update(timeStamp?: number){
		if(this.player.x.v > this.container.offsetWidth - this.player.w.v){
			this.player.x.v = this.container.offsetWidth - this.player.w.v;
		}
		if(this.player.x.v < 0){
			this.player.x.v = 0;
		}
		if(this.player.y.v > this.container.offsetHeight - this.player.h.v){
			this.player.y.v = this.container.offsetHeight - this.player.h.v;
		}
		if(this.player.y.v < 0){
			this.player.y.v = 0;
		}
		if(timeStamp !== undefined && timeStamp - this.timeStamp < 500){
			requestAnimationFrame(this.update.bind(this));
			return;
		}
		if(this.player.blood > 0){
			let level = ~~Math.log2(score/16+1) + 1;
			if(level >= 5){
				level = 5;
			}

			let index = ~~(1 / (Math.random() * (level)/(level+1) + 1/(level+1))) - 1;
			if (this.boss >= 2 && index === 4) {
				index = 3;
			}
			
			this.generateEnemy(index);
			
			this.timeStamp = timeStamp ?? 0;
			requestAnimationFrame(this.update.bind(this));
		}
	}

	generateEnemy(enemyIndex:number = 1){
		if(enemyIndex < 0) enemyIndex = 0;
		if(enemyIndex > poTATo.length-1) enemyIndex = poTATo.length - 1;
		let enemyClass = poTATo[enemyIndex];
		let enemy = new enemyClass(
			undefined,
			new P(Math.random() * 100, 'width'),
			new P(-8, 'height'),
			new P(6, 'height'),
			new P(6, 'height'),
			this.player
		)
		enemy.vy = 0.1;
		enemy.ay = 0.01;
		this.layers.play.addComponent(enemy);
		if(enemyIndex === 4){
			this.boss++;
		}
	}
}
