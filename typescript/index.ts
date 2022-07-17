import { Game } from "./game.js";

let container = document.querySelector("#container") as HTMLElement;
container.innerHTML = '';
if(!container){
	throw new Error("container is not found");
}


let uiMenu = document.querySelector("#ui-menu") as HTMLElement;
let uiPlayer = document.querySelector("#ui-play") as HTMLElement;
let start = document.querySelector("#start") as HTMLElement;
let scorePanel = document.querySelector("#score") as HTMLElement;
let bloodPanel = document.querySelector("#blood") as HTMLElement;
let uiGameOver = document.querySelector("#ui-gameover") as HTMLElement;

uiGameOver?.querySelector("#restart")?.addEventListener("click", ()=>{
	location.reload();
});

export let score = 0;
export function addScore(value:number){
	score += value;
	scorePanel.innerText = score.toString();
}
export function changeBlood(value:number){
	let text = "";
	for(let i = 0; i < value; i+=10){
		text += "❤";
	}
	bloodPanel.innerText = text;
}


export let game = new Game(container, new Promise((resolve, reject)=>{
	start.addEventListener("click",()=>{
		uiMenu.style.display = "none";
		uiPlayer.style.display = "flex";
		resolve(1);
	});
}));

export function gameOver(){
	uiGameOver.style.display = "flex";
	uiPlayer.style.display = "none";
	uiMenu.style.display = "none";
	uiGameOver.querySelector("#final-score")!.innerHTML = score.toString();
}
