# README for AI - SpilnoSchool Document Manager

## What is this project?
**SpilnoSchool Document Manager** is a Node.js widget for managing documents with advanced features including file upload, drag-and-drop functionality, document reordering, and file operations. It communicates with parent windows via postMessage API for file upload requests and dynamic iframe resizing.

## Key Features:
- **File Upload**: Drag-and-drop and click-to-upload functionality
- **Document Management**: Add, delete, reorder, and edit documents
- **Dynamic Resizing**: Automatic iframe height adjustment via iframe-resizer
- **API Communication**: postMessage integration for file upload and document changes
- **Rich UI**: SVG icons, sortable lists, and responsive design

## What you need to do after cloning:

### 1. Install and Start
```bash
npm install
npm run dev
```

### 2. Expose Port for External Access
```bash
expose_port local_port="3000"
```

### 3. Provide the Public URL
Give the user the public URL from expose_port so they can test the widget immediately.

The server runs on port 3000 and serves a test page with buttons to test document management features including file upload simulation and iframe resizing.
