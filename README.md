# Notion-Style Tabbed Page

A clean, dark-themed tabbed layout inspired by Notion. Designed to load external HTML files (like Notion exports) dynamically without breaking the layout.

## Structure

```
/index.html       - Main page
/styles.css       - Dark theme styles
/script.js        - Tab switching logic
/content/         - Folder for Notion exports
  tab1.html
  tab2.html
  tab3.html
```

## How to Use

1. Export pages from Notion as HTML
2. Rename them to `tab1.html`, `tab2.html`, `tab3.html`
3. Drop them into the `/content` folder
4. Open `index.html` in a browser

The script automatically:
- Strips outer `<html>` and `<body>` tags from Notion exports
- Wraps content in `.notion-content` for scoped styling
- Applies dark theme styles
- Handles smooth tab transitions

## Features

- Dark theme (#191919 background, soft white text)
- Notion-style tabs with underline highlight
- Smooth fade transitions
- Responsive (mobile-friendly)
- No frameworks, pure vanilla JS
- Content caching for fast tab switching

## Customization

- Edit tab names in `index.html` (button text)
- Adjust colors in `styles.css`
- Add more tabs by adding buttons with `data-tab="tab4"` and creating `content/tab4.html`
