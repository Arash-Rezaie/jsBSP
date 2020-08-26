cssInteriorGap = 1;
triggerGap = 40;
frmGap = 2;
bspLayouts = Array();

function findNearestNode(lookUpside, startElm, checker) {
    let tmp = startElm;
    try {
        if (lookUpside === true) {//search upside
            while (!checker(tmp = tmp.parentElement)) ;
            return tmp;
        } else if (lookUpside === false) {//search downside
            let kids = tmp.children;
            for (let k in kids) {
                let res = checker(kids[k]) ? kids[k] : findNearestNode(lookUpside, kids[k], checker);
                if (res != null) {
                    return res;
                }
            }
        }
    } catch (e) {

    }
    return null;
}

function setCursor(cursor) {
    document.body.style.cursor = cursor;
}

function removeClassStyle(element, clsName) {
    element.className = element.className.replace(new RegExp('\\b' + clsName + '\\b'), "").replace('  ', '');
}

function addClassStyle(element, clsName) {
    let arr = element.className.split(" ");
    if (arr.indexOf(clsName) === -1) {
        element.className += " " + clsName;
    }
}

class EventBroadcaster {
    static bspEvents = document.createEvent("MouseEvent");
    static activeMouseEventHandler;
    static activeLayoutManager;

    static initEventBroadcaster() {
        EventBroadcaster.createEventBroadcaster();
        EventBroadcaster.initBspLayouts();
    }

    static createEventBroadcaster() {
        EventBroadcaster.bspEvents.initEvent('bsp.events', true, true);
        EventBroadcaster.bspEvents.setSrc = function (elm) {
            this.eventSource = elm;
            return this;
        };
        EventBroadcaster.bspEvents.getSrc = function () {
            return this.eventSource;
        };
    }

    static initBspLayouts() {
        let views = document.getElementsByClassName('bspLayoutManager');
        for (let i = 0; i < views.length; i++) {
            let lm = new LayoutManager(views[i]);

            lm.insertFrame(new Frame().setAll(0, lm.frmContainerElm.clientWidth - 4 * cssInteriorGap, lm.frmContainerElm.clientHeight - 4 * cssInteriorGap, 0));
            bspLayouts[lm.id] = lm;
        }
    }

    static registerMouseMoveEvent() {
        document.addEventListener('mousemove', EventBroadcaster.onFrmMouseMoveHandler, true);
        document.addEventListener('mouseup', EventBroadcaster.onFrmMouseUpHandler, true);
    }

    static unregisterMouseMoveEvent() {
        document.removeEventListener('mousemove', EventBroadcaster.onFrmMouseMoveHandler, true);
        document.removeEventListener('mouseup', EventBroadcaster.onFrmMouseUpHandler, true);
    }

    static cleanUp() {
        EventBroadcaster.activeMouseEventHandler = null;
        EventBroadcaster.unregisterMouseMoveEvent();
        setCursor('auto');
    }

    static onFrmMouseDownHandler(e) {
        try {
            e.preventDefault ? e.preventDefault() : e.returnValue = false;

            let temp = findNearestNode(true, e.getSrc(), elm => elm.className === 'bspLayoutManager');
            EventBroadcaster.activeLayoutManager = bspLayouts[temp.id];

            temp = findNearestNode(true, e.getSrc(), elm => elm.className === 'frame');
            EventBroadcaster.activeMouseEventHandler = new FrmCornerHandler(EventBroadcaster.activeLayoutManager.frames[temp.id]);

            EventBroadcaster.registerMouseMoveEvent();
        } catch (ex) {
            EventBroadcaster.cleanUp();
        }
    }

    static onFrmMouseMoveHandler(e) {
        try {
            e.preventDefault ? e.preventDefault() : e.returnValue = false;
            let rect = EventBroadcaster.activeLayoutManager.element.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            if (x < 0 || y < 0)
                throw  'out of context';
            EventBroadcaster.activeMouseEventHandler.next(x, y);
        } catch (ex) {
            console.log(ex);
            EventBroadcaster.cleanUp();
        }
    }

    static onFrmMouseUpHandler(e) {
        try {
            e.preventDefault ? e.preventDefault() : e.returnValue = false;
            EventBroadcaster.activeMouseEventHandler.complete();
        } catch (ex) {
            console.log(ex);
        } finally {
            EventBroadcaster.cleanUp();
        }
    }

    static onFrmCtxHandler(e) {
    }
}

window.onload = EventBroadcaster.initEventBroadcaster;


class Container {
    id;
    element;
    top;
    right;
    bottom;
    left;

    constructor() {
        this.id = this.uuid();
    }

    uuid() {
        let dt = new Date().getTime();
        let temp = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return temp;
    }

    htmlToElement(html) {
        let template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }

    setElement(elm) {
        //set element field
        this.element = elm;

        //set id
        this.element.id = this.id;

        //sync sizes
        this.top = this.element.clientTop;
        this.left = this.element.clientLeft;
        this.right = this.element.clientWidth + this.left;
        this.bottom = this.element.clientHeight + this.top;
    }

    appendChild(elm) {
        this.element.appendChild(elm);
    }

    setAll(top, right, bottom, left) {
        this.top = top;
        this.element.style.top = top + 'px';

        this.right = right;
        this.element.style.right = right + 'px';

        this.bottom = bottom;
        this.element.style.bottom = bottom + 'px';

        this.left = left;
        this.element.style.left = left + 'px';

        this.element.style.width = this.getWidth() + 'px';
        this.element.style.height = this.getHeight() + 'px';

        return this;
    }

    setTop(top) {
        this.top = top;
        this.element.style.top = top + 'px';
        this.element.style.height = this.getHeight() + 'px';
        return this;
    }

    setRight(right) {
        this.right = right;
        this.element.style.right = right + 'px';
        this.element.style.width = this.getWidth() + 'px';
        return this;
    }

    setBottom(bottom) {
        this.bottom = bottom;
        this.element.style.bottom = bottom + 'px';
        this.element.style.height = this.getHeight() + 'px';
        return this;
    }

    setLeft(left) {
        this.left = left;
        this.element.style.left = left + 'px';
        this.element.style.width = this.getWidth() + 'px';
        return this;
    }

    getWidth() {
        return this.right - this.left;
    }

    getHeight() {
        return this.bottom - this.top;
    }

    intercept(x, y, offset = 0) {
        return x <= this.right - offset && x >= this.left + offset && y <= this.bottom - offset && y >= this.top + offset;
    }
}

class LayoutManager extends Container {
    frames = [];
    frmContainerElm = null;

    constructor(element) {
        super();
        this.setElement(element);
        this.setAll(this.top, this.right, this.bottom, this.left);//to make all fix
        this.frmContainerElm = this.htmlToElement('<div class="frame-container"></div>');
        this.appendChild(this.frmContainerElm);
    }

    insertFrame(frame) {
        this.frames[frame.id] = frame;
        this.frmContainerElm.appendChild(frame.element);
    }

    removeFrame(frame) {
        delete this.frames[frame.id];
        this.frmContainerElm.removeChild(frame.element);
    }

    findFrameByMousePos(cursorX, cursorY) {
        for (let key in this.frames) {
            if (this.frames[key].intercept(cursorX, cursorY)) {
                return this.frames[key];
            }
        }
        return null;
    }

    findFrameById(id) {
        return this.frames[id];
    }

    findFramesByLine(x0, y0, x1, y1) {
        if (x1 < x0 || (x0 === x1 && y1 < y0)) {
            [x0, x1] = this.#switchValue(x0, x1);
            [y0, y1] = this.#switchValue(y0, y1);
        }
        let m = this.#getSteepness(x0, y0, x1, y1);
        let f = this.#getLineFormula(m, x0, y0, x1, y1);
        return m <= 1 ? this.#walkOnLine(x0, x1, f) : this.#walkOnLine(y0, y1, f);
    }

    #switchValue(a, b) {
        let c = a;
        a = b;
        b = c;
        return [a, b];
    }

    #getSteepness(x0, y0, x1, y1) {
        //(y-y0)=m(x-x0) => m=(y-y0)/(x-x0);
        return (y1 - y0) / (x1 - x0)
    }

    #getLineFormula(m, x0, y0, x1, y1) {
        //y=m(x-x0)+y0) m<=1 & x=(y-y0)/m+x0 m>1;
        return m <= 1 ? x => m * (x - x0) + y0 : y => (y - y0) / m + x0;
    }

    #walkOnLine(start, end, formula) {
        let result = [];
        for (let i = start; i <= end; i++) {
            let frame = this.findFrameByMousePos(i, formula(i));
            if (frame == null)
                continue;
            result[frame.id] = frame;
            i += frmGap;
        }
        return result;
    }
}

class Frame extends Container {
    container;
    footer;

    constructor() {
        super();
        this.loadElement();
    }

    loadElement() {
        this.setElement(this.htmlToElement(
            '<div class="frame">' +
            '<img src="images/frame-handler.png" style="position: absolute; width: 15px;height: 15px; top: -1px;cursor: crosshair;z-index: 10" ' +
            'onmousedown="EventBroadcaster.onFrmMouseDownHandler(EventBroadcaster.bspEvents.setSrc(this))" ' +
            'oncontextmenu="return EventBroadcaster.onFrmCtxHandler(EventBroadcaster.bspEvents.setSrc(this))">' +
            '<div class="container"></div><div class="footer invisible"></div></div>'));

        this.container = findNearestNode(false, this.element, elm => elm.className === 'container');
        this.footer = findNearestNode(false, this.element, elm => elm.className.search(/\bfooter\b/g) >= 0);
        this.clearContent();
    }

    //remove all children and append this element
    setContent(element) {
        this.clearContent();
        this.container.appendChild(element);
        this.#updateContainerBg();
    }

    //append a child
    appendContent(element) {
        this.container.appendChild(element);
        this.#updateContainerBg();
    }

    removeContent(elm) {
        this.container.removeChild(elm);
        this.#updateContainerBg();
    }

    //clear all children and show empty instead
    clearContent() {
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        this.#updateContainerBg();
    }

    setFooter(element) {
        this.footer.appendChild(element);
        removeClassStyle(this.footer, 'invisible');
    }

    clearFooter(element) {
        this.footer.removeChild(element);
        addClassStyle(this.footer, 'invisible');
    }

    #updateContainerBg() {
        if (this.container.children.length > 0) {
            removeClassStyle(this.container, 'empty');
        } else {
            addClassStyle(this.container, 'empty')
        }
    }
}

class Handler {
    next(x, y) {
    };

    error(e) {
    };

    complete() {
    };

    getBorderWidth(value) {
        let m = value - frmGap;
        return [m, m + 2 * frmGap];
    }

    checkMinimumBoundary(v, frames, field) {
        for (let k = 0; k < frames.length; k++) {
            if (v - frames[k][field] < triggerGap)
                return false;
        }
        return true;
    }

    checkMaximumBoundary(v, frames, field) {
        for (let k = 0; k < frames.length; k++) {
            if (frames[k][field] - v < triggerGap)
                return false;
        }
        return true;
    }

    runBatch(frames, operator) {
        for (let k = 0; k < frames.length; k++) {
            operator(frames[k]);
        }
    }
}

class FrmCornerHandler extends Handler {
    x0;
    y0;
    hostFrame;

    constructor(frame) {
        super();
        this.hostFrame = frame;

        //I can catch x & y from the event, but it will be always 0 as mouse down event comes from the corner of frame, so I have no true location of the mouse
        this.x0 = this.hostFrame.left;
        this.y0 = this.hostFrame.top;

        setCursor('crosshair');
    }


    next(x, y) {
        if (x > this.x0 + triggerGap && y >= this.y0) {
            EventBroadcaster.activeMouseEventHandler = new FrmVDivideHandler(this.hostFrame);
        } else if (x < this.x0 - 2 * frmGap && y >= this.y0) {
            EventBroadcaster.activeMouseEventHandler = new FrmHMergeLeftHandler(null, this.hostFrame);
        } else if (y > this.y0 + triggerGap && x >= this.x0) {
            EventBroadcaster.activeMouseEventHandler = new FrmHDivideHandler(this.hostFrame);
        } else if (y <= this.y0 - 2 * frmGap && x >= this.x0) {
            EventBroadcaster.activeMouseEventHandler = new FrmVMergeUpHandler(null, this.hostFrame);
        }
    }
}

class FrmVDivideHandler extends Handler {
    leftFrame;

    constructor(frame) {
        super();

        this.leftFrame = frame;
    }

    next(x, y) {
        //calculate border
        let values = this.getBorderWidth(x);

        //create a frame
        let rightFrame = new Frame().setAll(this.leftFrame.top, this.leftFrame.right, this.leftFrame.bottom, values[1]);

        //update the current frame
        this.leftFrame.setRight(values[0]);

        //render the new frame
        EventBroadcaster.activeLayoutManager.insertFrame(rightFrame);

        //switch to horizontal move
        EventBroadcaster.activeMouseEventHandler = new FrmHMoveHandler([this.leftFrame], [rightFrame]);
    }
}

class FrmHMoveHandler extends Handler {
    leftFrames;
    rightFrames;

    constructor(leftFrames, rightFrames) {
        super();
        this.leftFrames = leftFrames;
        this.rightFrames = rightFrames;

        setCursor('col-resize')
    }

    next(x, y) {
        if (this.checkMinimumBoundary(x, this.leftFrames, 'left') && this.checkMaximumBoundary(x, this.rightFrames, 'right')) {
            let values = this.getBorderWidth(x);

            this.runBatch(this.leftFrames, f => f.setRight(values[0]));
            this.runBatch(this.rightFrames, f => f.setLeft(values[1]));
        }
    }
}

class FrmHDivideHandler extends Handler {
    topFrame;

    constructor(frame) {
        super();

        this.topFrame = frame;
    }

    next(x, y) {
        //calculate border
        let values = this.getBorderWidth(y);

        //create a frame
        let bottomFrame = new Frame().setAll(values[1], this.topFrame.right, this.topFrame.bottom, this.topFrame.left);

        //update the current frame
        this.topFrame.setBottom(values[0]);

        //render the new frame
        EventBroadcaster.activeLayoutManager.insertFrame(bottomFrame);

        //switch to horizontal move
        EventBroadcaster.activeMouseEventHandler = new FrmVMoveHandler([this.topFrame], [bottomFrame]);
    }
}

class FrmVMoveHandler extends Handler {
    topFrames;
    bottomFrames;

    constructor(topFrames, bottomFrames) {
        super();
        this.topFrames = topFrames;
        this.bottomFrames = bottomFrames;

        setCursor('row-resize')
    }

    next(x, y) {
        if (this.checkMinimumBoundary(y, this.topFrames, 'top') && this.checkMaximumBoundary(y, this.bottomFrames, 'bottom')) {
            let values = this.getBorderWidth(y);

            this.runBatch(this.topFrames, f => f.setBottom(values[0]));
            this.runBatch(this.bottomFrames, f => f.setTop(values[1]));
        }
    }
}

class FrmMergeHandler extends Handler {
    hostFrame;
    guestFrame;
    isPermitted;
    arrowElement;

    constructor(hostFrame, guestFrame) {
        super();

        this.hostFrame = hostFrame;
        this.guestFrame = guestFrame;

        this.init();

        if (this.guestFrame == null)
            throw 'no target found';

        if (!this.#areEdgesEqual()) {
            this.resetSecondView();
            guestFrame = null;
        } else {
            this.prepareSecondViewForMerge();
        }
    }

    complete() {
        if (this.isPermitted) {
            this.executeMerge();
            this.fixNeighbourFrames();
        }
    }

    next(x, y) {
        if (this.guestFrame != null) {
            if (this.guestFrame.intercept(x, y, frmGap)) {
                if (this.isPermitted === false)
                    this.prepareSecondViewForMerge();
            } else {
                if (this.isPermitted === true)
                    this.resetSecondView();
            }
        }
    }

    init() {

    }

    prepareSecondViewForMerge() {
        this.arrowElement = this.guestFrame.htmlToElement('<img src="images/merge-arrow.png" style="height: 100%; width: 100%;"/>')
        this.rotateArrowElement(this.arrowElement);
        if (this.guestFrame != null)
            this.guestFrame.setFooter(this.arrowElement);
        this.updateCursor();
        this.isPermitted = true;
    }

    resetSecondView() {
        setCursor('no-drop');
        if (this.guestFrame != null)
            this.guestFrame.clearFooter(this.arrowElement);
        this.isPermitted = false;
    }

    rotateArrowElement(element) {
    }

    updateCursor() {
    }

    executeMerge() {
    }

    getSharedEdgeLength;

    #areEdgesEqual() {
        return Math.abs(this.getSharedEdgeLength(this.hostFrame) - this.getSharedEdgeLength(this.guestFrame)) < 2 * frmGap;
    }

    fixNeighbourFrames() {
    }
}

class FrmHMergeHandler extends FrmMergeHandler {

    constructor(hostFrame, guestFrame) {
        super(hostFrame, guestFrame);
    }

    init() {
        this.getSharedEdgeLength = frame => frame['top'] - frame['bottom'];
        if (this.guestFrame == null)
            this.guestFrame = EventBroadcaster.activeLayoutManager.findFrameByMousePos(this.hostFrame.left - triggerGap, this.hostFrame.top + triggerGap);
    }

    fixNeighbourFrames() {
        let aboveFrames;
        let belowFrames;
        [aboveFrames, belowFrames] = this.hostFrame.left < this.guestFrame.left ?
            this.#getNeighbourFrames(this.hostFrame, this.guestFrame) :
            this.#getNeighbourFrames(this.guestFrame, this.hostFrame);

        this.runBatch(aboveFrames, f => f.setBottom(this.hostFrame.top - 2 * frmGap));
        this.runBatch(belowFrames, f => f.setTop(this.hostFrame.bottom + 2 * frmGap));
    }

    #getNeighbourFrames(f1, f2) {
        //return [aboveFrames,belowFrames]
        return [
            EventBroadcaster.activeLayoutManager.findFramesByLine(f1.left + frmGap, f1.top - triggerGap, f2.right - frmGap, f2.top - triggerGap),
            EventBroadcaster.activeLayoutManager.findFramesByLine(f1.left + frmGap, f1.bottom + triggerGap, f2.right - frmGap, f2.bottom + triggerGap)
        ];
    }
}

class FrmVMergeHandler extends FrmMergeHandler {
    constructor(hostFrame, guestFrame) {
        super(hostFrame, guestFrame);
    }

    init() {
        this.getSharedEdgeLength = frame => frame['right'] - frame['left'];
        if (this.guestFrame == null)
            this.guestFrame = EventBroadcaster.activeLayoutManager.findFrameByMousePos(this.hostFrame.left + triggerGap, this.hostFrame.top - triggerGap);
    }

    fixNeighbourFrames() {
        let leftFrames;
        let rightFrames;
        [leftFrames, rightFrames] = this.hostFrame.top < this.guestFrame.top ?
            this.#getNeighbourFrames(this.hostFrame, this.guestFrame) :
            this.#getNeighbourFrames(this.guestFrame, this.hostFrame);


        this.runBatch(leftFrames, f => f.setRight(this.hostFrame.left - 2 * frmGap));
        this.runBatch(leftFrames, f => f.setRight(this.hostFrame.right + 2 * frmGap));
    }

    #getNeighbourFrames(f1, f2) {
        //return [leftFrames,rightFrames]
        return [
            EventBroadcaster.activeLayoutManager.findFramesByLine(f1.left - triggerGap, f1.bottom - frmGap, f2.left - triggerGap, f2.top + frmGap),
            EventBroadcaster.activeLayoutManager.findFramesByLine(f1.right + triggerGap, f1.bottom - frmGap, f2.right + triggerGap, f2.top + frmGap)
        ];
    }
}

class FrmHMergeLeftHandler extends FrmHMergeHandler {
    constructor(leftFrame, rightFrame) {
        super(rightFrame, leftFrame);
    }

    rotateArrowElement(element) {
        //no rotate required
    }

    updateCursor() {
        setCursor('w-resize');
    }

    executeMerge() {
        this.hostFrame.setLeft(this.guestFrame.left);
        EventBroadcaster.activeLayoutManager.removeFrame(this.guestFrame);
    }

    next(x, y) {
        super.next(x, y);
        if (x >= this.hostFrame.left)
            EventBroadcaster.activeMouseEventHandler = new FrmHMergeRightHandler(this.guestFrame, this.hostFrame)
    }
}

class FrmHMergeRightHandler extends FrmHMergeHandler {
    constructor(leftFrame, rightFrame) {
        super(leftFrame, rightFrame);
    }

    rotateArrowElement(element) {
        //no rotate required
    }

    updateCursor() {
        setCursor('e-resize');
    }

    executeMerge() {
        this.hostFrame.setRight(this.guestFrame.right);
        EventBroadcaster.activeLayoutManager.removeFrame(this.guestFrame);
    }

    next(x, y) {
        super.next(x, y);
        if (x <= this.hostFrame.right)
            EventBroadcaster.activeMouseEventHandler = new FrmHMergeLeftHandler(this.hostFrame, this.guestFrame);
    }
}

class FrmVMergeUpHandler extends FrmVMergeHandler {
    constructor(aboveFrame, belowFrame) {
        super(belowFrame, aboveFrame);
    }

    rotateArrowElement(element) {
        //no rotate required
    }

    updateCursor() {
        setCursor('n-resize');
    }

    executeMerge() {
        this.hostFrame.setTop(this.guestFrame.top);
        EventBroadcaster.activeLayoutManager.removeFrame(this.guestFrame);
    }

    next(x, y) {
        super.next(x, y);
        if (y >= this.hostFrame.top)
            EventBroadcaster.activeMouseEventHandler = new FrmVMergeDownHandler(this.guestFrame, this.hostFrame)
    }
}

class FrmVMergeDownHandler extends FrmVMergeHandler {
    constructor(aboveFrame, belowFrame) {
        super(aboveFrame, belowFrame);
    }

    rotateArrowElement(element) {
        //no rotate required
    }

    updateCursor() {
        setCursor('s-resize');
    }

    executeMerge() {
        this.hostFrame.setBottom(this.guestFrame.bottom);
        EventBroadcaster.activeLayoutManager.removeFrame(this.guestFrame);
    }

    next(x, y) {
        super.next(x, y);
        if (y <= this.hostFrame.bottom)
            EventBroadcaster.activeMouseEventHandler = new FrmVMergeUpHandler(this.hostFrame, this.guestFrame);
    }
}