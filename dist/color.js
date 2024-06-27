"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrightness = getBrightness;
exports.getTextColor = getTextColor;
// Function to calculate the brightness of a hex color
function getBrightness(hexColor) {
    const rgb = parseInt(hexColor, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
// Function to get appropriate text color based on background color brightness
function getTextColor(hexColor) {
    const brightness = getBrightness(hexColor);
    return brightness > 128 ? 'black' : 'white';
}
