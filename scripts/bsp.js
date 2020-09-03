cssInteriorGap = 1;
triggerGap = 40;
frmGap = 1;
dFrmGap = 2 * frmGap;

function findNearestNode(lookUpside, startElm, checker) {
    let tmp = startElm;
    try {
        if (lookUpside === true) {//search upside
            while (!checker(tmp = tmp.parentElement)) ;
            return tmp;
        } else if (lookUpside === false) {//search downside
            let kids = tmp.children;
            for (let k = kids.length - 1; k >= 0; k--) {
                let res = checker(kids[k]) ? kids[k] : findNearestNode(lookUpside, kids[k], checker);
                if (res != null) {
                    return res;
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
    return null;
}

let lastCursor = '';

function setCursor(cursor) {
    document.body.style.cursor = cursor;
    lastCursor = cursor;
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

class BspLayoutManagerController {
    layoutManager;
    rightFrames;
    minRight = 0;
    minBottom = 0;
    bottomFrames;

    static bspLayouts = Array();
    static onLoadFinished;

    constructor(layoutManager) {
        this.layoutManager = layoutManager;
    }

    getFrames(checker) {
        let result = [];
        for (let k in this.layoutManager.frames)
            if (checker(this.layoutManager.frames[k]))
                result.push(this.layoutManager.frames[k]);
        return result;
    }


    setWidth(value) {
        if (typeof value == 'string')
            value = Number(value);
        if (this.rightFrames == null) {
            let a = this.layoutManager.right - triggerGap;
            this.rightFrames = this.getFrames(f => f.right > a);
            for (let f of this.rightFrames)
                if (this.minRight < f.left)
                    this.minRight = f.left;
            this.minRight += triggerGap + 8 * frmGap;
        }
        let lr = this.layoutManager.left + value;
        if (lr > this.minRight) {
            let r = lr - 7 * frmGap;
            for (let f of this.rightFrames) {
                f.setRight(r);
            }
            this.layoutManager.setRight(lr);
        }
    }

    setHeight(value) {
        if (typeof value == 'string')
            value = Number(value);
        if (this.bottomFrames == null) {
            let a = this.layoutManager.bottom - triggerGap;
            this.bottomFrames = this.getFrames(f => f.bottom > a);
            for (let f of this.bottomFrames)
                if (this.minBottom < f.top)
                    this.minBottom = f.top;
            this.minBottom += triggerGap + 8 * frmGap;
        }
        let lb = this.layoutManager.top + value;
        if (lb > this.minBottom) {
            let b = lb - 7 * frmGap;
            for (let f of this.bottomFrames) {
                f.setBottom(b);
            }
            this.layoutManager.setBottom(lb);
        }
    }

    static init() {
        let views = document.getElementsByClassName('bspLayoutManager');
        for (let i = 0; i < views.length; i++) {
            let lm = new LayoutManager(views[i]);

            let frame = new Frame().setAll(0, lm.frmContainerElm.clientWidth - 4 * cssInteriorGap, lm.frmContainerElm.clientHeight - 4 * cssInteriorGap, 0);
            lm.insertFrame(frame);
            BspLayoutManagerController.bspLayouts[lm.id] = lm;
        }
        EventBroadcaster.initEventBroadcaster();
        if (BspLayoutManagerController.onLoadFinished != null)
            BspLayoutManagerController.onLoadFinished();
    }

    static appendContent(frameAdr, element) {
        let ids = frameAdr.split(':');
        if (ids.length === 2) {
            let lm = BspLayoutManagerController.bspLayouts[ids[0]];
            if (lm != null) {
                let f = lm.frames[ids[1]];
                if (f != null) {
                    f.appendContent(element);
                }
            }
        }
    }

    static removeContent(frameAdr, element) {
        let ids = frameAdr.split(':');
        if (ids.length === 2) {
            let lm = BspLayoutManagerController.bspLayouts[ids[0]];
            if (lm != null) {
                let f = lm.frames[ids[1]];
                if (f != null) {
                    f.removeContent(element);
                }
            }
        }
    }

    static getLayoutManagerById(id) {
        return BspLayoutManagerController.bspLayouts[id];
    }

    getConfigurationObj() {
        let lm = this.layoutManager;
        let obj = {
            id: lm.id,
            top: lm.top,
            right: lm.right,
            bottom: lm.bottom,
            left: lm.left,
            frames: []

        };
        for (let k in lm.frames) {
            let f = lm.frames[k];
            obj.frames.push({
                id: f.id,
                top: f.top,
                right: f.right,
                bottom: f.bottom,
                left: f.left,
            });
        }
        return obj;
    }

    loadFromConfigurationObj(confObj) {
        let lm = this.layoutManager;
        for (let k in lm.frames)
            lm.removeFrame(lm.frames[k]);
        lm.id = confObj.id;
        lm.setTop(confObj.top);
        lm.setRight(confObj.right);
        lm.setBottom(confObj.bottom);
        lm.setLeft(confObj.left);

        for (let f of confObj.frames) {
            lm.insertFrame(new Frame(f.id).setAll(f.top, f.right, f.bottom, f.left));
        }
    }
}

class EventBroadcaster {
    static bspEvents = document.createEvent("MouseEvent");
    static activeMouseEventController;
    static activeLayoutManager;

    static initEventBroadcaster() {
        EventBroadcaster.createEventBroadcaster();
    }

    static createEventBroadcaster() {
        EventBroadcaster.bspEvents.initEvent('bsp.events', true, true);
    }

    static getHandlerElementByFrame(frame) {
        return findNearestNode(false, frame, elm => elm.className === 'handler');
    }

    static registerMouseEventsForFrameBorder(frame) {
        frame.element.addEventListener('mousedown', EventBroadcaster.onFrmMouseDownController, false);
        EventBroadcaster.getHandlerElementByFrame(frame.element).addEventListener('contextmenu', EventBroadcaster.onFrmCtxController, false);
    }

    static unregisterMouseEventsForFrameBorder(frame) {
        frame.element.removeEventListener('mousedown', EventBroadcaster.onFrmMouseDownController, false);
        EventBroadcaster.getHandlerElementByFrame(frame.element).removeEventListener('contextmenu', EventBroadcaster.onFrmCtxController, false);
    }

    static registerMouseMoveEvent() {
        document.addEventListener('mousemove', EventBroadcaster.onFrmMouseMoveController, true);
        document.addEventListener('mouseup', EventBroadcaster.onFrmMouseUpController, true);
    }

    static unregisterMouseMoveEvent() {
        document.removeEventListener('mousemove', EventBroadcaster.onFrmMouseMoveController, true);
        document.removeEventListener('mouseup', EventBroadcaster.onFrmMouseUpController, true);
    }

    static cleanUp() {
        EventBroadcaster.activeMouseEventController = null;
        EventBroadcaster.unregisterMouseMoveEvent();
        setCursor('auto');
    }

    static loadTargetLayoutManager(e) {
        let temp = findNearestNode(true, e.target, elm => elm.className === 'bspLayoutManager');
        EventBroadcaster.activeLayoutManager = BspLayoutManagerController.bspLayouts[temp.id];
    }

    static onFrmMouseDownController(e) {
        try {
            if (e.target.className === 'frame') {
                EventBroadcaster.onFrmBorderMouseDownController(e);
            } else if (e.target.className === 'handler') {
                EventBroadcaster.onFrmIndicatorMouseDownController(e);
            }
        } catch (ex) {
            console.log(ex);
            EventBroadcaster.cleanUp();
        }
    }

    static onFrmIndicatorMouseDownController(e) {
        e.preventDefault ? e.preventDefault() : e.returnValue = false;
        EventBroadcaster.loadTargetLayoutManager(e);
        let frm = findNearestNode(true, e.target, elm => elm.className === 'frame');
        EventBroadcaster.activeMouseEventController = new FrmCornerController(EventBroadcaster.activeLayoutManager.frames[frm.id]);
        EventBroadcaster.registerMouseMoveEvent();
    }

    static onFrmBorderMouseDownController(e) {
        if (e.offsetX <= 0) {
            this.initBorderController(e, 'left');
        } else if (e.offsetY <= 0) {
            this.initBorderController(e, 'top');
        } else if (e.offsetX >= e.currentTarget.clientWidth - 1) {
            this.initBorderController(e, 'right');
        } else if (e.offsetY >= e.currentTarget.clientHeight - 1) {
            this.initBorderController(e, 'bottom');
        }
    }

    static initBorderController(e, edge) {
        let a = 3 * dFrmGap;
        EventBroadcaster.loadTargetLayoutManager(e);
        if (e.clientX > a && e.clientX < EventBroadcaster.activeLayoutManager.right - a &&
            e.clientY > a && e.clientY < EventBroadcaster.activeLayoutManager.bottom - a) {
            e.preventDefault ? e.preventDefault() : e.returnValue = false;
            EventBroadcaster.activeMouseEventController = new FrmBorderController(EventBroadcaster.activeLayoutManager.frames[e.target.id], edge);
            EventBroadcaster.registerMouseMoveEvent();
        }
    }

    static onFrmMouseMoveController(e) {
        try {
            e.preventDefault ? e.preventDefault() : e.returnValue = false;
            let rect = EventBroadcaster.activeLayoutManager.element.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            if (x < 0 || y < 0)
                throw  'out of context';
            EventBroadcaster.activeMouseEventController.next(x, y);
        } catch (ex) {
            EventBroadcaster.activeMouseEventController.error(ex);
            console.log(ex);
            EventBroadcaster.cleanUp();
        }
    }

    static onFrmMouseUpController(e) {
        try {
            e.preventDefault ? e.preventDefault() : e.returnValue = false;
            EventBroadcaster.activeMouseEventController.complete();
        } catch (ex) {
            console.log(ex);
        } finally {
            EventBroadcaster.cleanUp();
        }
    }

    static onFrmCtxController(e) {
        e.preventDefault ? e.preventDefault() : e.returnValue = false;
        let layoutManager = EventBroadcaster.activeLayoutManager;
        if (layoutManager.listener != null) {
            let frm = findNearestNode(true, e.target, elm => elm.className === 'frame');
            layoutManager.listener(layoutManager.id + ':' + frm.id, e.target);
        }
    }
}

window.onload = BspLayoutManagerController.init;

class EdgeTransporter {
    min = -1;
    max = Infinity;
    effectiveEdges = [];
    frame;
    identifiedNeighbours;
    transporterType;

    constructor(frame, identifiedNeighbours = null) {
        this.frame = frame;
        this.identifiedNeighbours = identifiedNeighbours;
        if (this.identifiedNeighbours == null) {
            this.identifiedNeighbours = [];
            this.identifiedNeighbours[frame.id] = frame;
        }
        this.transporterType = this.getTransporterType();
        this.loadNeighbours();
    }

    set(value) {
        if (value >= this.min && value <= this.max) {
            this.update(value);
            this.updateNeighbours(value);
            return true;
        }
        return false;
    }

    updateNeighbours(value) {
        for (let i = this.effectiveEdges.length - 1; i >= 0; i--) {
            this.effectiveEdges[i].set(this.getNeighbourValue(value));
        }
    }

    loadNeighbours() {
        let f = EventBroadcaster.activeLayoutManager.frames;
        this.loadMinOrMax();
        for (let k in f) {
            if (this.identifiedNeighbours[k] == null) {
                if (this.isNeighbour(f[k])) {
                    this.identifiedNeighbours[k] = f[k];
                    let oppositeEdgeTransporter = new this.transporterType(f[k], this.identifiedNeighbours);
                    this.effectiveEdges.push(oppositeEdgeTransporter);
                    this.updateMinAndMax(oppositeEdgeTransporter);
                }
            }
        }
    }

    update(value) {
    }

    isNeighbour(frame) {
    }

    getTransporterType() {
    }

    getNeighbourValue(value) {
    }

    loadMinOrMax() {
    }

    updateMinAndMax(oppositeEdgeTransporter) {
    }
}

class TopEdgeTransporter extends EdgeTransporter {
    constructor(frame, lastTransporter) {
        super(frame, lastTransporter);
    }

    update(value) {
        this.frame.setTop(value);
    }

    getTransporterType() {
        return BottomEdgeTransporter;
    }

    isNeighbour(frame) {
        return frame.bottom <= this.frame.top && frame.bottom >= this.frame.top - triggerGap &&
            (
                (frame.left >= this.frame.left - frmGap && frame.left <= this.frame.right + frmGap) ||
                (frame.right >= this.frame.left - frmGap && frame.right <= this.frame.right + frmGap)
            );
    }

    getNeighbourValue(value) {
        return value - dFrmGap;
    }

    loadMinOrMax() {
        this.max = this.frame.bottom - triggerGap;
    }

    updateMinAndMax(oppositeEdgeTransporter) {
        this.min = oppositeEdgeTransporter.min + dFrmGap;
    }
}

class BottomEdgeTransporter extends EdgeTransporter {
    constructor(frame, lastTransporter) {
        super(frame, lastTransporter);
    }

    update(value) {
        this.frame.setBottom(value);
    }

    getTransporterType() {
        return TopEdgeTransporter;
    }

    isNeighbour(frame) {
        return frame.top >= this.frame.bottom && frame.top <= this.frame.bottom + triggerGap &&
            (
                (frame.left >= this.frame.left - frmGap && frame.left <= this.frame.right + frmGap) ||
                (frame.right >= this.frame.left - frmGap && frame.right <= this.frame.right + frmGap)
            );
    }

    getNeighbourValue(value) {
        return value + dFrmGap;
    }

    loadMinOrMax() {
        this.min = this.frame.top + triggerGap;
    }

    updateMinAndMax(oppositeEdgeTransporter) {
        this.max = oppositeEdgeTransporter.max - dFrmGap;
    }
}

class LeftEdgeTransporter extends EdgeTransporter {
    constructor(frame, lastTransporter) {
        super(frame, lastTransporter);
    }

    update(value) {
        this.frame.setLeft(value);
    }

    getTransporterType() {
        return RightEdgeTransporter;
    }

    isNeighbour(frame) {
        return frame.right <= this.frame.left && frame.right >= this.frame.left - triggerGap &&
            (
                (frame.top <= this.frame.bottom + frmGap && frame.top >= this.frame.top - frmGap) ||
                (frame.bottom <= this.frame.bottom + frmGap && frame.bottom >= this.frame.top - frmGap)
            );
    }

    getNeighbourValue(value) {
        return value - dFrmGap;
    }

    loadMinOrMax() {
        this.max = this.frame.right - triggerGap;
    }

    updateMinAndMax(oppositeEdgeTransporter) {
        this.min = oppositeEdgeTransporter.min + dFrmGap;
    }
}

class RightEdgeTransporter extends EdgeTransporter {
    constructor(frame, lastTransporter) {
        super(frame, lastTransporter);
    }

    update(value) {
        this.frame.setRight(value);
    }

    getTransporterType() {
        return LeftEdgeTransporter;
    }

    isNeighbour(frame) {
        return frame.left >= this.frame.right && frame.left <= this.frame.right + triggerGap &&
            (
                (frame.top <= this.frame.bottom + frmGap && frame.top >= this.frame.top - frmGap) ||
                (frame.bottom <= this.frame.bottom + frmGap && frame.bottom >= this.frame.top - frmGap)
            );
    }

    getNeighbourValue(value) {
        return value + dFrmGap;
    }

    loadMinOrMax() {
        this.min = this.frame.left + triggerGap;
    }

    updateMinAndMax(oppositeEdgeTransporter) {
        this.max = oppositeEdgeTransporter.max - dFrmGap;
    }
}

class Container {
    id;
    element;
    top;
    right;
    bottom;
    left;

    constructor(id = null) {
        this.id = id;
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
        if (this.id != null) {
            this.element.id = this.id;
        } else if (this.element.id != null && this.element.id.length > 0) {
            this.id = this.element.id;
        } else {
            this.id = this.uuid();
            this.element.id = this.id;
        }

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
    listener;

    constructor(element) {
        super();
        this.setElement(element);
        this.setAll(this.top, this.right, this.bottom, this.left);//to make all fix
        this.frmContainerElm = this.htmlToElement('<div class="frame-container"></div>');
        this.appendChild(this.frmContainerElm);
    }

    setElement(elm) {
        super.setElement(elm);

        for (let attr of elm.attributes) {
            if (attr.name === 'ctx-handler') {
                let fn = window[attr.value];
                if (typeof fn === 'function')
                    this.listener = fn;
            }
        }
    }

    insertFrame(frame) {
        this.frames[frame.id] = frame;
        this.frmContainerElm.appendChild(frame.element);
        EventBroadcaster.registerMouseEventsForFrameBorder(frame);
    }

    removeFrame(frame) {
        delete this.frames[frame.id];
        this.frmContainerElm.removeChild(frame.element);
        EventBroadcaster.unregisterMouseEventsForFrameBorder(frame);
    }

    findFrameByPos(cursorX, cursorY) {
        for (let key in this.frames) {
            if (this.frames[key].intercept(cursorX, cursorY)) {
                return this.frames[key];
            }
        }
        return null;
    }

    getControllerInstance() {
        return new BspLayoutManagerController(this);
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
            '<div class="frame"><img src="images/frame-handler.png" class="handler"><div class="container"></div><div class="footer invisible"></div></div>'));

        this.container = findNearestNode(false, this.element, elm => elm.className === 'container');
        this.footer = findNearestNode(false, this.element, elm => elm.className.search(/\bfooter\b/g) >= 0);
        this.removeContent();
    }

    appendContent(element) {
        this.container.appendChild(element);
        this.updateContainerBg();
    }

    removeContent(elm) {
        if (elm == null) {
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
        } else {
            this.container.removeChild(elm);
        }
        this.updateContainerBg();
    }

    setFooter(element) {
        this.footer.appendChild(element);
        this.footer.style.display = 'block';
    }

    clearFooter(element) {
        if (element != null) {
            this.footer.removeChild(element);
        } else {
            while (this.footer.firstChild) {
                this.footer.removeChild(this.footer.firstChild);
            }
        }
        this.footer.style.display = 'none';

    }

    updateContainerBg() {
        if (this.container.children.length > 0) {
            removeClassStyle(this.container, 'empty');
        } else {
            addClassStyle(this.container, 'empty')
        }
    }
}

class Controller {
    next(x, y) {
    };

    error(e) {
    };

    complete() {
    };
}

class FrmCornerController extends Controller {
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
            EventBroadcaster.activeMouseEventController = new FrmVDivideController(this.hostFrame);
        } else if (x < this.x0 - dFrmGap && y >= this.y0) {
            EventBroadcaster.activeMouseEventController = new FrmHMergeLeftController(null, this.hostFrame);
        } else if (y > this.y0 + triggerGap && x >= this.x0) {
            EventBroadcaster.activeMouseEventController = new FrmHDivideController(this.hostFrame);
        } else if (y <= this.y0 - dFrmGap && x >= this.x0) {
            EventBroadcaster.activeMouseEventController = new FrmVMergeUpController(null, this.hostFrame);
        }
    }
}

// divide Controllers-----------------------------------------
class FrmVDivideController extends Controller {
    leftFrame;

    constructor(frame) {
        super();

        this.leftFrame = frame;
        if (this.leftFrame.right - this.leftFrame.left < 2 * triggerGap) {
            throw 'no enough space'
        }
    }

    next(x, y) {
        //create a frame
        let rightFrame = new Frame().setAll(this.leftFrame.top, this.leftFrame.right, this.leftFrame.bottom, x + dFrmGap);

        //update the current frame
        this.leftFrame.setRight(x);

        //render the new frame
        EventBroadcaster.activeLayoutManager.insertFrame(rightFrame);

        //switch to horizontal move
        EventBroadcaster.activeMouseEventController = new FrmHMoveController(this.leftFrame);
    }
}

class FrmHDivideController extends Controller {
    topFrame;

    constructor(frame) {
        super();

        this.topFrame = frame;
        if (this.topFrame.bottom - this.topFrame.top < 2 * triggerGap) {
            throw 'no enough space'
        }
    }

    next(x, y) {
        //create a frame
        let bottomFrame = new Frame().setAll(y + dFrmGap, this.topFrame.right, this.topFrame.bottom, this.topFrame.left);

        //update the current frame
        this.topFrame.setBottom(y);

        //render the new frame
        EventBroadcaster.activeLayoutManager.insertFrame(bottomFrame);

        //switch to horizontal move
        EventBroadcaster.activeMouseEventController = new FrmVMoveController(this.topFrame);
    }
}

// divide Controllers-----------------------------------------

// move Controllers-------------------------------------------
class FrmHMoveController extends Controller {
    edgeTransporter;

    constructor(leftFrame) {
        super();
        this.edgeTransporter = new RightEdgeTransporter(leftFrame);
        setCursor('col-resize')
    }

    next(x, y) {
        this.edgeTransporter.set(x);
    }
}

class FrmVMoveController extends Controller {
    edgeTransporter;

    constructor(topFrame) {
        super();
        this.edgeTransporter = new BottomEdgeTransporter(topFrame);
        setCursor('row-resize')
    }

    next(x, y) {
        this.edgeTransporter.set(y);
    }
}

// move Controllers-------------------------------------------

// merge Controllers------------------------------------------
class FrmMergeController extends Controller {
    hostFrame;
    guestFrame;
    isPermitted;
    arrowElement;
    state = 0;//0: no process yet, 1: the second view is prepared, 2:the second view is in reset state

    constructor(hostFrame, guestFrame) {
        super();
        this.hostFrame = hostFrame;
        this.guestFrame = guestFrame;
    }

    error(e) {
        this.cleanUp();
    }

    complete() {
        this.cleanUp();
        if (this.isPermitted === true && this.state === 1) {
            this.executeMerge();
        }
    }

    next(x, y) {
        if (this.isPermitted === true) {
            if (this.guestFrame.intercept(x, y, frmGap)) {
                if (this.state !== 1) {
                    this.prepareSecondViewForMerge();
                    this.state = 1;
                }
            } else {
                if (this.state !== 2) {
                    this.resetSecondView();
                    this.state = 2;
                }
            }
            return true;
        }
        return false;
    }

    init() {
        this.isPermitted = this.isMergePermitted();
        if (this.isPermitted === false) {
            setCursor('no-drop');
        } else {
            this.arrowElement = this.guestFrame.htmlToElement(this.getFooterHtml());
            this.prepareSecondViewForMerge();
        }
    }

    prepareSecondViewForMerge() {
        this.guestFrame.setFooter(this.arrowElement);
        this.updateCursor();
    }

    cleanUp() {
        setCursor('auto');
        this.hostFrame.clearFooter();
        if (this.guestFrame != null)
            this.guestFrame.clearFooter();
    }

    resetSecondView() {
        setCursor('no-drop');
        console.log('resetSecondView');
        if (this.guestFrame.footer.children.length > 0)
            this.guestFrame.clearFooter(this.arrowElement);
    }

    static getBoundaries(value1, value2) {
        let a = 4 * frmGap;
        return [value1 - a, value1 + a, value2 - a, value2 + a];
    }

    isMergePermitted() {
        if (this.guestFrame != null) {
            let edges = this.getOppositeEdges();
            let boundaries = FrmMergeController.getBoundaries(this.hostFrame[edges[0]], this.hostFrame[edges[1]]);
            return this.guestFrame[edges[0]] >= boundaries[0] && this.guestFrame[edges[0]] <= boundaries[1]
                && this.guestFrame[edges[1]] >= boundaries[2] && this.guestFrame[edges[1]] <= boundaries[3];
        }
        return false;
    }

    getFooterHtml() {
    }

    updateCursor() {
    }

    executeMerge() {
    }

    getOppositeEdges() {
    }

}

class FrmHMergeController
    extends FrmMergeController {

    constructor(hostFrame, guestFrame) {
        super(hostFrame, guestFrame);
    }

    init() {
        if (this.guestFrame == null)
            this.guestFrame = EventBroadcaster.activeLayoutManager.findFrameByPos(this.hostFrame.left - triggerGap, this.hostFrame.top + triggerGap);
        super.init();
    }

    getOppositeEdges() {
        return ['top', 'bottom'];
    }

    executeMerge() {
        if (!(
            new TopEdgeTransporter(this.guestFrame).set(this.hostFrame.top) &&
            new BottomEdgeTransporter(this.guestFrame).set(this.hostFrame.bottom))) {
            alert('impossible merge');
            throw 'impossible merge';
        }
    }
}

class FrmVMergeController extends FrmMergeController {
    constructor(hostFrame, guestFrame) {
        super(hostFrame, guestFrame);
    }

    init() {
        if (this.guestFrame == null)
            this.guestFrame = EventBroadcaster.activeLayoutManager.findFrameByPos(this.hostFrame.left + triggerGap, this.hostFrame.top - triggerGap);
        super.init();
    }

    getOppositeEdges() {
        return ['left', 'right'];
    }

    executeMerge() {
        if (!(new LeftEdgeTransporter(this.guestFrame).set(this.hostFrame.left) &&
            new RightEdgeTransporter(this.guestFrame).set(this.hostFrame.right))) {
            alert('impossible merge');
            throw 'impossible merge';
        }
    }
}

class FrmHMergeLeftController extends FrmHMergeController {
    constructor(leftFrame, rightFrame) {
        super(rightFrame, leftFrame);
        this.init();
    }

    getFooterHtml() {
        return '<div class="merge-arrow"><img class="left-arrow" src="images/merge-arrow-left.png"/></div>';
    }

    updateCursor() {
        console.log('update cursor');
        setCursor('w-resize');
    }

    executeMerge() {
        super.executeMerge();
        this.hostFrame.setLeft(this.guestFrame.left);
        EventBroadcaster.activeLayoutManager.removeFrame(this.guestFrame);
    }

    next(x, y) {
        if (super.next(x, y))
            if (x >= this.hostFrame.left)
                EventBroadcaster.activeMouseEventController = new FrmHMergeRightController(this.guestFrame, this.hostFrame)
    }
}

class FrmHMergeRightController extends FrmHMergeController {
    constructor(leftFrame, rightFrame) {
        super(leftFrame, rightFrame);
        this.init();
    }

    getFooterHtml() {
        return '<div class="merge-arrow"><img class="right-arrow" src="images/merge-arrow-right.png"/></div>';
    }

    updateCursor() {
        setCursor('e-resize');
    }

    executeMerge() {
        super.executeMerge();
        this.hostFrame.setRight(this.guestFrame.right);
        EventBroadcaster.activeLayoutManager.removeFrame(this.guestFrame);
    }

    next(x, y) {
        if (super.next(x, y))
            if (x <= this.hostFrame.right)
                EventBroadcaster.activeMouseEventController = new FrmHMergeLeftController(this.hostFrame, this.guestFrame);
    }
}

class FrmVMergeUpController extends FrmVMergeController {
    constructor(aboveFrame, belowFrame) {
        super(belowFrame, aboveFrame);
        this.init();
    }

    getFooterHtml() {
        return '<div class="merge-arrow"><img class="up-arrow" src="images/merge-arrow-up.png"/></div>';
    }

    updateCursor() {
        setCursor('n-resize');
    }

    executeMerge() {
        super.executeMerge();
        this.hostFrame.setTop(this.guestFrame.top);
        EventBroadcaster.activeLayoutManager.removeFrame(this.guestFrame);
    }

    next(x, y) {
        if (super.next(x, y))
            if (y >= this.hostFrame.top)
                EventBroadcaster.activeMouseEventController = new FrmVMergeDownController(this.guestFrame, this.hostFrame)
    }
}

class FrmVMergeDownController extends FrmVMergeController {
    constructor(aboveFrame, belowFrame) {
        super(aboveFrame, belowFrame);
        this.init();
    }

    getFooterHtml() {
        return '<div class="merge-arrow"><img class="down-arrow" src="images/merge-arrow-down.png"/></div>';
    }

    updateCursor() {
        setCursor('s-resize');
    }

    executeMerge() {
        super.executeMerge();
        this.hostFrame.setBottom(this.guestFrame.bottom);
        EventBroadcaster.activeLayoutManager.removeFrame(this.guestFrame);
    }

    next(x, y) {
        if (super.next(x, y))
            if (y <= this.hostFrame.bottom)
                EventBroadcaster.activeMouseEventController = new FrmVMergeUpController(this.hostFrame, this.guestFrame);
    }
}

// merge Controllers------------------------------------------

// border Controllers-----------------------------------------
class FrmBorderController extends Controller {
    edgeTransporter;
    valueGetter;

    constructor(frame, edge) {
        super();
        this.init(frame, edge);
    }

    init(frame, edge) {
        let edges = {
            top: () => {
                this.edgeTransporter = new TopEdgeTransporter(frame);
                this.valueGetter = (x, y) => y;
                setCursor('row-resize');
            },
            right: () => {
                this.edgeTransporter = new RightEdgeTransporter(frame);
                this.valueGetter = (x, y) => x;
                setCursor('col-resize');
            },
            bottom: () => {
                this.edgeTransporter = new BottomEdgeTransporter(frame);
                this.valueGetter = (x, y) => y;
                setCursor('row-resize');
            },
            left: () => {
                this.edgeTransporter = new LeftEdgeTransporter(frame);
                this.valueGetter = (x, y) => x;
                setCursor('col-resize');
            }
        };
        edges[edge]();
    }

    next(x, y) {
        this.edgeTransporter.set(this.valueGetter(x, y));
    }
}

// border Controllers-----------------------------------------