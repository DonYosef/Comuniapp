'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Función para procesar el texto y convertir Markdown básico a HTML
  const processMarkdown = (text: string): string => {
    let processed = text;

    // Convertir texto en negrita **texto** a <strong>
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convertir texto en cursiva *texto* a <em>
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convertir código `texto` a <code>
    processed = processed.replace(/`(.*?)`/g, '<code>$1</code>');

    // Convertir enlaces [texto](url) a <a>
    processed = processed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );

    return processed;
  };

  // Función para dividir el contenido en secciones
  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const sections: Array<{
      type: 'paragraph' | 'heading' | 'table' | 'list' | 'separator';
      content: string;
      level?: number;
    }> = [];

    let currentSection = '';
    let inTable = false;
    let tableRows: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Separadores (---)
      if (line === '---') {
        if (currentSection) {
          sections.push({ type: 'paragraph', content: currentSection });
          currentSection = '';
        }
        sections.push({ type: 'separator', content: '' });
        continue;
      }

      // Encabezados (###)
      if (line.startsWith('###')) {
        if (currentSection) {
          sections.push({ type: 'paragraph', content: currentSection });
          currentSection = '';
        }
        sections.push({
          type: 'heading',
          content: line.replace(/^###\s*/, ''),
          level: 3,
        });
        continue;
      }

      // Tablas (detectar por |)
      if (line.includes('|') && !inTable) {
        inTable = true;
        tableRows = [line];
        continue;
      }

      if (inTable) {
        if (line.includes('|')) {
          tableRows.push(line);
        } else {
          // Fin de la tabla
          sections.push({ type: 'table', content: tableRows.join('\n') });
          tableRows = [];
          inTable = false;
          if (line) {
            currentSection = line;
          }
        }
        continue;
      }

      // Listas numeradas
      if (/^\d+\.\s/.test(line)) {
        if (currentSection) {
          sections.push({ type: 'paragraph', content: currentSection });
          currentSection = '';
        }
        sections.push({ type: 'list', content: line });
        continue;
      }

      // Listas con viñetas
      if (line.startsWith('- ')) {
        if (currentSection) {
          sections.push({ type: 'paragraph', content: currentSection });
          currentSection = '';
        }
        sections.push({ type: 'list', content: line });
        continue;
      }

      // Párrafos normales
      if (line) {
        currentSection += (currentSection ? '\n' : '') + line;
      } else if (currentSection) {
        sections.push({ type: 'paragraph', content: currentSection });
        currentSection = '';
      }
    }

    // Agregar la última sección
    if (currentSection) {
      sections.push({ type: 'paragraph', content: currentSection });
    }

    return sections;
  };

  const sections = parseContent(content);

  return (
    <div className="markdown-content space-y-3">
      <style jsx>{`
        .markdown-content :global(code) {
          background-color: #f3f4f6;
          color: #374151;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
        }
        .dark .markdown-content :global(code) {
          background-color: #374151;
          color: #ffffff;
        }
        .markdown-content :global(strong) {
          font-weight: 700;
          color: #111827;
        }
        .dark .markdown-content :global(strong) {
          color: #ffffff;
          font-weight: normal;
        }
        .markdown-content :global(em) {
          font-style: italic;
          color: #6b7280;
        }
        .dark .markdown-content :global(em) {
          color: #ffffff;
          font-style: normal;
        }
        .markdown-content :global(a) {
          color: #3b82f6;
          text-decoration: underline;
        }
        .dark .markdown-content :global(a) {
          color: #ffffff;
        }
        .markdown-content :global(a:hover) {
          color: #1d4ed8;
        }
        .dark .markdown-content :global(a:hover) {
          color: #ffffff;
        }
      `}</style>
      {sections.map((section, index) => {
        switch (section.type) {
          case 'heading':
            return (
              <h3
                key={index}
                className="text-base font-semibold text-gray-800 dark:text-white mt-3 mb-2 flex items-center"
              >
                <span className="mr-2">📋</span>
                {section.content}
              </h3>
            );

          case 'table':
            const tableLines = section.content.split('\n');
            const headers = tableLines[0]
              .split('|')
              .map((h) => h.trim())
              .filter((h) => h);
            const rows = tableLines.slice(2).map((line) =>
              line
                .split('|')
                .map((cell) => cell.trim())
                .filter((cell) => cell),
            );

            return (
              <div key={index} className="overflow-x-auto my-3">
                <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
                  <thead className="bg-blue-50 dark:bg-blue-900/20">
                    <tr>
                      {headers.map((header, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-left text-xs font-semibold text-blue-700 dark:text-white border-b border-blue-200 dark:border-blue-700"
                        >
                          <div dangerouslySetInnerHTML={{ __html: processMarkdown(header) }} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-600/50">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="px-3 py-2 text-xs text-gray-600 dark:text-white border-b border-gray-100 dark:border-gray-600"
                          >
                            <div dangerouslySetInnerHTML={{ __html: processMarkdown(cell) }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'list':
            const isNumbered = /^\d+\.\s/.test(section.content);
            const listItem = section.content.replace(/^[-•]\s|\d+\.\s/, '');

            return (
              <div key={index} className="flex items-start space-x-3 my-2">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    {isNumbered ? '✓' : '•'}
                  </span>
                </div>
                <div
                  className="text-sm text-gray-700 dark:text-white leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: processMarkdown(listItem) }}
                />
              </div>
            );

          case 'separator':
            return <hr key={index} className="border-gray-200 dark:border-gray-600 my-4" />;

          case 'paragraph':
          default:
            return (
              <div
                key={index}
                className="text-sm text-gray-700 dark:text-white leading-relaxed"
                dangerouslySetInnerHTML={{ __html: processMarkdown(section.content) }}
              />
            );
        }
      })}
    </div>
  );
}
