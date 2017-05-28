export default class Hud {

    constructor (box) {
        this.muted = false;
        this.box = box;
        this.style = {
            prefix : '<div class="argument">',
            suffix : '</div>',
            space : ''
        }
    }

    display () {

        if (this.muted) { return; }

        this.box.innerHTML = this.wrap( arguments[0] );

        for (var i=1;i<arguments.length;i++) {
            this.box.innerHTML += this.style.space + this.wrap( arguments[i] );
        }

    }
    appendToDisplay () {

        if (this.muted) { return; }

        for (var i=0;i<arguments.length;i++) {
            this.box.innerHTML += this.style.space + this.wrap( arguments[i] );
        }

    }
    wrap (msg) {

        return this.style.prefix + msg + this.style.suffix;

    }
    clear () {

        this.box.innerHTML = null;

    }
    position (left,top) {

        var style = this.box.style
        style.left = left || style.left;
        style.top = top || style.top;

    }

}
