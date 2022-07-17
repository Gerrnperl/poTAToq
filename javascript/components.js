import { loadTexture, Percent, ZERO, motion } from "./utils.js";
import { addScore, changeBlood, game, gameOver } from "./index.js";
let P = Percent;
export class Layer {
    constructor(width, height, layer = 0) {
        this.components = [];
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.style.zIndex = layer.toString();
        this.canvas = canvas;
        let ctx = canvas.getContext('2d');
        if (ctx) {
            this.ctx = ctx;
        }
        else {
            throw new Error('canvas context is not valid');
        }
        this.update();
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    resize(width, height) {
        var _a;
        let ctx = this.ctx;
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        (_a = this.canvas.parentElement) === null || _a === void 0 ? void 0 : _a.replaceChild(canvas, this.canvas);
        let newCtx = canvas.getContext('2d');
        if (newCtx) {
            this.ctx = newCtx;
        }
        else {
            throw new Error('canvas context is not valid');
        }
        this.ctx.drawImage(ctx.canvas, 0, 0);
        this.canvas = canvas;
    }
    addComponent(component) {
        this.components.push(component);
        component.layer = this;
    }
    revokeComponent(component) {
        let index = this.components.indexOf(component);
        if (index > -1) {
            this.components.splice(index, 1);
        }
    }
    update() {
        this.clear();
        this.checkCollision();
        this.components.forEach(component => {
            component.update();
            component.draw(this.ctx);
        });
        requestAnimationFrame(() => {
            this.update();
        });
    }
    getOverlaps(axis) {
        let len = axis === 'x' ? 'w' : 'h';
        let sorted = [].concat(...this.components).sort((a, b) => {
            return a[axis].v - b[axis].v;
        });
        let overlaps = [];
        for (let i = 0; i < sorted.length; i++) {
            let component = sorted[i];
            let start = component[axis].v;
            let length = component[len].v;
            for (let j = i + 1; j < sorted.length; j++) {
                if (sorted[j].className.split('-')[0] === component.className.split('-')[0]) {
                    continue;
                }
                let other = sorted[j];
                let otherStart = other[axis].v;
                let otherLength = other[len].v;
                if (otherStart > start + length) {
                    break;
                }
                if (otherStart + otherLength > start) {
                    overlaps.push(`${this.components.indexOf(sorted[i])}-${this.components.indexOf(sorted[j])}`);
                }
            }
        }
        return overlaps;
    }
    checkCollision() {
        let overlapsX = this.getOverlaps('x');
        let overlapsY = this.getOverlaps('y');
        overlapsX.forEach(overlap => {
            var _a, _b;
            let [a, b] = overlap.split('-');
            if (overlapsY.indexOf(`${a}-${b}`) > -1 && this.components[+a] && this.components[+b]) {
                this.components[+a].onCollision(this.components[+b]);
                (_a = this.components[+b]) === null || _a === void 0 ? void 0 : _a.onCollision(this.components[+a]);
            }
            else if (overlapsY.indexOf(`${b}-${a}`) > -1 && this.components[+a] && this.components[+b]) {
                this.components[+b].onCollision(this.components[+a]);
                (_b = this.components[+a]) === null || _b === void 0 ? void 0 : _b.onCollision(this.components[+b]);
            }
        });
    }
}
export class GameComponent {
    constructor(className, texture, x = ZERO, y = ZERO, w = new P(texture.width, 'width'), h = new P(texture.height, 'height')) {
        this.x = x;
        this.y = y;
        this.w = w !== null && w !== void 0 ? w : texture.width;
        this.h = h !== null && h !== void 0 ? h : texture.height;
        this.className = className;
        this.texture = texture;
    }
    update() {
        return;
    }
    draw(ctx) {
        ctx.drawImage(this.texture, this.x.v, this.y.v, this.w.v, this.h.v);
    }
    revoke() {
        var _a;
        (_a = this.layer) === null || _a === void 0 ? void 0 : _a.revokeComponent(this);
    }
    onCollision(other) {
        console.log(`${this.className} collided with ${other.className}`);
        return;
    }
}
export class StaticComponent extends GameComponent {
    constructor(className, texture, x = ZERO, y = ZERO, w = new P(texture.width, 'width'), h = new P(texture.height, 'height')) {
        super(className, texture, x, y, w, h);
    }
}
export class DynamicComponent extends GameComponent {
    constructor(className, texture, x = ZERO, y = ZERO, w = new P(texture.width, 'width'), h = new P(texture.height, 'height'), vx = 0, vy = 0, ax = 0, ay = 0, motionFunction) {
        super(className, texture, x, y, w, h);
        this.time = 0;
        this.vx = vx;
        this.vy = vy;
        this.ax = ax;
        this.ay = ay;
        if (motionFunction) {
            this.motionFunction = motionFunction;
        }
    }
    update() {
        this.x.v += this.vx;
        this.y.v += this.vy;
        this.time++;
        if (this.motionFunction) {
            let [vx, vy] = this.motionFunction(this.time);
            this.vx = vx;
            this.vy = vy;
        }
        else {
            this.vx += this.ax;
            this.vy += this.ay;
        }
    }
}
class Bullet extends DynamicComponent {
    constructor(className, texture, from, attack, x = ZERO, y = ZERO, w = new P(texture.width, 'width'), h = new P(texture.height, 'height'), vx = 0, vy = 0, ax = 0, ay = 0, rotation = 0) {
        super(className, texture, x, y, w, h, vx, vy, ax, ay);
        this.from = from;
        this.attack = attack;
        this.rotation = rotation;
    }
    update() {
        var _a, _b;
        super.update();
        if (!this.layer) {
            this.revoke();
            return;
        }
        if (this.x.v > ((_a = this.layer) === null || _a === void 0 ? void 0 : _a.canvas.width) || this.x.v < 0 || this.y.v > ((_b = this.layer) === null || _b === void 0 ? void 0 : _b.canvas.height) || this.y.v < 0) {
            this.revoke();
        }
    }
    draw(ctx) {
        if (this.rotation) {
            ctx.translate(this.x.v, this.y.v);
            ctx.rotate(this.rotation);
            ctx.drawImage(this.texture, 0, 0, this.w.v, this.h.v);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        else {
            super.draw(ctx);
        }
    }
    onCollision(other) {
        if (other && other.className !== this.from) {
            this.revoke();
        }
    }
}
export class Character extends DynamicComponent {
    constructor(className, texture, bulletTexture, blood = Infinity, shootInterval = 150, x = ZERO, y = ZERO, w = new P(texture.width, 'width'), h = new P(texture.height, 'height'), vx = 0, vy = 0, ax = 0, ay = 0, motionFunction) {
        super(className, texture, x, y, w, h, vx, vy, ax, ay, motionFunction);
        this.shootStamp = [];
        this.blood = blood;
        this.bulletTexture = bulletTexture;
        this.className = className;
    }
    shoot(w, h, vx, vy, ax = 0, ay = 0, offsetX = 0, offsetY = 0, rotation = 0) {
        var _a;
        let startX = new P(0, 'width');
        let startY = new P(0, 'height');
        startX.v = this.x.v + this.w.v / 2 + offsetX;
        startY.v = this.y.v + this.h.v / 2 + offsetY;
        let bullet = new Bullet(this.className + '-bullet', this.bulletTexture, this.className, 5, startX, startY, w, h, vx, vy, ax, ay, rotation);
        (_a = this.layer) === null || _a === void 0 ? void 0 : _a.addComponent(bullet);
    }
    revoke() {
        super.revoke();
        this.shootStamp.forEach(stamp => {
            clearInterval(stamp);
        });
    }
    onCollision(other) {
        if (!other) {
            return;
        }
        let otherClass = other.className.split('-')[0];
        let otherKind = other.className.split('-')[1];
        if (otherClass === this.className) {
            return;
        }
        if (otherKind === 'bullet') {
            this.blood -= other.attack;
            if (this.vy * this.ay > 0) {
                this.vy = -this.vy;
            }
            if (this.blood <= 0) {
                if (otherClass === 'player') {
                    addScore(2 ** +this.className.split('-')[1]);
                }
                this.revoke();
            }
            return;
        }
        if (otherClass !== this.className) {
            this.blood -= 10;
            if (this.blood <= 0) {
                this.revoke();
            }
            return;
        }
        this.vy = -this.vy;
    }
}
export class Player extends Character {
    constructor(className, texture, bulletTexture, blood = Infinity, shootInterval = 150, x = ZERO, y = ZERO, w = new P(texture.width, 'width'), h = new P(texture.height, 'height'), vx = 0, vy = 0, ax = 0, ay = 0, motionFunction) {
        super(className, texture, bulletTexture, blood, shootInterval, x, y, w, h, vx, vy, ax, ay, motionFunction);
        this.protection = 50;
        if (bulletTexture !== null) {
            this.shootStamp.push(setInterval(() => {
                this.shoot(new P(1, 'height'), new P(5, 'height'), 0, -1, 0, -4, -15 * (Math.random() - 0.35), -35);
            }, shootInterval));
        }
    }
    onCollision(other) {
        if (this.protection === 0) {
            super.onCollision(other);
            changeBlood(this.blood);
            this.protection = 50;
        }
        console.log(this.blood);
    }
    update() {
        super.update();
        if (this.protection > 0) {
            this.protection--;
        }
    }
    draw(ctx) {
        if ((~~(this.protection / 10)) % 2 === 0) {
            super.draw(ctx);
        }
    }
    revoke() {
        super.revoke();
        gameOver();
    }
}
class Enemy extends Character {
    constructor(className, texture, bulletTexture, blood = 100, x = ZERO, y = ZERO, w = new P(texture.width, 'width'), h = new P(texture.height, 'height'), vx = 0, vy = 0, ax = 0, ay = 0, motionFunction) {
        super(className, texture, bulletTexture, blood, 0, x, y, w, h, vx, vy, ax, ay, motionFunction);
    }
    update() {
        var _a, _b;
        super.update();
        if (!this.layer) {
            this.revoke();
            return;
        }
        if (this.x.v > ((_a = this.layer) === null || _a === void 0 ? void 0 : _a.canvas.width) + 100 || this.x.v < -100 || this.y.v > ((_b = this.layer) === null || _b === void 0 ? void 0 : _b.canvas.height)) {
            this.revoke();
        }
    }
    revoke() {
        super.revoke();
    }
}
export const poTATo = [
    class PoTATo1 extends Enemy {
        constructor(blood = 20, x = ZERO, y = ZERO, w, h, player = null) {
            let texture = loadTexture('image/poTATo-1.svg');
            let bulletTexture = null;
            w = w !== null && w !== void 0 ? w : new P(texture.width, 'width');
            h = h !== null && h !== void 0 ? h : new P(texture.height, 'height');
            let motionFunction = (time) => {
                return motion.accelerate(time, [0, 1]);
            };
            super('poTATo-1', texture, bulletTexture, blood, x, y, w, h, 0, 2, 0, 0.05, motionFunction);
        }
    },
    class PoTATo2 extends Enemy {
        constructor(blood = 40, x = ZERO, y = ZERO, w, h, player = null) {
            let texture = loadTexture('image/poTATo-2.svg');
            let bulletTexture = null;
            w = w !== null && w !== void 0 ? w : new P(texture.width, 'width');
            h = h !== null && h !== void 0 ? h : new P(texture.height, 'height');
            let motionFunction = (time) => {
                return motion.sinusoidal(time, [0, 1]);
            };
            super('poTATo-2', texture, bulletTexture, blood, x, y, w, h, 0, 0.1, 0, 0.01, motionFunction);
        }
    },
    class PoTATo3 extends Enemy {
        constructor(blood = 40, x = ZERO, y = ZERO, w, h, player = null) {
            let texture = loadTexture('image/poTATo-3.svg');
            let bulletTexture = null;
            w = w !== null && w !== void 0 ? w : new P(texture.width, 'width');
            h = h !== null && h !== void 0 ? h : new P(texture.height, 'height');
            let xDirection = x.percent > 50 ? 1 : -1;
            let yDirection = Math.random() * 5 + 2.5;
            let motionFunction = (time) => {
                return motion.zigzag(time, [xDirection, yDirection]);
            };
            super('poTATo-3', texture, bulletTexture, blood, x, y, w, h, 0, 0.1, 0, 0.01, motionFunction);
        }
    },
    class PoTATo4 extends Enemy {
        constructor(blood = 80, x = ZERO, y = ZERO, w, h, player = null) {
            let texture = loadTexture('image/poTATo-4.svg');
            let bulletTexture = loadTexture('image/poTATo-bullet-1.svg');
            w = w !== null && w !== void 0 ? w : new P(texture.width, 'width');
            h = h !== null && h !== void 0 ? h : new P(texture.height, 'height');
            let start = Math.random();
            x = start > 0.5 ? new P(-6, 'width') : new P(106, 'width');
            let directX = 4 * (Math.random() - 0.5);
            let motionFunction = (time) => {
                return motion.linear(time, [directX, 0.5]);
            };
            super('poTATo-4', texture, bulletTexture, blood, x, y, w, h, 0, 0.1, 0, 0.01, motionFunction);
            if (player) {
                this.shootStamp.push(setInterval(() => {
                    let deltaX = (player === null || player === void 0 ? void 0 : player.x.v) - this.x.v || 1;
                    let deltaY = (player === null || player === void 0 ? void 0 : player.y.v) - this.y.v || 1;
                    let playerDirectionX, playerDirectionY;
                    if (deltaX > deltaY) {
                        playerDirectionX = deltaX / Math.abs(deltaX) * 2;
                        playerDirectionY = deltaY * playerDirectionX / (deltaX) * 2;
                    }
                    else {
                        playerDirectionY = deltaY / Math.abs(deltaY) * 2;
                        playerDirectionX = deltaX * playerDirectionY / (deltaY) * 2;
                    }
                    let angle = Math.atan2(playerDirectionX, -playerDirectionY);
                    this.shoot(new P(2, 'height'), new P(2, 'height'), playerDirectionX, playerDirectionY, playerDirectionX / 100, playerDirectionY / 100, 0, 0, angle);
                }, 1000));
            }
        }
    },
    class PoTATo5 extends Enemy {
        constructor(blood = 160, x = ZERO, y = ZERO, w, h, player = null) {
            let texture = loadTexture('image/poTATo-5.svg');
            let bulletTexture = loadTexture('image/poTATo-bullet-2.svg');
            let xDirection = x.percent > 50 ? 1 : -1;
            let yDirection = Math.random() * 5 + 2.5;
            let motionFunction = (time) => {
                return motion.static(time, [0.2 * (Math.random() - 0.5), 1]);
            };
            super('poTATo-5', texture, bulletTexture, blood, x, y, w, h, 0, 0.1, 0, 0.01, motionFunction);
            this.shootStamp.push(setInterval(() => {
                this.shootRound();
            }, 8000));
            if (player) {
                this.shootStamp.push(setInterval(() => {
                    this.bulletTexture = loadTexture('image/poTATo-bullet-3.svg');
                    let deltaX = (player === null || player === void 0 ? void 0 : player.x.v) - this.x.v || 1;
                    let deltaY = (player === null || player === void 0 ? void 0 : player.y.v) - this.y.v || 1;
                    let playerDirectionX, playerDirectionY;
                    if (deltaX > deltaY) {
                        playerDirectionX = deltaX / Math.abs(deltaX) * 2;
                        playerDirectionY = deltaY * playerDirectionX / (deltaX) * 2;
                    }
                    else {
                        playerDirectionY = deltaY / Math.abs(deltaY) * 2;
                        playerDirectionX = deltaX * playerDirectionY / (deltaY) * 2;
                    }
                    let angle = Math.atan2(playerDirectionX, -playerDirectionY);
                    this.shoot(new P(2, 'height'), new P(2, 'height'), playerDirectionX, playerDirectionY, playerDirectionX / 100, playerDirectionY / 100, 0, 0, angle);
                    this.shoot(new P(2, 'height'), new P(2, 'height'), playerDirectionX * 0.8, playerDirectionY * 0.9, playerDirectionX / 100, playerDirectionY / 100, 0, 0, angle);
                    this.shoot(new P(2, 'height'), new P(2, 'height'), playerDirectionX * 0.7, playerDirectionY * 0.8, playerDirectionX / 100, playerDirectionY / 100, 0, 0, angle);
                }, 2000));
            }
        }
        shootRound() {
            let index = 0;
            let interval = setInterval(() => {
                this.bulletTexture = loadTexture('image/poTATo-bullet-2.svg');
                let angle = index * Math.PI / 12;
                this.shoot(new P(2, 'height'), new P(2, 'height'), Math.cos(angle), Math.sin(angle), Math.cos(angle) / 100, Math.sin(angle) / 100, 0, 0, angle);
                index++;
                if (index > 36) {
                    clearInterval(interval);
                }
            }, 100);
        }
        shoot(w, h, vx, vy, ax = 0, ay = 0, offsetX = 0, offsetY = 0, rotation = 0) {
            var _a;
            let startX = new P(0, 'width');
            let startY = new P(0, 'height');
            startX.v = this.x.v + this.w.v / 2 + offsetX;
            startY.v = this.y.v + this.h.v / 2 + offsetY;
            let bullet = new Bullet(this.className + '-bullet', this.bulletTexture, this.className, 5, startX, startY, w, h, vx, vy, ax, ay, rotation);
            (_a = this.layer) === null || _a === void 0 ? void 0 : _a.addComponent(bullet);
        }
        revoke() {
            super.revoke();
            game.boss--;
        }
    },
];
//# sourceMappingURL=components.js.map