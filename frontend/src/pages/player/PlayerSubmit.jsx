import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { api } from '../../api';
import { PlayCircle, AlertCircle, Sparkles, Send, Lock, ArrowRight } from 'lucide-react';

export const PlayerSubmit = () => {
  const navigate = useNavigate();
  const [subData, setSubData] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [reviewType, setReviewType] = useState('Batting');
  const [question, setQuestion] = useState('');
  const [notes, setNotes] = useState('');

  const [extractedId, setExtractedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSub = async () => {
      try {
        const data = await api.getPlayerSubscription();
        setSubData(data?.subscription);
      } catch (err) {
        console.error('Failed to load subscription:', err);
      } finally {
        setLoadingSub(false);
      }
    };
    loadSub();
  }, []);

  // Extract YouTube ID dynamically
  const extractId = (url) => {
    const patterns = [
      /(?:v=|\/)([0-9A-Za-z_-]{11}).*/,
      /(?:embed\/)([0-9A-Za-z_-]{11})/,
      /(?:youtu\.be\/)([0-9A-Za-z_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    if (url.trim().length === 11 && /^[0-9A-Za-z_-]{11}$/.test(url.trim())) {
      return url.trim();
    }
    return null;
  };

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setYoutubeUrl(val);
    const id = extractId(val);
    setExtractedId(id);
  };

  const hasRemainingReviews = subData && (subData.reviews_remaining || 0) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!hasRemainingReviews) {
      setError('You need an active plan with reviews remaining.');
      return;
    }

    if (!extractedId) {
      setError('Please provide a valid YouTube video link (e.g. https://www.youtube.com/watch?v=...)');
      return;
    }

    if (!question.trim()) {
      setError('Please enter your specific question for the coach.');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitPlayerReview({
        youtube_url: youtubeUrl,
        review_type: reviewType,
        question: question.trim(),
        notes: notes.trim(),
      });
      navigate('/player/reviews', {
        state: { message: 'Video review submitted successfully! A coach will review it shortly.' },
      });
    } catch (err) {
      setError(err.message || 'Failed to submit review');
      setSubmitting(false);
    }
  };

  return (
    <Shell
      title="Submit Video for Review"
      subtitle="Paste a YouTube link. Within 48 hours a coach will send detailed feedback."
    >
      <div className="max-w-[840px]">
        {/* Subscription Requirement Lock Card */}
        {!loadingSub && !hasRemainingReviews ? (
          <div className="app-card border-2 border-gold/40 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 p-8 sm:p-12 text-center rounded-[28px] shadow-lg animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gold/15 text-gold-dark flex items-center justify-center mx-auto mb-5 shadow-2xs">
              <Lock className="w-8 h-8" />
            </div>
            <span className="inline-block px-3 py-1 bg-gold/20 text-gold-dark font-bold text-xs rounded-full uppercase tracking-wider mb-2">
              Subscriber Only Feature
            </span>
            <h2 className="font-heading font-extrabold text-3xl text-navy mb-3">
              This Feature Requires an Active Subscription
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6 leading-relaxed">
              Video technique submissions, frame-by-frame flaw detection, and personalized corrective drills from accredited BCCI & ECB coaches are reserved for active Cricket Vault subscribers.
            </p>

            <div className="inline-flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 mb-8 text-xs text-slate-700 shadow-2xs">
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span className="font-semibold">Elite Coaching Plan: 4 comprehensive reviews & direct coach chat for ₹699/month.</span>
            </div>

            <div>
              <button
                onClick={() => navigate('/player/plans')}
                className="px-6 py-3.5 bg-forest hover:bg-forest-light text-white text-sm font-bold rounded-xl transition-all shadow-md inline-flex items-center space-x-2 group"
              >
                <span>View Subscription Plans</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 rounded-input bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="app-card p-8 sm:p-10 shadow-soft">
              <form onSubmit={handleSubmit} className="space-y-6">
            {/* YouTube URL */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                YouTube Video URL *
              </label>
              <input
                type="text"
                required
                value={youtubeUrl}
                onChange={handleUrlChange}
                placeholder="https://youtube.com/watch?v=..."
                className="app-input"
              />
              <p className="text-xs text-slate-400 mt-1">
                Upload your training video as Unlisted or Public on YouTube and paste the link here.
              </p>
            </div>

            {/* Thumbnail Preview */}
            {extractedId && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-4 animate-in fade-in">
                <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-slate-300">
                  <img
                    src={`https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-forest block">
                    Video Recognized
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ID: {extractedId}</span>
                </div>
              </div>
            )}

            {/* Review Type */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Review Type *
              </label>
              <select
                value={reviewType}
                onChange={(e) => setReviewType(e.target.value)}
                className="app-input"
              >
                <option value="Batting">Batting</option>
                <option value="Bowling">Bowling</option>
                <option value="Fielding">Fielding</option>
                <option value="Fitness">Fitness</option>
                <option value="Wicketkeeping">Wicketkeeping</option>
              </select>
            </div>

            {/* Question */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Your Question *
              </label>
              <textarea
                rows={3}
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What specifically do you want help with? (e.g. My cover drive feels mistimed...)"
                className="app-textarea"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Additional Notes (optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any timestamps or context (e.g. check 0:15 - front knee collapses occasionally)"
                className="app-textarea"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || !hasRemainingReviews}
                className={`w-full btn-primary h-12 text-base font-bold shadow-md flex items-center justify-center space-x-2 ${
                  !hasRemainingReviews ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit for Review'}</span>
              </button>
            </div>
          </form>
        </div>
        </>
        )}
      </div>
    </Shell>
  );
};
