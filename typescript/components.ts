import { loadTexture, Percent, ZERO, motion } from "./utils.js";
import { addScore,changeBlood,game,gameOver } from "./index.js";

// alias
let P = Percent;

export class Layer{
	canvas:HTMLCanvasElement;
	ctx:CanvasRenderingContext2D;
	components:GameComponent[] = [];
	constructor(width:number,height:number,layer:number=0){
		let canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		canvas.style.zIndex = layer.toString();
		this.canvas = canvas;
		let ctx = canvas.getContext('2d');
		// check if the context is valid
		if(ctx){
			this.ctx = ctx;
		}
		else{
			throw new Error('canvas context is not valid');
		}
		this.update();
	}
	// clear the canvas
	clear(){
		this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
	}
	resize(width:number, height:number){
		let ctx = this.ctx;
		let canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		// replace the old canvas
		this.canvas.parentElement?.replaceChild(canvas,this.canvas);
		let newCtx = canvas.getContext('2d');

		if(newCtx){
			this.ctx = newCtx;
		}
		else{
			throw new Error('canvas context is not valid');
		}
		// copy the old ctx to the new canvas
		this.ctx.drawImage(ctx.canvas,0,0);
		this.canvas = canvas;
	}
	addComponent(component:GameComponent){
		this.components.push(component);
		component.layer = this;
	}
	revokeComponent(component:GameComponent){
		let index = this.components.indexOf(component);
		if(index>-1){
			this.components.splice(index,1);
		}
	}
	update(){
		this.clear();
		this.checkCollision();
		this.components.forEach(component=>{
			component.update();
			component.draw(this.ctx);
		});
		requestAnimationFrame(()=>{
			this.update();
		});
	}

	// check the Overlaps on axis
	getOverlaps(axis: 'x' | 'y'): string[]{
		let len:'w'|'h' = axis==='x' ? 'w' : 'h';
		let sorted = (<GameComponent[]>[]).concat(...this.components).sort((a,b)=>{
			return a[axis].v - b[axis].v;
		});
		let overlaps = [];
		
		for(let i=0;i<sorted.length;i++){
			let component = sorted[i];
			let start = component[axis].v;
			let length = component[len].v;
			// check the following other components until the other component's x > x + width
			for(let j=i+1;j<sorted.length;j++){
				if(sorted[j].className.split('-')[0]===component.className.split('-')[0]){
					continue;
				}
				let other = sorted[j];
				let otherStart = other[axis].v;
				let otherLength = other[len].v;
				if(otherStart > start + length){
					break;
				}
				if(otherStart + otherLength > start){
					overlaps.push(`${this.components.indexOf(sorted[i])}-${this.components.indexOf(sorted[j])}`);
				}
			}
		}
		return overlaps;
	}

	checkCollision(){
		// use the sweep and prune algorithm to check the collision

		// check the overlaps on x axis
		let overlapsX = this.getOverlaps('x');
		// check the overlaps on y axis
		let overlapsY = this.getOverlaps('y');

		// check the overlaps on the two overlaps
		// if a component group existed in the two overlaps, then it is a collision
		overlapsX.forEach(overlap=>{
			let [a,b] = overlap.split('-');
			if(overlapsY.indexOf(`${a}-${b}`)>-1 && this.components[+a] && this.components[+b]){
				this.components[+a].onCollision(this.components[+b]);
				this.components[+b]?.onCollision(this.components[+a]);
			}
			else if(overlapsY.indexOf(`${b}-${a}`)>-1 && this.components[+a] && this.components[+b]){
				this.components[+b].onCollision(this.components[+a]);
				this.components[+a]?.onCollision(this.components[+b]);
			}
		});
	}

}


export class GameComponent{
	x:Percent;
	y:Percent;
	w:Percent;
	h:Percent;

	texture:HTMLImageElement;

	className:string;

	layer:Layer | undefined;

	constructor(
		className: string,
		texture:HTMLImageElement,
		x:Percent=ZERO,
		y:Percent=ZERO,
		w:Percent=new P(texture.width, 'width'),
		h:Percent=new P(texture.height, 'height')
	){
		this.x = x;
		this.y = y;
		this.w = w ?? texture.width;
		this.h = h ?? texture.height;
		this.className = className;
		this.texture = texture;
	}
	// update the component
	update(){
		return;
	}
	// draw the component
	draw(ctx: CanvasRenderingContext2D){
		ctx.drawImage(this.texture,this.x.v,this.y.v,this.w.v,this.h.v);
		// ctx.strokeStyle = 'red';
		// ctx.strokeRect(this.x.v,this.y.v,this.w.v,this.h.v);
	}
	// revoke the component
	revoke(){
		this.layer?.revokeComponent(this);
	}
	onCollision(other:GameComponent){
		console.log(`${this.className} collided with ${other.className}`);
		
		return;
	}
}

export class StaticComponent extends GameComponent{
	constructor(
		className: string,
		texture:HTMLImageElement,
		x:Percent=ZERO,
		y:Percent=ZERO,
		w:Percent=new P(texture.width, 'width'),
		h:Percent=new P(texture.height, 'height')
	){
		super(className,texture,x,y,w,h);
	}
}

export class DynamicComponent extends GameComponent{
	// velocity of the component
	vx:number;
	vy:number;

	// acceleration of the component
	ax:number;
	ay:number;

	time:number = 0;

	motionFunction?:(time:number)=>[vx:number,vy:number];

	/**
	 * 
	 * @param motionFunction if provided, the ax and ay will be ignored
	 */
	constructor(
		className: string,
		texture:HTMLImageElement,
		x:Percent=ZERO,
		y:Percent=ZERO,
		w:Percent=new P(texture.width, 'width'),
		h:Percent=new P(texture.height, 'height'),
		vx:number=0,
		vy:number=0,
		ax:number=0,
		ay:number=0,
		motionFunction?:(time:number)=>[vx:number,vy:number]
	){
		super(className,texture,x,y,w,h);
		this.vx = vx;
		this.vy = vy;
		this.ax = ax;
		this.ay = ay;
		if(motionFunction){
			this.motionFunction = motionFunction;
		}
	}
	// update the component
	update(){
		this.x.v += this.vx;
		this.y.v += this.vy;
		this.time++;
		if(this.motionFunction){
			let [vx,vy] = this.motionFunction(this.time);
			this.vx = vx;
			this.vy = vy;
		}
		else{
			this.vx += this.ax;
			this.vy += this.ay;
		}
	}
}

class Bullet extends DynamicComponent{
	from: string;
	attack: number;
	rotation: number;
	constructor(
		className: string,
		texture:HTMLImageElement,
		from: string,
		attack:number,
		x:Percent=ZERO,
		y:Percent=ZERO,
		w:Percent=new P(texture.width, 'width'),
		h:Percent=new P(texture.height, 'height'),
		vx:number=0,
		vy:number=0,
		ax:number=0,
		ay:number=0,
		rotation:number=0,
	){
		super(className,texture,x,y,w,h,vx,vy,ax,ay);
		this.from = from;
		this.attack = attack;
		this.rotation = rotation;
	}

	update(): void {
		super.update();
		if(!this.layer){
			this.revoke();
			return;
		}
		if(this.x.v > this.layer?.canvas.width || this.x.v < 0 || this.y.v > this.layer?.canvas.height || this.y.v < 0){
			this.revoke();
		}
	}

	draw(ctx: CanvasRenderingContext2D): void {
		if(this.rotation){
			// rotate the context, make the image head to player
			ctx.translate(this.x.v, this.y.v);
			ctx.rotate(this.rotation);
			ctx.drawImage(this.texture,0,0,this.w.v,this.h.v);
			ctx.setTransform(1, 0, 0, 1, 0, 0);
		}
		else{
			super.draw(ctx);
		}
	}

	onCollision(other: GameComponent): void {
		if(other && other.className !== this.from){
			this.revoke();
		}
	}
	
}

export class Character extends DynamicComponent{
	blood:number;
	bulletTexture:HTMLImageElement | null;
	className: string;
	shootStamp: number[] = [];
	constructor(
		className: string,
		texture:HTMLImageElement,
		bulletTexture: HTMLImageElement | null,
		blood:number=Infinity,
		shootInterval:number=150,
		x:Percent=ZERO,
		y:Percent=ZERO,
		w:Percent=new P(texture.width, 'width'),
		h:Percent=new P(texture.height, 'height'),
		vx:number=0,
		vy:number=0,
		ax:number=0,
		ay:number=0,
		motionFunction?:(time:number)=>[vx:number,vy:number]
	){
		super(className,texture,x,y,w,h,vx,vy,ax,ay,motionFunction);
		this.blood = blood;
		this.bulletTexture = bulletTexture;
		this.className = className;
	}
	shoot(w:Percent, h:Percent, vx: number,vy: number, ax: number=0,ay: number=0, offsetX:number=0, offsetY:number=0, rotation:number=0): void {
		let startX = new P(0, 'width');
		let startY = new P(0, 'height');
		startX.v = this.x.v + this.w.v/2 + offsetX;
		startY.v = this.y.v + this.h.v/2 + offsetY;
		let bullet = new Bullet(this.className + '-bullet',this.bulletTexture!,this.className,5,startX,startY,w,h,vx,vy,ax,ay,rotation);
		this.layer?.addComponent(bullet);
	}
	revoke(): void {
		super.revoke();
		this.shootStamp.forEach(stamp => {
			clearInterval(stamp);
		});
	}
	onCollision(other: GameComponent): void {
		if (!other) {
			return;
		}
		let otherClass = other.className.split('-')[0];
		let otherKind = other.className.split('-')[1];
		if(otherClass === this.className){
			return;
		}
		if(otherKind === 'bullet'){
			this.blood-= (<Bullet>other).attack;
			if(this.vy * this.ay > 0){
				this.vy = -this.vy;
			}
			if(this.blood <= 0){
				if(otherClass === 'player'){
					addScore(2 ** +this.className.split('-')[1]);
				}
				this.revoke();
			}
			return;
		}
		if (otherClass !== this.className) {
			this.blood -= 10;
			if(this.blood <= 0){
				this.revoke();
			}
			return;
		}
		this.vy = -this.vy;
	}
}

export class Player extends Character{
	protection: number = 50;
	constructor(
		className: string,
		texture:HTMLImageElement,
		bulletTexture: HTMLImageElement | null,
		blood:number=Infinity,
		shootInterval:number=150,
		x:Percent=ZERO,
		y:Percent=ZERO,
		w:Percent=new P(texture.width, 'width'),
		h:Percent=new P(texture.height, 'height'),
		vx:number=0,
		vy:number=0,
		ax:number=0,
		ay:number=0,
		motionFunction?:(time:number)=>[vx:number,vy:number]
	){
		super(className,texture,bulletTexture,blood,shootInterval,x,y,w,h,vx,vy,ax,ay,motionFunction);

		if(bulletTexture !== null){
			this.shootStamp.push(setInterval(()=>{
				this.shoot(new P(1, 'height'), new P(5, 'height'), 0 , -1, 0, -4, -15 * (Math.random()-0.35), -35);
			}, shootInterval));
		}
	}
	onCollision(other: GameComponent): void {
		if(this.protection===0){
			super.onCollision(other);
			changeBlood(this.blood);
			this.protection = 50;
		}
		console.log(this.blood);
	}

	update(): void {
		super.update();
		if(this.protection > 0){
			this.protection--;
		}
		
	}
	draw(ctx: CanvasRenderingContext2D): void {
		if((~~(this.protection / 10)) % 2 === 0){
			super.draw(ctx);
		}
	}
	revoke(): void {
		super.revoke();
		gameOver();
	}
}


class Enemy extends Character{
	constructor(
		className: string,
		texture:HTMLImageElement,
		bulletTexture: HTMLImageElement | null,
		blood:number=100,
		x:Percent=ZERO,
		y:Percent=ZERO,
		w:Percent=new P(texture.width, 'width'),
		h:Percent=new P(texture.height, 'height'),
		vx:number=0,
		vy:number=0,
		ax:number=0,
		ay:number=0,
		motionFunction?:(time:number)=>[vx:number,vy:number]
	){
		super(className,texture,bulletTexture,blood,0,x,y,w,h,vx,vy,ax,ay,motionFunction);
	}
	update(): void {
		super.update();
		if(!this.layer){
			this.revoke();
			return;
		}
		if(this.x.v > this.layer?.canvas.width + 100 || this.x.v < -100 ||this.y.v > this.layer?.canvas.height){
			this.revoke();
		}
	}
	revoke(): void {
		super.revoke();
	}
}

export const poTATo = [
	class PoTATo1 extends Enemy{
		constructor(
			blood:number=20,
			x:Percent=ZERO,
			y:Percent=ZERO,
			w?:Percent,
			h?:Percent,
			player:Player | null = null,
		){
			let texture = loadTexture('image/poTATo-1.svg');
			let bulletTexture = null;
			w = w ?? new P(texture.width, 'width');
			h = h ?? new P(texture.height, 'height');
			let motionFunction = (time:number)=>{
				return motion.accelerate(time, [0,1]);
			}
			super('poTATo-1',texture,bulletTexture,blood,x,y,w,h,0,2,0,0.05,motionFunction);
		}
	},

	class PoTATo2 extends Enemy{
		constructor(
			blood:number=40,
			x:Percent=ZERO,
			y:Percent=ZERO,
			w?:Percent,
			h?:Percent,
			player:Player | null = null,
		){
			
			let texture = loadTexture('image/poTATo-2.svg');
			let bulletTexture = null;
			w = w ?? new P(texture.width, 'width');
			h = h ?? new P(texture.height, 'height');
			let motionFunction = (time:number)=>{
				return motion.sinusoidal(time, [0, 1]);
			}
			super('poTATo-2',texture,bulletTexture,blood,x,y,w,h,0,0.1,0,0.01,motionFunction);
		}
	},
	class PoTATo3 extends Enemy{
		constructor(
			blood:number=40,
			x:Percent=ZERO,
			y:Percent=ZERO,
			w?:Percent,
			h?:Percent,
			player:Player | null = null,
		){
			
			let texture = loadTexture('image/poTATo-3.svg');
			let bulletTexture = null;
			w = w ?? new P(texture.width, 'width');
			h = h ?? new P(texture.height, 'height');
			let xDirection = x.percent > 50 ? 1 : -1;
			let yDirection = Math.random() * 5 + 2.5;
			let motionFunction = (time:number)=>{
				return motion.zigzag(time, [xDirection, yDirection]);
			}
			super('poTATo-3',texture,bulletTexture,blood,x,y,w,h,0,0.1,0,0.01,motionFunction);
		}
	},
	class PoTATo4 extends Enemy{
		constructor(
			blood:number=80,
			x:Percent=ZERO,
			y:Percent=ZERO,
			w?:Percent,
			h?:Percent,
			player:Player | null = null,
		){
			
			let texture = loadTexture('image/poTATo-4.svg');
			let bulletTexture = loadTexture('image/poTATo-bullet-1.svg');
			w = w ?? new P(texture.width, 'width');
			h = h ?? new P(texture.height, 'height');
			let start =  Math.random();
			x = start > 0.5 ? new P(-6, 'width') : new P(106, 'width');
			let directX = 4 * (Math.random() - 0.5);
			let motionFunction = (time:number)=>{
				return motion.linear(time, [directX, 0.5]);
			}
			super('poTATo-4',texture,bulletTexture,blood,x,y,w,h,0,0.1,0,0.01,motionFunction);
			if(player){
				this.shootStamp.push(setInterval(()=>{
					let deltaX = player?.x.v - this.x.v || 1;
					let deltaY = player?.y.v - this.y.v || 1;
					let playerDirectionX, playerDirectionY;
					if(deltaX > deltaY){
						playerDirectionX = deltaX / Math.abs(deltaX) * 2;
						playerDirectionY = deltaY * playerDirectionX / (deltaX) * 2;
					}
					else{
						playerDirectionY = deltaY / Math.abs(deltaY) * 2;
						playerDirectionX = deltaX * playerDirectionY / (deltaY) * 2;
					}
					
					let angle = Math.atan2(playerDirectionX, -playerDirectionY);
					this.shoot(new P(2, 'height'), new P(2, 'height'), playerDirectionX , playerDirectionY, playerDirectionX / 100, playerDirectionY/100,0 ,0, angle);
				}, 1000));
			}
		}
	},
	class PoTATo5 extends Enemy{
		constructor(
			blood:number=160,
			x:Percent=ZERO,
			y:Percent=ZERO,
			w?:Percent,
			h?:Percent,
			player:Player | null = null,
		){
			
			let texture = loadTexture('image/poTATo-5.svg');
			let bulletTexture = loadTexture('image/poTATo-bullet-2.svg');
			let xDirection = x.percent > 50 ? 1 : -1;
			let yDirection = Math.random() * 5 + 2.5;
			let motionFunction = (time:number)=>{
				return motion.static(time, [0.2*(Math.random()-0.5), 1]);
			}
			super('poTATo-5',texture,bulletTexture,blood,x,y,w,h,0,0.1,0,0.01,motionFunction);
			this.shootStamp.push(setInterval(()=>{
				this.shootRound();
			},8000));
			if(player){
				this.shootStamp.push(setInterval(()=>{
					this.bulletTexture = loadTexture('image/poTATo-bullet-3.svg');
					let deltaX = player?.x.v - this.x.v || 1;
					let deltaY = player?.y.v - this.y.v || 1;
					let playerDirectionX, playerDirectionY;
					if(deltaX > deltaY){
						playerDirectionX = deltaX / Math.abs(deltaX) * 2;
						playerDirectionY = deltaY * playerDirectionX / (deltaX) * 2;
					}
					else{
						playerDirectionY = deltaY / Math.abs(deltaY) * 2;
						playerDirectionX = deltaX * playerDirectionY / (deltaY) * 2;
					}
					let angle = Math.atan2(playerDirectionX, -playerDirectionY);
					this.shoot(new P(2, 'height'), new P(2, 'height'), playerDirectionX , playerDirectionY, playerDirectionX / 100, playerDirectionY/100,0 ,0, angle);
					this.shoot(new P(2, 'height'), new P(2, 'height'), playerDirectionX*0.8 , playerDirectionY * 0.9, playerDirectionX / 100, playerDirectionY/100,0 ,0, angle);
					this.shoot(new P(2, 'height'), new P(2, 'height'), playerDirectionX*0.7 , playerDirectionY * 0.8, playerDirectionX / 100, playerDirectionY/100,0 ,0, angle);
					}, 2000));
			}
		}
		shootRound(){
			let index = 0;
			let interval = setInterval(()=>{
				this.bulletTexture = loadTexture('image/poTATo-bullet-2.svg');
				let angle = index * Math.PI / 12;
				this.shoot(new P(2, 'height'), new P(2, 'height'), Math.cos(angle), Math.sin(angle), Math.cos(angle) / 100, Math.sin(angle) / 100,0 ,0, angle);
				index++;
				if(index > 36){
					clearInterval(interval);
				}
			},100);
		}
		shoot(w:Percent, h:Percent, vx: number,vy: number, ax: number=0,ay: number=0, offsetX:number=0, offsetY:number=0, rotation:number=0): void {
			let startX = new P(0, 'width');
			let startY = new P(0, 'height');
			startX.v = this.x.v + this.w.v/2 + offsetX;
			startY.v = this.y.v + this.h.v/2 + offsetY;
			let bullet = new Bullet(this.className + '-bullet',this.bulletTexture!,this.className,5,startX,startY,w,h,vx,vy,ax,ay,rotation);
			this.layer?.addComponent(bullet);
		}
		revoke(): void {
			super.revoke();
			game.boss--;
		}
	},
];

