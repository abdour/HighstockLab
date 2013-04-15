/*
*/



Function.prototype.bindAsEventListener = function(object) {
  var __method = this;
  return function(event) {
    return __method.call(object, event || window.event);
  }
}


function pointerY(event) {
    return event.pageY || (event.clientY +
      (document.documentElement.scrollTop || document.body.scrollTop));
  }

function pointerX(event) {
    return event.pageX || (event.clientX +
      (document.documentElement.scrollLeft || document.body.scrollLeft));
  }

function createUUID() {
  return [4, 2, 2, 2, 6].map(function(length) {
    var uuidpart = "";
    for (var i = 0; i < length; i++) {
      var uuidchar = parseInt((Math.random() * 256)).toString(16);
      if (uuidchar.length == 1) uuidchar = "0" + uuidchar;
      uuidpart += uuidchar;
    }
    return uuidpart;
  }).join('-');
}

function cumulativeOffset(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == document.body)
        if (element.style.position == 'absolute') break;

      element = element.offsetParent;
    } while (element);

    return [valueL, valueT];
  }




/*
*/





 function AbstractRenderer() {

};

AbstractRenderer.prototype.init = function(elem) {};
AbstractRenderer.prototype.bounds = function(shape) {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };
};
AbstractRenderer.prototype.create = function(shape, fillColor, lineColor, lineWidth, left, top, width, height) {};
AbstractRenderer.prototype.remove = function(shape) {};
AbstractRenderer.prototype.move = function(shape, left, top) {};
AbstractRenderer.prototype.track = function(shape) {};
AbstractRenderer.prototype.resize = function(shape, fromX, fromY, toX, toY) {};
AbstractRenderer.prototype.editCommand = function(shape, cmd, value) {};
AbstractRenderer.prototype.queryCommand = function(shape, cmd) {};
AbstractRenderer.prototype.showTracker = function(shape) {};
AbstractRenderer.prototype.getMarkup = function() {
  return null;
};
AbstractRenderer.prototype.text = function(shape, textValue, fromX, fromY, angle) {};


function DrawEditor(elem, renderer) {
  this.container = elem;
  this.gridX = 10;
  this.gridY = 10;
  this.mouseDownX = 0;
  this.mouseDownY = 0;
  this.mode = '';
  this.fillColor = '';
  this.lineColor = '';
  this.lineWidth = '';
  this.selected = null;
  this.selectedBounds = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  this.onselect = function() {}
  this.onunselect = function() {}

  this.renderer = renderer;
  this.renderer.init(this.container);

  this.onMouseDownListener = this.onMouseDown.bindAsEventListener(this);
  this.onMouseUpListener = this.onMouseUp.bindAsEventListener(this);
  this.onDragListener = this.onDrag.bindAsEventListener(this);
  this.onResizeListener = this.onResize.bindAsEventListener(this);
  this.onDrawListener = this.onDraw.bindAsEventListener(this);

  this.onHitListener = this.onHit.bindAsEventListener(this);

  this.onSelectStartListener = this.onSelectStart.bindAsEventListener(this);

  $(this.container).bind("mousedown", this.onMouseDownListener);
  $(this.container).bind("mouseup", this.onMouseUpListener);
  $(this.container).bind( "selectstart", this.onSelectStartListener);  

}


DrawEditor.prototype.clearWorkspace = function() {
  this.container.innerHTML = '';
};

DrawEditor.prototype.deleteSelection = function() {
  if (this.selected) {
    this.renderer.remove(this.container.ownerDocument.getElementById('tracker'));
    this.renderer.remove(this.selected);
    this.selected = null;
  }
};

DrawEditor.prototype.select = function(elem) {
  if (elem == this.selected)
    return;

  this.selected = elem;
  this.renderer.showTracker(this.selected);
  this.onselect(this);
};


DrawEditor.prototype.unselect = function() {
  if (this.selected) {
    this.renderer.remove(this.container.ownerDocument.getElementById('tracker'));
    this.selected = null;
    this.onunselect(this);
  }
};

DrawEditor.prototype.getSelectedElement = function() {
  return this.selected;
};

DrawEditor.prototype.editCommand = function(cmd, value)
{
  if (cmd == 'mode') {
    this.mode = value;
  }
  else if (this.selected == null) {
    if (cmd == 'fillcolor') {
      this.fillColor = value;
    }
    else if (cmd == 'linecolor') {
      this.lineColor = value; 
    }
    else if (cmd == 'linewidth') {
      this.lineWidth = parseInt(value) + 'px';
    }
  }
  else {
    this.renderer.editCommand(this.selected, cmd, value);
  }
}

DrawEditor.prototype.queryCommand = function(cmd)
{
  if (cmd == 'mode') {
    return this.mode;
  }
  else if (this.selected == null) {
    if (cmd == 'fillcolor') {
      return this.fillColor;
    }
    else if (cmd == 'linecolor') {
      return this.lineColor;
    }
    else if (cmd == 'linewidth') {
      return this.lineWidth;
    }
  }
  else {
    return this.renderer.queryCommand(this.selected, cmd);
  }
}
DrawEditor.prototype.onSelectStart = function(event) {
  return false;
}

DrawEditor.prototype.setGrid = function(horizontal, vertical) {
  this.gridX = horizontal;
  this.gridY = vertical;
};


DrawEditor.prototype.onMouseDown = function(event) {
  var offset = cumulativeOffset(this.container);
  var snappedX = Math.round((pointerX(event) - offset[0]) / this.gridX) * this.gridX;
  var snappedY = Math.round((pointerY(event) - offset[1]) / this.gridY) * this.gridY;

  if (this.mode != 'select') {
    this.unselect();

    this.mouseDownX = snappedX;
    this.mouseDownY = snappedY;

    this.selected = this.renderer.create(this.mode, this.fillColor, this.lineColor, this.lineWidth, this.mouseDownX, this.mouseDownY, 1, 1);
    this.selected.id = 'shape:' + createUUID();
    $(this.selected).bind( "mousedown", this.onHitListener);  

    $(this.container).bind( "mousemove", this.onDrawListener);  
  }
  else {
    if (this.mouseDownX != snappedX || this.mouseDownY != snappedY)
      this.unselect();
  }
  
  return false;
};



DrawEditor.prototype.onMouseUp = function(event) {
  $(this.container).unbind("mousemove", this.onDrawListener);  
  $(this.container).unbind( "mousemove", this.onDragListener);  

  if (this.mode != 'select') {
    this.selected = null;
  }
};




DrawEditor.prototype.onDrag = function(event) {
  var offset = cumulativeOffset(this.container);
  var snappedX = Math.round((pointerX(event) - offset[0]) / this.gridX) * this.gridX;
  var snappedY = Math.round((pointerY(event) - offset[1]) / this.gridY) * this.gridY;

  var deltaX = snappedX - this.mouseDownX;
  var deltaY = snappedY - this.mouseDownY;

  this.renderer.move(this.selected, this.selectedBounds.x + deltaX, this.selectedBounds.y + deltaY);

  // Update selection tracker
  this.renderer.showTracker(this.selected);
//  hide_tracker();
};


DrawEditor.prototype.onResize = function(event) {
  var offset = cumulativeOffset(this.container);
  var snappedX = Math.round((pointerX(event) - offset[0]) / this.gridX) * this.gridX;
  var snappedY = Math.round((pointerY(event) - offset[1]) / this.gridY) * this.gridY;

  var deltaX = snappedX - this.mouseDownX;
  var deltaY = snappedY - this.mouseDownY;

  this.renderer.track(handle, deltaX, deltaY);

  // Update selection tracker
  show_tracker();
//  hide_tracker();
};

DrawEditor.prototype.onDraw = function(event) {
  if (this.selected == null)
    return;

  var offset = cumulativeOffset(this.container);
  var snappedX = Math.round((pointerX(event) - offset[0]) / this.gridX) * this.gridX;
  var snappedY = Math.round((pointerY(event) - offset[1]) / this.gridY) * this.gridY;

  this.renderer.resize(this.selected, this.mouseDownX, this.mouseDownY, snappedX, snappedY);
};

DrawEditor.prototype.onHit = function(event) {
  if (this.mode == 'select') {
    this.select( event.target || event.srcElement);
    this.selectedBounds = this.renderer.bounds(this.selected);
    
    var offset = cumulativeOffset(this.container);
    this.mouseDownX = Math.round((pointerX(event) - offset[0]) / this.gridX) * this.gridX;
    this.mouseDownY = Math.round((pointerY(event) - offset[1]) / this.gridY) * this.gridY;

    $(this.container).bind( "mousemove", this.onDragListener);  
  }
};











function SVGRenderer() {
  this.base = AbstractRenderer;
  this.svgRoot = null;
}

SVGRenderer.prototype = new AbstractRenderer;


SVGRenderer.prototype.init = function(elem) {
  this.container = elem;

  this.container.style.MozUserSelect = 'none';
    
  var svgNamespace = 'http://www.w3.org/2000/svg';
  this.svgRoot = this.container.ownerDocument.createElementNS(svgNamespace, "svg");
  this.container.appendChild(this.svgRoot);
}


SVGRenderer.prototype.bounds = function(shape) {
  var rect = new Object();
  var box = shape.getBBox();
  rect['x'] = box.x;
  rect['y'] = box.y;
  rect['width'] =  box.width;
  rect['height'] = box.height;
  return rect;
}


SVGRenderer.prototype.create = function(shape, fillColor, lineColor, lineWidth, left, top, width, height) {
  var svgNamespace = 'http://www.w3.org/2000/svg';
  var svg;

  if (shape == 'rect') {
    svg = this.container.ownerDocument.createElementNS(svgNamespace, 'rect');
    svg.setAttributeNS(null, 'x', left + 'px');
    svg.setAttributeNS(null, 'y', top + 'px');
    svg.setAttributeNS(null, 'width', width + 'px');
    svg.setAttributeNS(null, 'height', height + 'px');
  }
  else if (shape == 'ellipse') {
    svg = this.container.ownerDocument.createElementNS(svgNamespace, 'ellipse');
    svg.setAttributeNS(null, 'cx', (left + width / 2) + 'px');
    svg.setAttributeNS(null, 'cy', (top + height / 2) + 'px');
    svg.setAttributeNS(null, 'rx', (width / 2) + 'px');
    svg.setAttributeNS(null, 'ry', (height / 2) + 'px');
  }
  else if (shape == 'roundrect') {
    svg = this.container.ownerDocument.createElementNS(svgNamespace, 'rect');
    svg.setAttributeNS(null, 'x', left + 'px');
    svg.setAttributeNS(null, 'y', top + 'px');
    svg.setAttributeNS(null, 'rx', '20px');
    svg.setAttributeNS(null, 'ry', '20px');
    svg.setAttributeNS(null, 'width', width + 'px');
    svg.setAttributeNS(null, 'height', height + 'px');
  }
  else if (shape == 'line') {
    svg = this.container.ownerDocument.createElementNS(svgNamespace, 'line');
    svg.setAttributeNS(null, 'x1', left + 'px');
    svg.setAttributeNS(null, 'y1', top + 'px');
    svg.setAttributeNS(null, 'x2', left + 'px');
    svg.setAttributeNS(null, 'y2', top + 'px');
  }

  svg.style.position = 'absolute';

  if (fillColor.length == 0)
    fillColor = 'none';
  svg.setAttributeNS(null, 'fill', fillColor);

  if (lineColor.length == 0)
    lineColor = 'none';
  svg.setAttributeNS(null, 'stroke', lineColor);
  svg.setAttributeNS(null, 'stroke-width', lineWidth);
      
  this.svgRoot.appendChild(svg);
  
  return svg;
};


SVGRenderer.prototype.remove = function(shape) {
  shape.parentNode.removeChild(shape);
}


SVGRenderer.prototype.move = function(shape, left, top) {
  if (shape.tagName == 'line') {
    var deltaX = shape.getBBox().width;
    var deltaY = shape.getBBox().height;
    shape.setAttributeNS(null, 'x1', left);
    shape.setAttributeNS(null, 'y1', top);
    shape.setAttributeNS(null, 'x2', left + deltaX);
    shape.setAttributeNS(null, 'y2', top + deltaY);
  }
  else if (shape.tagName == 'ellipse') {
    shape.setAttributeNS(null, 'cx', left + (shape.getBBox().width / 2));
    shape.setAttributeNS(null, 'cy', top + (shape.getBBox().height / 2));
  }
  else {
    shape.setAttributeNS(null, 'x', left);
    shape.setAttributeNS(null, 'y', top);
  }
};


SVGRenderer.prototype.track = function(shape) {
  // TODO
};


SVGRenderer.prototype.resize = function(shape, fromX, fromY, toX, toY) {
  var deltaX = toX - fromX;
  var deltaY = toY - fromY;

  if (shape.tagName == 'line') {
    shape.setAttributeNS(null, 'x2', toX);
    shape.setAttributeNS(null, 'y2', toY);
  }
  else if (shape.tagName == 'ellipse') {
    if (deltaX < 0) {
      shape.setAttributeNS(null, 'cx', (fromX + deltaX / 2) + 'px');
      shape.setAttributeNS(null, 'rx', (-deltaX / 2) + 'px');
    }
    else {
      shape.setAttributeNS(null, 'cx', (fromX + deltaX / 2) + 'px');
      shape.setAttributeNS(null, 'rx', (deltaX / 2) + 'px');
    }
  
    if (deltaY < 0) {
      shape.setAttributeNS(null, 'cy', (fromY + deltaY / 2) + 'px');
      shape.setAttributeNS(null, 'ry', (-deltaY / 2) + 'px');
    }
    else {
      shape.setAttributeNS(null, 'cy', (fromY + deltaY / 2) + 'px');
      shape.setAttributeNS(null, 'ry', (deltaY / 2) + 'px');
    }
  }
  else { 
    if (deltaX < 0) {
      shape.setAttributeNS(null, 'x', toX + 'px');
      shape.setAttributeNS(null, 'width', -deltaX + 'px');
    }
    else {
      shape.setAttributeNS(null, 'width', deltaX + 'px');
    }
  
    if (deltaY < 0) {
      shape.setAttributeNS(null, 'y', toY + 'px');
      shape.setAttributeNS(null, 'height', -deltaY + 'px');
    }
    else {
      shape.setAttributeNS(null, 'height', deltaY + 'px');
    }
  }
};


SVGRenderer.prototype.editCommand = function(shape, cmd, value)
{
  if (shape != null) {
    if (cmd == 'fillcolor') {
      if (value != '')
        shape.setAttributeNS(null, 'fill', value);
      else
        shape.setAttributeNS(null, 'fill', 'none');
    }
    else if (cmd == 'linecolor') {
      if (value != '')
        shape.setAttributeNS(null, 'stroke', value);
      else
        shape.setAttributeNS(null, 'stroke', 'none');
    }
    else if (cmd == 'linewidth') {
      shape.setAttributeNS(null, 'stroke-width', parseInt(value) + 'px');
    }
  }
}


SVGRenderer.prototype.queryCommand = function(shape, cmd)
{
  var result = '';
  
  if (shape != null) {
    if (cmd == 'fillcolor') {
      result = shape.getAttributeNS(null, 'fill');
      if (result == 'none')
        result = '';
    }
    else if (cmd == 'linecolor') {
      result = shape.getAttributeNS(null, 'stroke');
      if (result == 'none')
        result = '';
    }
    else if (cmd == 'linewidth') {
      result = shape.getAttributeNS(null, 'stroke');
      if (result == 'none')
        result = '';
      else
        result = shape.getAttributeNS(null, 'stroke-width');
    }
  }
  
  return result;
}


SVGRenderer.prototype.showTracker = function(shape) {
  var box = shape.getBBox();

  var tracker = document.getElementById('tracker');
  if (tracker) {
    this.remove(tracker);
  }

  var svgNamespace = 'http://www.w3.org/2000/svg';

  tracker = document.createElementNS(svgNamespace, 'rect');
  tracker.setAttributeNS(null, 'id', 'tracker');
  tracker.setAttributeNS(null, 'x', box.x - 10);
  tracker.setAttributeNS(null, 'y', box.y - 10);
  tracker.setAttributeNS(null, 'width', box.width + 20);
  tracker.setAttributeNS(null, 'height', box.height + 20);
  tracker.setAttributeNS(null, 'fill', 'none');
  tracker.setAttributeNS(null, 'stroke', 'blue');
  tracker.setAttributeNS(null, 'stroke-width', '1');
  this.svgRoot.appendChild(tracker);
}


SVGRenderer.prototype.getMarkup = function() {
  return this.container.innerHTML;
}


function callme(){
        renderer = new SVGRenderer();
        c = new  DrawEditor(document.getElementById('container'), renderer);
            c.editCommand('fillcolor', 'red');
    c.editCommand('linecolor', 'black');
    c.editCommand('linewidth', '1px');
    c.editCommand('mode', "line");

}
