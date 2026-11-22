/**
 * @file WidgetColorPicker.jsx
 * @description Smooth Interactive HSV Color Picker Component with Real-Time Mouse Tracking.
 * 
 * Features:
 * 1. HEX, RGB, and HSV mathematical color conversion helpers.
 * 2. 2D Saturation / Value canvas gradient box with crosshair pointer.
 * 3. Rainbow Hue slider track.
 * 4. Hex text input field & quick preset color swatches.
 */

import React, { useState, useRef, useEffect } from 'react';

/**
 * Converts Hex color string to RGB integer object `{ r, g, b }`.
 * 
 * @param {string} hex - Hex color string (e.g. '#6366f1').
 * @returns {{ r: number, g: number, b: number }} RGB object.
 */
export function hexToRgb(hex) {
  let c = (hex || '#e86a2e').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 232, g: 106, b: 46 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/**
 * Converts RGB integer components to 6-character Hex string.
 * 
 * @param {number} r - Red byte (0-255).
 * @param {number} g - Green byte (0-255).
 * @param {number} b - Blue byte (0-255).
 * @returns {string} Hex color string.
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

/**
 * Converts RGB integer components to HSV object `{ h, s, v }`.
 * 
 * @param {number} r - Red byte (0-255).
 * @param {number} g - Green byte (0-255).
 * @param {number} b - Blue byte (0-255).
 * @returns {{ h: number, s: number, v: number }} HSV object.
 */
export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

/**
 * Converts HSV values to RGB integer object `{ r, g, b }`.
 * 
 * @param {number} h - Hue angle (0-360).
 * @param {number} s - Saturation percentage (0-100).
 * @param {number} v - Value percentage (0-100).
 * @returns {{ r: number, g: number, b: number }} RGB object.
 */
export function hsvToRgb(h, s, v) {
  h = (h % 360 + 360) % 360;
  h /= 360; s /= 100; v /= 100;
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

/**
 * Custom Interactive Color Picker Component.
 * 
 * @param {Object} props - React props.
 * @param {string} props.color - Current active hex color string.
 * @param {Function} props.onChange - Callback handler receiving updated hex color string.
 * @returns {JSX.Element} Color picker layout element.
 */
export default function WidgetColorPicker({ color, onChange }) {
  const satValRef = useRef(null);
  const hueRef = useRef(null);
  const colorInputRef = useRef(null);

  const rgb = hexToRgb(color);
  const [hsvState, setHsvState] = useState(() => rgbToHsv(rgb.r, rgb.g, rgb.b));
  const [isDraggingSatVal, setIsDraggingSatVal] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  useEffect(() => {
    const newRgb = hexToRgb(color);
    setHsvState(rgbToHsv(newRgb.r, newRgb.g, newRgb.b));
  }, [color]);

  /**
   * Recalculates Saturation and Value percentages from mouse/touch event coordinates.
   * 
   * @param {MouseEvent|TouchEvent} e - Drag event object.
   */
  const updateSatValFromEvent = (e) => {
    if (!satValRef.current) return;
    const rect = satValRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const newS = (x / rect.width) * 100;
    const newV = 100 - (y / rect.height) * 100;

    const updatedHsv = { ...hsvState, s: newS, v: newV };
    setHsvState(updatedHsv);

    const newRgb = hsvToRgb(updatedHsv.h, updatedHsv.s, updatedHsv.v);
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  /**
   * Recalculates Hue angle from mouse/touch event coordinates on slider track.
   * 
   * @param {MouseEvent|TouchEvent} e - Drag event object.
   */
  const updateHueFromEvent = (e) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newH = (x / rect.width) * 360;

    const updatedHsv = { ...hsvState, h: newH };
    setHsvState(updatedHsv);

    const newRgb = hsvToRgb(updatedHsv.h, updatedHsv.s, updatedHsv.v);
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSatVal) updateSatValFromEvent(e);
      if (isDraggingHue) updateHueFromEvent(e);
    };
    const handleMouseUp = () => {
      setIsDraggingSatVal(false);
      setIsDraggingHue(false);
    };

    if (isDraggingSatVal || isDraggingHue) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingSatVal, isDraggingHue, hsvState]);

  const pureHueRgb = hsvToRgb(hsvState.h, 100, 100);
  const pureHueHex = rgbToHex(pureHueRgb.r, pureHueRgb.g, pureHueRgb.b);

  return (
    <div style={{
      background: '#0a0b10',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '14px',
      padding: '1.25rem',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '1rem',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            onClick={() => colorInputRef.current?.click()}
            style={{
              width: '36px',
              height: '42px',
              borderRadius: '6px',
              background: color,
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: `0 0 12px ${color}33`,
            }}
            title="Click to open system color picker"
          />
          <div style={{
            background: '#161720',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '0.55rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
          }}>
            <input
              type="text"
              value={color}
              onChange={e => onChange(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                fontFamily: 'monospace',
                fontWeight: 600,
                width: '90px',
              }}
            />
            <input
              type="color"
              ref={colorInputRef}
              value={color}
              onChange={e => onChange(e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
            />
          </div>
        </div>

        {/* Quick Swatches */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', maxWidth: '140px' }}>
          {['#e86a2e', '#6366f1', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#f59e0b', '#000000'].map(preset => (
            <div
              key={preset}
              onClick={() => onChange(preset)}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: preset,
                cursor: 'pointer',
                border: color.toLowerCase() === preset.toLowerCase() ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                boxSizing: 'border-box',
                transition: 'transform 0.15s ease',
              }}
              title={preset}
            />
          ))}
        </div>
      </div>

      {/* Saturation / Value Box & Hue Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, maxWidth: '210px' }}>
        <div
          ref={satValRef}
          onMouseDown={e => { setIsDraggingSatVal(true); updateSatValFromEvent(e); }}
          onTouchStart={e => { setIsDraggingSatVal(true); updateSatValFromEvent(e); }}
          style={{
            position: 'relative',
            width: '100%',
            height: '100px',
            borderRadius: '8px',
            background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pureHueHex})`,
            cursor: 'crosshair',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          <div style={{
            position: 'absolute',
            left: `${hsvState.s}%`,
            top: `${100 - hsvState.v}%`,
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            border: '2px solid #ffffff',
            boxShadow: '0 0 4px rgba(0,0,0,0.6)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }} />
        </div>

        <div
          ref={hueRef}
          onMouseDown={e => { setIsDraggingHue(true); updateHueFromEvent(e); }}
          onTouchStart={e => { setIsDraggingHue(true); updateHueFromEvent(e); }}
          style={{
            position: 'relative',
            width: '100%',
            height: '12px',
            borderRadius: '6px',
            background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
            cursor: 'pointer',
          }}
        >
          <div style={{
            position: 'absolute',
            left: `${(hsvState.h / 360) * 100}%`,
            top: '50%',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }} />
        </div>
      </div>
    </div>
  );
}
