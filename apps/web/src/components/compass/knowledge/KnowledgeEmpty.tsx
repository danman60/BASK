import type { ReactNode } from 'react';

/**
 * A small empty-and-error state component. 
 * Displays a title, body, and optionally a raw database error message.
 */
export function KnowledgeEmpty({ title, body, error }: { title: string; body: string; error?: string }) {
  return (
    <div className="cp-empty">
      <h3>{title}</h3>
      <p>{body}</p>
      {error && (
        <pre className="cp-error-block">
          {error}
        </pre>
      )}
    </div>
  );
}
