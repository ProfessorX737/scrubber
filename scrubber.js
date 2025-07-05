function ScrubberView(options) {
  options = options || {};

  // Time-related properties
  this.duration = options.duration || 0; // Duration in seconds
  this.startTime = options.startTime || new Date(); // Start time as Date object
  this.isTwentyFourHourTime =
    options.isTwentyFourHourTime !== undefined
      ? options.isTwentyFourHourTime
      : true;

  // Calculate end time
  this.endTime = new Date(this.startTime.getTime() + this.duration * 1000);

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
  this.scrubberDiv = document.createElement("div");
  this.track = document.createElement("div");
  this.progress = document.createElement("div");
  this.thumb = document.createElement("div");
  this.tooltip = document.createElement("div");

  // Time display elements
  this.timeContainer = document.createElement("div");
  this.startTimeLabel = document.createElement("div");
  this.endTimeLabel = document.createElement("div");

  this.elt.className = "scrubber-container";
  this.scrubberDiv.className = "scrubber";
  this.track.className = "track";
  this.progress.className = "progress";
  this.thumb.className = "thumb";
  this.tooltip.className = "tooltip";
  this.timeContainer.className = "time-container";
  this.startTimeLabel.className = "start-time-label";
  this.endTimeLabel.className = "end-time-label";

  // Set time labels content
  this.startTimeLabel.textContent = this.formatTime(this.startTime);
  this.endTimeLabel.textContent = this.formatTime(this.endTime);

  // Add scrubber elements to scrubberDiv
  this.scrubberDiv.appendChild(this.track);
  this.scrubberDiv.appendChild(this.progress);
  this.scrubberDiv.appendChild(this.thumb);
  this.scrubberDiv.appendChild(this.tooltip);

  // Add time labels to container
  this.timeContainer.appendChild(this.startTimeLabel);
  this.timeContainer.appendChild(this.endTimeLabel);

  // Add scrubberDiv and timeContainer to main elt
  this.elt.appendChild(this.scrubberDiv);
  this.elt.appendChild(this.timeContainer);
};

ScrubberView.prototype.redraw = function () {
  var frac = (this.value() - this.min()) / (this.max() - this.min());
  this.scrubberDiv.className = "scrubber";
  this.thumb.style.top = "50%";
  this.thumb.style.left = frac * 100 + "%";
  this.progress.style.width = frac * 100 + "%";
  this.updateTimeLabels();
};

ScrubberView.prototype.getValueFromPageX = function (pageX) {
  var rect = this.scrubberDiv.getBoundingClientRect();
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
    var rect = self.scrubberDiv.getBoundingClientRect();
    // NOTE: page[X|Y]Offset and the width and height
    // properties of getBoundingClientRect are not
    // supported in IE8 and below.
    //
    // Scrubber doesn't attempt to support IE<9.
    var xOffset = window.pageXOffset;

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

  this.scrubberDiv.addEventListener("mousedown", start);
  this.scrubberDiv.addEventListener("touchstart", start);

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

  this.scrubberDiv.addEventListener("mouseup", function (evt) {
    if (!mousedown) return;
    evt.preventDefault();
    setValueFromPageX(evt.pageX);
  });

  this.scrubberDiv.addEventListener("touchend", function (evt) {
    if (!mousedown) return;
    evt.preventDefault();
    setValueFromPageX(evt.changedTouches[0].pageX);
  });

  // Tooltip functionality
  this.scrubberDiv.addEventListener("mouseenter", function () {
    self.tooltip.style.opacity = "1";
  });

  this.scrubberDiv.addEventListener("mouseleave", function () {
    self.tooltip.style.opacity = "0";
  });

  this.scrubberDiv.addEventListener("mousemove", function (evt) {
    var rect = self.scrubberDiv.getBoundingClientRect();
    var xOffset = window.pageXOffset;
    var left = rect.left + xOffset;
    var relativeX = evt.pageX - left;

    // Position tooltip
    self.tooltip.style.left = relativeX + "px";

    // Calculate value as fraction (0-1)
    var frac = Math.min(1, Math.max((evt.pageX - left) / rect.width, 0));

    // Get duration and time at this position
    var durationAtPosition = self.getDurationAtPosition(frac);
    var timeAtPosition = self.getTimeAtPosition(frac);

    // Format tooltip content with duration and time
    var durationText = self.formatDuration(durationAtPosition);
    var timeText = self.formatTime(timeAtPosition);

    self.tooltip.innerHTML = durationText + "<br>" + timeText;
  });
};

// Helper functions for time and duration formatting
ScrubberView.prototype.padStart = function (str, targetLength, padString) {
  // Simple polyfill for String.prototype.padStart
  str = String(str);
  if (str.length >= targetLength) {
    return str;
  }
  padString = padString || " ";
  var pad = "";
  var neededPadding = targetLength - str.length;
  for (var i = 0; i < neededPadding; i++) {
    pad += padString;
  }
  return pad + str;
};

ScrubberView.prototype.formatDuration = function (seconds) {
  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);
  var secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return (
      hours +
      "h " +
      this.padStart(minutes, 2, "0") +
      "m " +
      this.padStart(secs, 2, "0") +
      "s"
    );
  } else if (minutes > 0) {
    return minutes + "m " + this.padStart(secs, 2, "0") + "s";
  } else {
    return secs + "s";
  }
};

ScrubberView.prototype.formatTime = function (date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();

  if (this.isTwentyFourHourTime) {
    return (
      this.padStart(hours, 2, "0") +
      ":" +
      this.padStart(minutes, 2, "0") +
      ":" +
      this.padStart(seconds, 2, "0")
    );
  } else {
    var ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return (
      hours +
      ":" +
      this.padStart(minutes, 2, "0") +
      ":" +
      this.padStart(seconds, 2, "0") +
      " " +
      ampm
    );
  }
};

ScrubberView.prototype.getTimeAtPosition = function (value) {
  // Convert value (0-1) to time offset in seconds
  var timeOffset = value * this.duration;
  return new Date(this.startTime.getTime() + timeOffset * 1000);
};

ScrubberView.prototype.getDurationAtPosition = function (value) {
  return value * this.duration;
};

ScrubberView.prototype.updateTimeLabels = function () {
  if (this.startTimeLabel && this.endTimeLabel) {
    this.startTimeLabel.textContent = this.formatTime(this.startTime);
    this.endTimeLabel.textContent = this.formatTime(this.endTime);
  }
};

ScrubberView.prototype.setDuration = function (duration) {
  this.duration = duration;
  this.endTime = new Date(this.startTime.getTime() + this.duration * 1000);
  this.updateTimeLabels();
  return this;
};

ScrubberView.prototype.setStartTime = function (startTime) {
  this.startTime = startTime;
  this.endTime = new Date(this.startTime.getTime() + this.duration * 1000);
  this.updateTimeLabels();
  return this;
};
