# Troubleshooting Guide

Common issues and their solutions.

## Connection Issues

### Dashboard Shows "Disconnected"

**Symptoms:**
- Red connection indicator in header
- "Disconnected" status message
- Unable to load data

**Solutions:**

1. **Check API Gateway is running**
   ```bash
   # Verify the API Gateway is accessible
   curl http://localhost:8080/api/v1/areas
   ```

2. **Verify API URL configuration**
   - Click Robot Selector dropdown
   - Check that the API URL is correct (e.g., `http://localhost:8080`)
   - Try editing and re-saving the robot configuration

3. **Check network connectivity**
   - Ensure your computer can reach the robot's network
   - Check firewall settings
   - Verify no proxy is blocking the connection

4. **Check browser console for errors**
   - Press F12 to open developer tools
   - Look for network errors in the Console tab
   - Check the Network tab for failed requests

### Connection Keeps Dropping

**Symptoms:**
- Status alternates between "Connected" and "Reconnecting"
- Data loads intermittently

**Solutions:**

1. **Check network stability**
   - Test network connection with ping
   - Look for packet loss or high latency

2. **Verify API Gateway health**
   - Check API Gateway logs for errors
   - Restart the API Gateway service

3. **Reduce refresh rates**
   - Lower topic auto-refresh intervals
   - Disable real-time streaming temporarily

### WebSocket Connection Failed

**Symptoms:**
- "Falling back to polling" message
- Real-time updates are delayed

**Solutions:**

1. **Check WebSocket support**
   - Verify your browser supports WebSockets
   - Check if a proxy is blocking WebSocket connections

2. **Verify WebSocket endpoint**
   - Default: `ws://localhost:8080/ws`
   - Check API Gateway WebSocket configuration

3. **Use polling fallback**
   - The dashboard automatically falls back to HTTP polling
   - Performance may be slightly reduced but functionality remains

## Data Display Issues

### Topic Data Not Updating

**Symptoms:**
- Topic data shows old timestamps
- Values don't change

**Solutions:**

1. **Check auto-refresh is enabled**
   - Look for pause/play button in topic viewer
   - Ensure refresh interval is set (default: 1 second)

2. **Verify topic is publishing**
   - Check if the ROS2 node is running
   - Use `ros2 topic echo` to verify data

3. **Check component status**
   - Navigate to Components page
   - Verify component status is "active"

### JSON Data Shows "Invalid JSON"

**Symptoms:**
- Red error message in JSON inspector
- Unable to parse topic data

**Solutions:**

1. **Check message format**
   - Verify the topic is publishing valid data
   - Check for encoding issues

2. **Try raw view**
   - Toggle to raw view in JSON inspector
   - Look for malformed data

### Visualizations Not Loading

**Symptoms:**
- Blank 3D viewer
- Map not rendering

**Solutions:**

1. **Check WebGL support**
   - Visit https://get.webgl.org/
   - Update graphics drivers if needed

2. **Check data availability**
   - Verify point cloud or map data is being published
   - Check topic names match expected format

3. **Try different browser**
   - Chrome and Firefox have best WebGL support
   - Safari may have limitations

## Performance Issues

### Dashboard is Slow or Laggy

**Symptoms:**
- UI feels unresponsive
- High CPU usage
- Animations stutter

**Solutions:**

1. **Reduce data refresh rates**
   - Increase topic refresh intervals
   - Disable auto-refresh for unused topics

2. **Limit active visualizations**
   - Close unused 3D viewers
   - Reduce point cloud density

3. **Disable animations**
   - Go to Settings > Accessibility
   - Enable "Reduce motion"

4. **Clear browser cache**
   - Press Ctrl+Shift+Delete
   - Clear cached data

5. **Check system resources**
   - Close other browser tabs
   - Check CPU and memory usage

### Large Point Clouds Cause Freezing

**Symptoms:**
- Browser becomes unresponsive
- "Page unresponsive" warning

**Solutions:**

1. **Reduce point cloud size**
   - Use downsampling in ROS2 node
   - Limit point cloud to visible area

2. **Use lower quality rendering**
   - Switch to "points" mode instead of "ellipsoids"
   - Reduce point size

3. **Increase browser memory**
   - Close other tabs and applications
   - Restart browser

## Operation Execution Issues

### "Execute" Button is Disabled

**Symptoms:**
- Cannot click Execute button
- Button appears grayed out

**Solutions:**

1. **Check required parameters**
   - Ensure all required fields are filled
   - Look for red validation errors

2. **Verify parameter types**
   - Numbers should be numeric (not text)
   - Booleans should be true/false
   - Arrays should be valid JSON arrays

3. **Check operation availability**
   - Verify the service/action is available
   - Check component status

### Action Never Completes

**Symptoms:**
- Action status stuck at "running"
- No progress updates

**Solutions:**

1. **Check action server**
   - Verify ROS2 action server is running
   - Check action server logs

2. **Try canceling and re-executing**
   - Click Cancel button
   - Wait a few seconds
   - Execute again

3. **Check for errors in feedback**
   - Look at action feedback data
   - Check for error messages

## Parameter Configuration Issues

### Parameter Changes Don't Apply

**Symptoms:**
- Value reverts after saving
- No confirmation message

**Solutions:**

1. **Check parameter constraints**
   - Verify value is within min/max range
   - Check for enum restrictions

2. **Verify write permissions**
   - Some parameters may be read-only
   - Check parameter description

3. **Check component status**
   - Component must be active to modify parameters
   - Restart component if needed

### "Invalid Value" Error

**Symptoms:**
- Red error message when saving
- Value not accepted

**Solutions:**

1. **Check data type**
   - String: use quotes for text
   - Number: use numeric value
   - Boolean: use true or false
   - Array: use JSON array format `[1, 2, 3]`

2. **Check constraints**
   - Look at parameter description for valid ranges
   - Check for enum values

## Browser Compatibility

### Recommended Browsers

- **Chrome/Chromium**: 90+ (Best performance)
- **Firefox**: 88+ (Good performance)
- **Edge**: 90+ (Good performance)
- **Safari**: 14+ (Limited WebGL support)

### Known Issues

- **Safari**: Some 3D visualizations may not work
- **Internet Explorer**: Not supported
- **Mobile browsers**: Limited functionality

## Still Having Issues?

If you're still experiencing problems:

1. **Check browser console**
   - Press F12
   - Look for error messages
   - Take a screenshot

2. **Collect information**
   - Browser version
   - Operating system
   - API Gateway version
   - Steps to reproduce

3. **Report the issue**
   - Click the Feedback button in the header
   - Describe the problem
   - Include error messages and screenshots

4. **Check documentation**
   - Review the Quick Start Guide
   - Check API Reference for endpoint details
   - Review keyboard shortcuts

## Getting Help

- **In-app help**: Click the ? button in the header
- **API documentation**: See API Reference section
- **Keyboard shortcuts**: Press ? key
- **Feedback**: Use the Feedback button to report issues
