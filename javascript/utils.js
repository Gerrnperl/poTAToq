let presentRefer = {
    _ZERO: 0,
};
let textures = {};
export function setPresentationReference(name, number) {
    presentRefer[name] = number;
}
export function loadTexture(url) {
    if (textures[url]) {
        return textures[url];
    }
    let img = new Image();
    img.src = url;
    textures[url] = img;
    return img;
}
export class Percent {
    constructor(percent, reference) {
        this.percent = percent;
        this.reference = reference;
    }
    getValue() {
        return presentRefer[this.reference] * this.percent / 100;
    }
    setValue(value) {
        this.setPercent(value / presentRefer[this.reference] * 100);
    }
    setPercent(percent) {
        this.percent = percent;
    }
    setReference(reference) {
        if (reference in presentRefer) {
            this.reference = reference;
        }
        else {
            throw new Error("reference is not valid");
        }
    }
    get v() {
        return this.getValue();
    }
    set v(value) {
        this.setValue(value);
    }
    get p() {
        return this.percent;
    }
    set p(percent) {
        this.setPercent(percent);
    }
    set r(reference) {
        this.setReference(reference);
    }
}
export const motion = {
    linear: (time, direction) => {
        return [direction[0], direction[1]];
    },
    accelerate: (time, direction) => {
        return [direction[0] * time / 50, direction[1] * time / 50];
    },
    zigzag: (time, direction) => {
        let vx = 3 * direction[0];
        let vy = direction[1] * time / 500;
        if ((~~(time / 40)) % 2 === 0) {
            vx = -vx;
        }
        return [vx, vy];
    },
    sinusoidal: (time, direction) => {
        let vx = direction[0] * time;
        let vy = direction[1];
        let angle = (time / 100) * Math.PI / 2;
        vx = Math.cos(angle);
        return [vx, vy];
    },
    static: (time, direction) => {
        if (time < 200) {
            return [direction[0], direction[1]];
        }
        else {
            return [0, 0];
        }
    }
};
export const ZERO = new Percent(0, "_ZERO");
//# sourceMappingURL=utils.js.map