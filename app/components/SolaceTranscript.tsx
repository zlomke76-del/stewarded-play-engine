"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { UI } from "./dock-ui";

/* ------------------------------------------------------------------
   Types
------------------------------------------------------------------- */
type ExportItem = {
  kind: "export";
  format: "docx" | "pdf" | "csv";
  filename: string;
  url: string;
};

type CodeArtifact = {
  type: "code";
  language: string;
  filename?: string;
  content: string;
};

type TextArtifact = {
  type: "text";
  format: "plain" | "markdown";
  title?: string;
  content: string;
};

type Message = {
  role: "user" | "assistant";
  content?: string | null;
  imageUrl?: string | null;
  export?: ExportItem | null;
  artifact?: CodeArtifact | TextArtifact | null;
};

type Props = {
  messages: Message[];
  transcriptRef: React.MutableRefObject<HTMLDivElement | null>;
  transcriptStyle: React.CSSProperties;
};

/* ------------------------------------------------------------------
   Component
------------------------------------------------------------------- */
export default function SolaceTranscript({
  messages,
  transcriptRef,
  transcriptStyle,
}: Props) {
  return (
    <div ref={transcriptRef} style={transcriptStyle}>
      {messages.map((msg, i) => {
        const isUser = msg.role === "user";
        const artifactType = msg.artifact?.type;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: isUser ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: 14,
                borderRadius: UI.radiusLg,
                background: isUser ? UI.surface2 : UI.surface1,
                color: UI.text,
                boxShadow: UI.shadow,
              }}
            >
              {artifactType === "code" && (
                <CodeArtifactBlock artifact={msg.artifact as CodeArtifact} />
              )}

              {artifactType === "text" && (
                <TextArtifactBlock artifact={msg.artifact as TextArtifact} />
              )}

              {!artifactType && msg.content && (
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.55,
                    fontSize: 15,
                  }}
                >
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------
   Code Artifact
------------------------------------------------------------------- */
function CodeArtifactBlock({ artifact }: { artifact: CodeArtifact }) {
  const copy = () => navigator.clipboard.writeText(artifact.content);

  return (
    <div
      style={{
        background: UI.surface2,
        borderRadius: UI.radiusMd,
        padding: 12,
        fontFamily: "monospace",
        fontSize: 13,
      }}
    >
      <Header title={artifact.filename || artifact.language} onCopy={copy} />
      <pre style={{ margin: 0, overflowX: "auto" }}>
        <code>{artifact.content}</code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------
   Text Artifact (ChatGPT-clean)
------------------------------------------------------------------- */
function TextArtifactBlock({ artifact }: { artifact: TextArtifact }) {
  const copy = () => navigator.clipboard.writeText(artifact.content);

  return (
    <div
      style={{
        background: UI.surface2,
        borderRadius: UI.radiusMd,
        padding: 14,
      }}
    >
      <Header title={artifact.title || "Response"} onCopy={copy} />

      <div style={{ fontSize: 15, lineHeight: 1.6 }}>
        {artifact.format === "markdown" ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p style={{ margin: "0 0 12px" }}>{children}</p>
              ),
              h1: ({ children }) => (
                <h1 style={{ fontSize: 20, margin: "14px 0 8px" }}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ fontSize: 18, margin: "14px 0 6px" }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: 16, margin: "12px 0 6px" }}>
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul style={{ paddingLeft: 20, margin: "6px 0 12px" }}>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol style={{ paddingLeft: 20, margin: "6px 0 12px" }}>
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li style={{ marginBottom: 6 }}>{children}</li>
              ),
              table: ({ children }) => (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    margin: "12px 0",
                    fontSize: 14,
                  }}
                >
                  {children}
                </table>
              ),
              th: ({ children }) => (
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #333",
                    padding: "6px 8px",
                    fontWeight: 600,
                  }}
                >
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td
                  style={{
                    borderBottom: "1px solid #222",
                    padding: "6px 8px",
                    verticalAlign: "top",
                  }}
                >
                  {children}
                </td>
              ),
              code: ({ children }) => (
                <code
                  style={{
                    background: "#111",
                    padding: "2px 4px",
                    borderRadius: 4,
                    fontSize: 13,
                  }}
                >
                  {children}
                </code>
              ),
            }}
          >
            {artifact.content}
          </ReactMarkdown>
        ) : (
          <div style={{ whiteSpace: "pre-wrap" }}>{artifact.content}</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Shared Header
------------------------------------------------------------------- */
function Header({
  title,
  onCopy,
}: {
  title?: string;
  onCopy: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 8,
        fontSize: 12,
        fontWeight: 600,
        color: UI.sub,
      }}
    >
      <div>{title}</div>
      <button
        onClick={onCopy}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
        }}
        aria-label="Copy content"
      >
        ⧉
      </button>
    </div>
  );
}
