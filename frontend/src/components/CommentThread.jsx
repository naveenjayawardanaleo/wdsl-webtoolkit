import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

function Reply({ reply }) {
  return (
    <div className="ml-6 mt-3 rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{reply.author_email} &middot; {reply.author_role}</p>
      <p className="mt-1 text-sm text-slate-700">{reply.comment_text}</p>
    </div>
  );
}

function Thread({ thread, onReply, onClose, canReply, canClose }) {
  const [replyText, setReplyText] = useState('');
  const isOpen = thread.status === 'open';

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${isOpen ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{thread.author_email} &middot; {thread.author_role}</p>
          <p className="mt-1 text-slate-800">{thread.comment_text}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase ${isOpen ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'}`}>
          {thread.status}
        </span>
      </div>

      {thread.replies.map((reply) => (
        <Reply key={reply.comment_id} reply={reply} />
      ))}

      {isOpen && canReply && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!replyText.trim()) return;
            onReply(thread.comment_id, replyText);
            setReplyText('');
          }}
          className="mt-3 flex gap-2"
        >
          <label htmlFor={`reply-${thread.comment_id}`} className="sr-only">
            Reply to this thread
          </label>
          <input
            id={`reply-${thread.comment_id}`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply as the developer…"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
            Reply
          </button>
        </form>
      )}

      {isOpen && canClose && (
        <button onClick={() => onClose(thread.comment_id)} className="mt-3 text-sm font-medium text-brand-600 hover:underline">
          Mark resolved &amp; close thread
        </button>
      )}
    </div>
  );
}

export default function CommentThread({ reportId }) {
  const { token, user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');

  const refresh = () => apiFetch(`/reports/${reportId}/comments`, { token }).then(setThreads);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const openComment = async (event) => {
    event.preventDefault();
    setError('');
    if (!newComment.trim()) return;
    try {
      await apiFetch(`/reports/${reportId}/comments`, { method: 'POST', body: { comment_text: newComment }, token });
      setNewComment('');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const reply = async (commentId, text) => {
    try {
      await apiFetch(`/comments/${commentId}/replies`, { method: 'POST', body: { comment_text: text }, token });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const close = async (commentId) => {
    try {
      await apiFetch(`/comments/${commentId}/close`, { method: 'PATCH', token });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const openThreads = threads.filter((t) => t.status === 'open');
  const closedThreads = threads.filter((t) => t.status === 'closed');

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Collaboration hub</h2>

      {user?.role === 'client' && (
        <form onSubmit={openComment} className="mb-6 flex gap-2">
          <label htmlFor="new-comment" className="sr-only">
            Ask your developer a question about this report
          </label>
          <input
            id="new-comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ask your developer a question about this report…"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
          <button type="submit" className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700">
            Open thread
          </button>
        </form>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {threads.length === 0 && <p className="text-slate-500">No comments yet.</p>}

      {openThreads.length > 0 && (
        <div className="mb-6 space-y-3">
          {openThreads.map((t) => (
            <Thread
              key={t.comment_id}
              thread={t}
              onReply={reply}
              onClose={close}
              canReply={user?.role === 'developer'}
              canClose={user?.role === 'client' && t.user_id === user?.user_id}
            />
          ))}
        </div>
      )}

      {closedThreads.length > 0 && (
        <>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Closed</h3>
          <div className="space-y-3">
            {closedThreads.map((t) => (
              <Thread key={t.comment_id} thread={t} onReply={reply} onClose={close} canReply={false} canClose={false} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
