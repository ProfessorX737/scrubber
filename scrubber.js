function ScrubberView() {
  this.makeAccessors();
  this.createDOM();
  this.attachListeners();
  this.onValueChanged = function () {};
  this.onScrubStart = function () {};
  this.onScrubEnd = function () {};
}

ScrubberView.prototype.makeAccessors = function () {
  var value = 0;
  var min = 0;
  var max = 1;
  var step = 0;

  this.value = function (_value) {
    if (_value === undefined) return value;
    if (value === _value) return this;

    _value = Math.max(min, Math.min(max, _value));

    if (step > 0) {
      var nsteps = Math.round((_value - min) / step);

      var invStep = 1 / step;
      if (invStep === Math.round(invStep)) {
        _value = (min * invStep + nsteps) / invStep;
      } else {
        _value = (min / step + nsteps) * step;
      }

      value = Math.max(min, Math.min(max, _value));
    } else {
      value = _value;
    }

    this.redraw();
    this.onValueChanged(value);
    return this;
  };

  this.min = function (_min) {
    if (_min === undefined) return min;
    if (min === _min) return this;
    min = _min;
    this.redraw();
    return this;
  };

  this.max = function (_max) {
    if (_max === undefined) return max;
    if (max === _max) return this;
    max = _max;
    this.redraw();
    return this;
  };

  this.step = function (_step) {
    if (_step === undefined) return step;
    if (step === _step) return this;
    step = _step;
    this.redraw();
    return this;
  };
};

ScrubberView.prototype.createDOM = function () {
  this.elt = document.createElement("div");
  this.track = document.createElement("div");
  this.progress = document.createElement("div");
  this.thumb = document.createElement("div");
  this.tooltip = document.createElement("div");

  this.elt.className = "scrubber";
  this.track.className = "track";
  this.progress.className = "progress";
  this.thumb.className = "thumb";
  this.tooltip.className = "tooltip";

  this.elt.appendChild(this.track);
  this.elt.appendChild(this.progress);
  this.elt.appendChild(this.thumb);
  this.elt.appendChild(this.tooltip);
};

ScrubberView.prototype.redraw = function () {
  var frac = (this.value() - this.min()) / (this.max() - this.min());
  this.elt.className = "scrubber";
  this.thumb.style.top = "50%";
  this.thumb.style.left = frac * 100 + "%";
  this.progress.style.width = frac * 100 + "%";
};

ScrubberView.prototype.getValueFromPageX = function (pageX) {
  var rect = this.elt.getBoundingClientRect();
  var xOffset = window.pageXOffset;
  var left = rect.left + xOffset;
  var width = rect.width;

  var frac = Math.min(1, Math.max((pageX - left) / width, 0));
  return (1 - frac) * this.min() + frac * this.max();
};

ScrubberView.prototype.attachListeners = function () {
  var self = this;
  var mousedown = false;
  var cachedLeft;
  var cachedWidth;

  var start = function (evt) {
    evt.preventDefault();
    self.onScrubStart(self.value());

    document.addEventListener("mouseup", stop);
    document.addEventListener("touchend", stop);

    mousedown = true;
    var rect = self.elt.getBoundingClientRect();
    // NOTE: page[X|Y]Offset and the width and height
    // properties of getBoundingClientRect are not
    // supported in IE8 and below.
    //
    // Scrubber doesn't attempt to support IE<9.
    var xOffset = window.pageXOffset;
    var yOffset = window.pageYOffset;

    cachedLeft = rect.left + xOffset;
    cachedWidth = rect.width;
    self.thumb.className += " dragging";
  };

  var stop = function () {
    document.removeEventListener("mouseup", stop);
    document.removeEventListener("touchend", stop);
    mousedown = false;
    cachedLeft = undefined;
    cachedWidth = undefined;
    self.thumb.className = "thumb";
    self.onScrubEnd(self.value());
  };

  var setValueFromPageX = function (pageX) {
    var frac = Math.min(1, Math.max((pageX - cachedLeft) / cachedWidth, 0));
    self.value((1 - frac) * self.min() + frac * self.max());
  };

  this.elt.addEventListener("mousedown", start);
  this.elt.addEventListener("touchstart", start);

  document.addEventListener("mousemove", function (evt) {
    if (!mousedown) return;
    evt.preventDefault();
    setValueFromPageX(evt.pageX);
  });

  document.addEventListener("touchmove", function (evt) {
    if (!mousedown) return;
    evt.preventDefault();
    setValueFromPageX(evt.changedTouches[0].pageX);
  });

  this.elt.addEventListener("mouseup", function (evt) {
    if (!mousedown) return;
    evt.preventDefault();
    setValueFromPageX(evt.pageX);
  });

  this.elt.addEventListener("touchend", function (evt) {
    if (!mousedown) return;
    evt.preventDefault();
    setValueFromPageX(evt.changedTouches[0].pageX);
  });

  // Tooltip functionality
  this.elt.addEventListener("mouseenter", function () {
    self.tooltip.style.opacity = "1";
  });

  this.elt.addEventListener("mouseleave", function () {
    self.tooltip.style.opacity = "0";
  });

  this.elt.addEventListener("mousemove", function (evt) {
    if (mousedown) return; // Don't show tooltip while dragging

    var rect = self.elt.getBoundingClientRect();
    var xOffset = window.pageXOffset;
    var left = rect.left + xOffset;
    var relativeX = evt.pageX - left;

    // Position tooltip
    self.tooltip.style.left = relativeX + "px";

    // Calculate and display value
    var value = self.getValueFromPageX(evt.pageX);

    // Format the value (you can customize this formatting)
    var displayValue = self.step() > 0 ? value.toFixed(0) : value.toFixed(2);
    self.tooltip.textContent = displayValue;
  });
};
