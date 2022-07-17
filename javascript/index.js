var _a;
import { Game } from "./game.js";
let container = document.querySelector("#container");
container.innerHTML = '';
if (!container) {
    throw new Error("container is not found");
}
let uiMenu = document.querySelector("#ui-menu");
let uiPlayer = document.querySelector("#ui-play");
let start = document.querySelector("#start");
let scorePanel = document.querySelector("#score");
let bloodPanel = document.querySelector("#blood");
let uiGameOver = document.querySelector("#ui-gameover");
(_a = uiGameOver === null || uiGameOver === void 0 ? void 0 : uiGameOver.querySelector("#restart")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
    location.reload();
});
export let score = 0;
export function addScore(value) {
    score += value;
    scorePanel.innerText = score.toString();
}
export function changeBlood(value) {
    let text = "";
    for (let i = 0; i < value; i += 10) {
        text += "❤";
    }
    bloodPanel.innerText = text;
}
export let game = new Game(container, new Promise((resolve, reject) => {
    start.addEventListener("click", () => {
        uiMenu.style.display = "none";
        uiPlayer.style.display = "flex";
        resolve(1);
    });
}));
export function gameOver() {
    uiGameOver.style.display = "flex";
    uiPlayer.style.display = "none";
    uiMenu.style.display = "none";
    uiGameOver.querySelector("#final-score").innerHTML = score.toString();
}
//# sourceMappingURL=index.js.map