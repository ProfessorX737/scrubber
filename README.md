# Enhanced Scrubber Component

A JavaScript scrubber/slider component with time-based functionality, perfect for video players, audio timelines, or any time-based media controls.

## Features

- **Time-based scrubbing**: Configure with duration and start time
- **Flexible time display**: 12-hour or 24-hour format
- **Interactive tooltip**: Shows duration and time at hover position
- **Time labels**: Start and end times displayed below the track
- **Touch support**: Works on mobile devices
- **Responsive design**: Adapts to different screen sizes

## Usage

### Basic Setup

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="scrubber.css" />
  </head>
  <body>
    <div id="my-scrubber"></div>

    <script src="scrubber.js"></script>
    <script>
      var scrubber = new ScrubberView({
        duration: 3600, // 1 hour in seconds
        startTime: new Date(), // Current time
        isTwentyFourHourTime: true,
      });

      document.getElementById("my-scrubber").appendChild(scrubber.elt);
      scrubber.redraw();
    </script>
  </body>
</html>
```

### Constructor Options

```javascript
var scrubber = new ScrubberView({
  duration: 7200, // Duration in seconds (required)
  startTime: new Date(), // Start time as Date object (required)
  isTwentyFourHourTime: true, // Use 24-hour format (default: true)
});
```

### Methods

#### Value Control

```javascript
scrubber.value(0.5); // Set to 50% (returns scrubber for chaining)
var currentValue = scrubber.value(); // Get current value (0-1)

scrubber.min(0).max(1).step(0); // Configure range and stepping
```

#### Time Configuration

```javascript
scrubber.setDuration(3600); // Update duration (1 hour)
scrubber.setStartTime(new Date()); // Update start time
scrubber.isTwentyFourHourTime = false; // Switch to 12-hour format
scrubber.redraw(); // Refresh display
```

### Event Callbacks

```javascript
scrubber.onValueChanged = function (value) {
  console.log("Value changed to:", value);
  // value is between 0 and 1
};

scrubber.onScrubStart = function (value) {
  console.log("Started scrubbing at:", value);
};

scrubber.onScrubEnd = function (value) {
  console.log("Finished scrubbing at:", value);
};
```

### Helper Functions

The scrubber provides several utility functions for time formatting:

```javascript
// Format duration in seconds to readable string
scrubber.formatDuration(3665); // "1h 01m 05s"
scrubber.formatDuration(125); // "2m 05s"
scrubber.formatDuration(45); // "45s"

// Format Date object to time string
scrubber.formatTime(new Date()); // "14:30:15" or "2:30:15 PM"

// Get time at specific position (0-1)
var timeAtHalf = scrubber.getTimeAtPosition(0.5);

// Get duration at specific position (0-1)
var durationAtHalf = scrubber.getDurationAtPosition(0.5);
```

## Examples

### Video Player Timeline

```javascript
var videoScrubber = new ScrubberView({
  duration: 7200, // 2 hours
  startTime: new Date(2024, 0, 1, 9, 0, 0), // 9:00 AM
  isTwentyFourHourTime: true,
});

videoScrubber.onValueChanged = function (value) {
  // Seek video to: value * videoDuration
  video.currentTime = value * video.duration;
};
```

### Meeting Recording

```javascript
var meetingScrubber = new ScrubberView({
  duration: 5400, // 90 minutes
  startTime: new Date(2024, 0, 1, 14, 30, 0), // 2:30 PM
  isTwentyFourHourTime: false, // 12-hour format
});
```

### Audio Track

```javascript
var audioScrubber = new ScrubberView({
  duration: 180, // 3 minutes
  startTime: new Date(2024, 0, 1, 16, 45, 0), // 4:45 PM
  isTwentyFourHourTime: true,
});
```

## Styling

The component uses CSS classes that you can customize:

- `.scrubber` - Main container
- `.scrubber .track` - Background track
- `.scrubber .progress` - Progress indicator
- `.scrubber .thumb` - Draggable thumb
- `.scrubber .tooltip` - Hover tooltip
- `.scrubber .time-container` - Time labels container
- `.scrubber .start-time-label` - Start time label
- `.scrubber .end-time-label` - End time label

## Browser Support

Works in all modern browsers. Includes polyfills for older browsers (IE9+).

## Files

- `scrubber.js` - Main component
- `scrubber.css` - Default styles
- `example.html` - Working examples
