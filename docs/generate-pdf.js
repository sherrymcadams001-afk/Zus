/**
 * PDF Generation Script for Zus Trading Agent API Documentation
 * 
 * This script converts the Markdown API specification into a professional PDF document.
 * 
 * Usage:
 *   npm run docs:generate
 * 
 * Dependencies:
 *   - md-to-pdf: Markdown to PDF conversion
 */

import { mdToPdf } from 'md-to-pdf';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_FILE = join(__dirname, 'api-specification.md');
const OUTPUT_FILE = join(__dirname, 'Trading-Agent-API-Specification.pdf');

/**
 * Custom CSS for styling the PDF
 */
const customCss = `
/* Base styles */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #1a1a1a;
  max-width: none;
}

/* Headings */
h1 {
  font-size: 24pt;
  color: #0f172a;
  border-bottom: 3px solid #0ea5e9;
  padding-bottom: 10px;
  margin-top: 40px;
  page-break-after: avoid;
}

h1:first-of-type {
  margin-top: 0;
  font-size: 28pt;
  text-align: center;
  border-bottom: none;
}

h2 {
  font-size: 18pt;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
  margin-top: 30px;
  page-break-after: avoid;
}

h3 {
  font-size: 14pt;
  color: #334155;
  margin-top: 25px;
  page-break-after: avoid;
}

h4 {
  font-size: 12pt;
  color: #475569;
  margin-top: 20px;
  page-break-after: avoid;
}

/* Code blocks */
pre {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  font-size: 9pt;
  line-height: 1.5;
  page-break-inside: avoid;
}

code {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 9pt;
  background-color: #f1f5f9;
  padding: 2px 6px;
  border-radius: 3px;
}

pre code {
  background-color: transparent;
  padding: 0;
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 10pt;
  page-break-inside: avoid;
}

th {
  background-color: #0f172a;
  color: white;
  font-weight: 600;
  text-align: left;
  padding: 12px 15px;
}

td {
  padding: 10px 15px;
  border-bottom: 1px solid #e2e8f0;
}

tr:nth-child(even) {
  background-color: #f8fafc;
}

/* Blockquotes */
blockquote {
  border-left: 4px solid #0ea5e9;
  margin: 20px 0;
  padding: 10px 20px;
  background-color: #f0f9ff;
  color: #0369a1;
}

/* Links */
a {
  color: #0ea5e9;
  text-decoration: none;
}

/* Lists */
ul, ol {
  padding-left: 25px;
  margin: 15px 0;
}

li {
  margin: 8px 0;
}

/* Horizontal rules */
hr {
  border: none;
  border-top: 2px solid #e2e8f0;
  margin: 40px 0;
}

/* Strong/Bold */
strong {
  color: #0f172a;
}

/* Page breaks */
h1 {
  page-break-before: always;
}

h1:first-of-type {
  page-break-before: avoid;
}

/* Inline code in tables */
td code {
  font-size: 8pt;
}

/* JSON syntax highlighting approximation */
pre code {
  color: #334155;
}
`;

/**
 * PDF configuration
 */
const pdfConfig = {
  // Launch options for Puppeteer (needed for CI environments)
  launch_options: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  
  // PDF options
  pdf_options: {
    format: 'A4',
    margin: {
      top: '25mm',
      right: '20mm',
      bottom: '25mm',
      left: '20mm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 9px; color: #666; width: 100%; text-align: center; margin: 0 20mm;"><span>Zus Trading Agent API Specification</span></div>',
    footerTemplate: '<div style="font-size: 9px; color: #666; width: 100%; text-align: center; margin: 0 20mm;"><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>'
  },
  
  // Use css property for inline CSS
  css: customCss,
  
  // Marked options for markdown parsing
  marked_options: {
    gfm: true,
    breaks: false
  }
};

/**
 * Generate PDF from Markdown
 */
async function generatePdf() {
  console.log('📄 Starting PDF generation...');
  console.log(`   Input: ${INPUT_FILE}`);
  console.log(`   Output: ${OUTPUT_FILE}`);
  
  try {
    // Read markdown content
    const markdownContent = readFileSync(INPUT_FILE, 'utf-8');
    console.log(`   Read ${markdownContent.length} characters from input file`);
    
    // Convert to PDF
    const pdf = await mdToPdf(
      { content: markdownContent },
      pdfConfig
    );
    
    if (pdf?.content) {
      // Write PDF to file
      writeFileSync(OUTPUT_FILE, pdf.content);
      console.log('✅ PDF generated successfully!');
      console.log(`   Output: ${OUTPUT_FILE}`);
      console.log(`   Size: ${(pdf.content.length / 1024).toFixed(2)} KB`);
    } else {
      throw new Error('PDF generation returned empty content');
    }
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message);
    process.exit(1);
  }
}

// Run the generator
generatePdf();
