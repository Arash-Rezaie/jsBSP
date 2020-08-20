const bspEvents = document.createEvent("MouseEvent");
bspEvents.initEvent('bsp.events', true, true);
bspEvents.setSrc = function (elm) {
    this.eventSource = elm;
    return this;
};
bspEvents.getSrc = function () {
    return this.eventSource;
};

class FrmMouseEventHandler {
    x = null;//current mouse x
    y = null;//current mouse y
    x0 = null;//mouse down x
    y0 = null;//mouse down y
    op = null;//operation
    bsp = null;

    start(e) {
        console.log("on mouse down");
        this.x0 = e.clientX;
        this.y0 = e.clientY;
        this.bsp = this.getBspContainer(e, elm => elm.className == 'bspLayoutManager');
        this.registerMouseMoveEvent();
        console.log('mouse down (' + this.x0 + ',' + this.y0 + ')');
    }

    registerMouseMoveEvent() {
        this.bsp.addEventListener('mousemove', onFrmMouseMoveHandler, true);
        this.bsp.addEventListener('mouseup', onFrmMouseUpHandler, true);
    }

    getBspContainer(e, checker) {
        let elm = e.getSrc();
        while (!checker(elm))
            elm = elm.parentElement;
        return elm;
    }

    onMove(e) {
        console.log("on mouse move");
        this.x = e.clientX;
        this.y = e.clientY;

        if (this.op == null) {
            console.log('????? (' + this.x + ',' + this.y + ')');
            this.determineOp();
        } else {
            console.log('.... (' + this.x + ',' + this.y + ')');
            this.op();
        }
    }

    finish() {
        console.log("on mouse up");
        this.bsp.removeEventListener('mousemove', onFrmMouseMoveHandler, true);
        this.bsp.removeEventListener('mouseup', onFrmMouseUpHandler, true);
        mouseEventHandler = null;
    }

    determineOp() {
        let dx = this.x - this.x0;
        let dy = this.y - this.y0;
        const gap = 40;
        if (dx > dy) {
            if (dx > gap) {
                this.op = this.hDivide;
            } else if (dx < -gap) {
                this.op = this.hMerge;
            }
        } else {
            if (dy > gap) {
                this.op = this.vDivide;
            } else if (dy < -gap) {
                this.op = this.vMerge;
            }
        }
    }

    hDivide() {
        console.log('hDivide');
        return null;
    }

    hMerge() {
        console.log('hMerge');
        return null;
    }

    vDivide() {
        console.log('vDivide');
        return null;
    }

    vMerge() {
        console.log('vMerge');
        return null;
    }


}

let mouseEventHandler = null;

function onFrmMouseDownHandler(e) {
    mouseEventHandler = new FrmMouseEventHandler();
    mouseEventHandler.start(e);
}

function onFrmCtxHandler() {
    console.log('right clicked');
    return false;
}

function onFrmMouseMoveHandler(e) {
    mouseEventHandler.onMove(e);
}

function onFrmMouseUpHandler(e) {
    mouseEventHandler.finish(e)
}