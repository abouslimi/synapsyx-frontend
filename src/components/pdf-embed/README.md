# PDF Embed Components

This directory contains TypeScript React components for integrating Adobe PDF Embed API into your application.

## Components

### Main Component

- **`PDFEmbed`** - The main component for displaying PDFs with various embed modes and configurations

### Individual Embed Mode Components

- **`InLine`** - Displays PDF inline with the page content
- **`FullWindow`** - Displays PDF in full window mode
- **`Lightbox`** - Displays PDF in a lightbox overlay
- **`SizedContainer`** - Displays PDF in a sized container

### Specialized Components

- **`CaptureViewSDKEvents`** - Captures and logs PDF viewer events
- **`LocalPDFFilePreview`** - Allows users to upload and preview local PDF files
- **`CRUDAPIs`** - Demonstrates annotation CRUD operations

### Example Component

- **`PDFViewerExample`** - Complete example showing how to use the PDF embed components

## Usage

### Basic Usage

```tsx
import { PDFEmbed } from './components/pdf-embed';

function MyComponent() {
  return (
    <PDFEmbed
      pdfUrl="https://example.com/document.pdf"
      fileName="Document.pdf"
      embedMode="FULL_WINDOW"
      enableAnnotations={true}
      onPDFLoaded={() => console.log('PDF loaded')}
    />
  );
}
```

### Advanced Usage with Custom Configuration

```tsx
import { PDFEmbed } from './components/pdf-embed';

function AdvancedPDFViewer() {
  return (
    <PDFEmbed
      pdfUrl="https://example.com/document.pdf"
      fileName="Document.pdf"
      fileId="unique-file-id"
      embedMode="SIZED_CONTAINER"
      width={800}
      height={600}
      enableAnnotations={true}
      showAnnotationTools={true}
      showDownloadPDF={true}
      showPrintPDF={true}
      showLeftHandPanel={true}
      showPageControls={true}
      showZoomControl={true}
      defaultViewMode="FIT_PAGE"
      headers={[
        { key: 'Authorization', value: 'Bearer token' }
      ]}
      onPDFLoaded={() => console.log('PDF loaded successfully')}
      onPDFError={(error) => console.error('PDF loading failed:', error)}
      onAnnotationEvent={(event) => console.log('Annotation event:', event)}
    />
  );
}
```

### Using Individual Embed Mode Components

```tsx
import { InLine, FullWindow, Lightbox, SizedContainer } from './components/pdf-embed';

// Inline PDF
<InLine className="custom-inline-class" />

// Full window PDF
<FullWindow className="custom-full-window-class" />

// Lightbox PDF
<Lightbox 
  buttonText="View Document"
  onPreview={() => console.log('Preview opened')}
/>

// Sized container PDF
<SizedContainer 
  width={600} 
  height={400}
  className="custom-sized-container"
/>
```

### Using the Example Component

```tsx
import { PDFViewerExample } from './components/pdf-embed';

function App() {
  return (
    <PDFViewerExample 
      pdfUrl="https://example.com/document.pdf"
      fileName="My Document.pdf"
    />
  );
}
```

## Props

### PDFEmbed Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pdfUrl` | `string` | Demo PDF URL | URL of the PDF file to display |
| `fileName` | `string` | "Bodea Brochure.pdf" | Name of the PDF file |
| `fileId` | `string` | Demo file ID | Unique identifier for the PDF file |
| `embedMode` | `'IN_LINE' \| 'FULL_WINDOW' \| 'LIGHT_BOX' \| 'SIZED_CONTAINER'` | `'FULL_WINDOW'` | How the PDF should be embedded |
| `enableAnnotations` | `boolean` | `false` | Enable annotation APIs |
| `showAnnotationTools` | `boolean` | `false` | Show annotation tools |
| `showDownloadPDF` | `boolean` | `true` | Show download PDF button |
| `showPrintPDF` | `boolean` | `true` | Show print PDF button |
| `showLeftHandPanel` | `boolean` | `true` | Show left hand panel |
| `showPageControls` | `boolean` | `true` | Show page controls |
| `showZoomControl` | `boolean` | `true` | Show zoom control |
| `defaultViewMode` | `'FIT_PAGE' \| 'FIT_WIDTH' \| 'FIT_HEIGHT'` | `'FIT_PAGE'` | Default view mode |
| `className` | `string` | `'full-window-div'` | CSS class for the container |
| `id` | `string` | `'pdf-div'` | HTML ID for the container |
| `width` | `number` | `600` | Width for sized container mode |
| `height` | `number` | `476` | Height for sized container mode |
| `onPDFLoaded` | `() => void` | - | Callback when PDF is loaded |
| `onPDFError` | `(error: any) => void` | - | Callback when PDF fails to load |
| `onAnnotationEvent` | `(event: any) => void` | - | Callback for annotation events |
| `headers` | `Array<{key: string, value: string}>` | - | Custom headers for PDF URL |

## CSS Classes

The components use the following CSS classes (defined in `index.css`):

- `.in-line-div` - For inline PDF display
- `.in-line-container` - Container for inline PDF
- `.sized-container-div` - For sized container PDF display
- `.full-window-div` - For full window PDF display
- `.light-box-container` - For lightbox PDF display
- `.lb-view-file-btn` - Lightbox view button
- `.file-input` - Hidden file input
- `.file-picker` - File picker button

## Adobe PDF Embed API

These components use the Adobe PDF Embed API. Make sure to:

1. Include the Adobe PDF Embed API script in your HTML:
```html
<script src="https://documentcloud.adobe.com/view-sdk/main.js"></script>
```

2. Replace the client ID in `ViewSDKClient.ts` with your own Adobe client ID:
```typescript
clientId: "YOUR_ADOBE_CLIENT_ID"
```

## TypeScript Support

All components are fully typed with TypeScript. Import types as needed:

```tsx
import { PDFEmbedProps, ViewerConfig, AnnotationManager } from './components/pdf-embed';
```

## License

Copyright 2020 Adobe. All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in accordance with the terms of the Adobe license agreement accompanying it. If you have received this file from a source other than Adobe, then your use, modification, or distribution of it requires the prior written permission of Adobe.
