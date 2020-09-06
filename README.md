# jsBSP
This library is a Binary Space Partitioning layout manager written in JS.<br/>

![How it works](https://github.com/Arash-Rezaie/jsBSP/blob/master/images/layout-manager-tutorial.png?raw=true)

### Installation
```git
git clone https://github.com/Arash-Rezaie/jsBSP.git
```
```html
<script type="text/javascript" src="[what-ever]/bsp.js"></script>
<link type="text/css" rel="stylesheet" href="[what-ever]/bsp-styles.css">
```

### How to use:
Please notice that id is an important attribute for this library. If you set that, the layout manager will hire that o.w it will generate one. **Do not change that after initialization**. When user right clicks on the frame conrner, ctx-handler will get called.

```html
<div class="bspLayoutManager" ctx-handler="doSomeThing"/>
```
```javascript
function doSomeThing(frameAdr, anchorElement) {
  BspLayoutManagerController.appendContent(frameAdr, htmlToElement('<div><span>This is a simple text</span></div>'));

  // to remove an element from the view
  // BspLayoutManagerController.removeContent(frameAdr,element);
}

function htmlToElement(html) {
  let template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
}
```

To resize layout view:
```html
<div class="bspLayoutManager" ctx-handler="doSomeThing" id="1234"/>
```
```javascript
//to get notified just after view loading finished
BspLayoutManagerController.onLoadFinished = () => {
  resize(500,500);
};

function readWidthAndHeight() {
  let lm = BspLayoutManagerController.getLayoutManagerById('1234');
  w.value = lm.getWidth();
  h.value = lm.getHeight();
}

function resize(w,h) {
  let lmc = BspLayoutManagerController.getLayoutManagerById('1234').getControllerInstance();
  lmc.setWidth(w);
  lmc.setHeight(h);
}
```

You can access configurtion object to store/restore the layout. Please notice that the content will not be retrieved. The given object determines only the alyout configuration. To handle that you must store frame content with their address by yourself.

```javascript
function getJson() {
  txt.value = JSON.stringify(BspLayoutManagerController.getLayoutManagerById('1234').getControllerInstance().getConfigurationObj());
}

function loadJson() {
  BspLayoutManagerController.getLayoutManagerById('1234').getControllerInstance().loadFromConfigurationObj(JSON.parse(txt.value));
}
```
