interface Reference {
	[key: string]: number;
}
let presentRefer:Reference = {
	_ZERO: 0,
};
let textures = {} as {[key: string]: HTMLImageElement};

export function setPresentationReference(name: string, number: number) {
	presentRefer[name] = number;
}

// load texture
export function loadTexture(url:string):HTMLImageElement{
	if(textures[url]){
		return	textures[url];
	}
	let img = new Image();
	img.src = url;
	textures[url] = img;
	return img;
}

export class Percent{
	percent:number;
	reference:string;
	constructor(percent:number, reference:string){
		this.percent = percent;
		this.reference = reference;
	}
	getValue():number{
		return presentRefer[this.reference] * this.percent / 100;
	}
	setValue(value:number){
		this.setPercent(value / presentRefer[this.reference]  * 100);
	}
	setPercent(percent:number){
		this.percent = percent;
	}
	setReference(reference:string){
		// verify if the reference is valid
		if(reference in presentRefer){
			this.reference = reference;
		}
		else{
			throw new Error("reference is not valid");
		}
	}
	// alias
	get v(){
		return this.getValue();
	}
	set v(value:number){
		this.setValue(value);
	}
	get p(){
		return this.percent;
	}
	set p(percent:number){
		this.setPercent(percent);
	}
	set r(reference:string){
		this.setReference(reference);
	}
}

interface Motion {
	[key: string]: (time: number, direction: [x:number,y:number]) => [vx: number, vy: number];
}
export const motion:Motion = {
 
	linear: (time, direction) => {
		return [direction[0], direction[1]];
	},
	accelerate: (time, direction) => {
		return [direction[0] * time / 50, direction[1] * time / 50];
	},
	zigzag: (time, direction) => {
		let vx = 3 * direction[0];
		let vy = direction[1] * time / 500;
		
		if((~~(time / 40)) % 2 === 0){
			vx = -vx;
		}
		
		return [vx, vy];
	},
	sinusoidal: (time, direction) => {
		let vx = direction[0] * time;
		let vy = direction[1];
		let angle = (time / 100) * Math.PI / 2;
		vx =  Math.cos(angle);
		// console.log(vx);
		
		// vy = vx * Math.sin(angle) + vy * Math.cos(angle);
		
		
		return [vx, vy];
	},
	static: (time, direction) => {
		if(time < 200){
			return [direction[0], direction[1]];
		}
		else{
			return [0, 0];
		}

	}
	// zigzag: (time, direction) => {
	// 	return [Math.sin(time / 1000), 1];
	// },
	// sinusoidal: (time, direction) => {
	// 	return [Math.sin(time / 1000), Math.cos(time / 1000)];
	// },
	// parabolic: (time, direction) => {
};


export const ZERO = new Percent(0, "_ZERO");