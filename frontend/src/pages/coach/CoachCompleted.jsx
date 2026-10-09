import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { StatusPill } from '../../components/StatusPill';
import { YouTubeEmbed } from '../../components/YouTubeEmbed';
import { api } from '../../api';
import { CheckCircle2, X, Star } from 'lucide-react';

export const CoachCompleted = () => {
  const location = useLocation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(location.state?.message || '');

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    const loadCompleted = async () => {
      try {
        const data = await api.getCoachReviews('completed');
        setReviews(data || []);
      } catch (err) {
        console.error('Failed to load completed reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCompleted();
  }, []);

  const openReviewModal = (r) => {
    setSelectedReview(r);
    setModalOpen(true);
  };

  return (
    <Shell
      title="Completed Reviews"
      subtitle="Evaluations and training blueprints delivered to students."
    >
      {toastMessage && (
        <div className="mb-6 p-4 rounded-input bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="app-card py-16 text-center text-slate-400">
          No completed reviews yet.
        </div>
      ) : (
        <div className="app-card overflow-hidden p-0">
          <div className="divide-y divide-surface-border">
            {reviews.map((r) => {
              const compDate = r.completed_at
                ? new Date(r.completed_at).toLocaleDateString('en-GB')
                : 'Recently';

              return (
                <div
                  key={r.id}
                  onClick={() => openReviewModal(r)}
                  className="h-[74px] px-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-navy text-base">
                      {r.player_name || 'Player'}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm font-medium text-slate-600">
                      {r.review_type} Review
                    </span>
                  </div>

                  <div className="flex items-center space-x-6">
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                      Completed {compDate}
                    </span>
                    <StatusPill status="completed" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Read-Only Feedback Modal */}
      {modalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[20px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-surface-border relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-heading font-extrabold text-3xl text-navy mb-1">
              {selectedReview.review_type} Review
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Player: {selectedReview.player_name} · Completed on{' '}
              {selectedReview.completed_at
                ? new Date(selectedReview.completed_at).toLocaleDateString('en-GB')
                : 'Recently'}
            </p>

            {/* YouTube Player */}
            <div className="mb-6">
              <YouTubeEmbed
                videoId={selectedReview.youtube_id}
                url={selectedReview.youtube_url}
              />
            </div>

            {/* Question */}
            <div className="mb-6 p-4 rounded-card bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                PLAYER'S QUESTION
              </span>
              <p className="text-sm font-semibold text-navy">
                "{selectedReview.question}"
              </p>
            </div>

            {/* 7 Feedback Sections */}
            <div className="space-y-4">
              {selectedReview.feedback?.technical_mistakes && (
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    TECHNICAL MISTAKES
                  </span>
                  <p className="text-sm text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    {selectedReview.feedback.technical_mistakes}
                  </p>
                </div>
              )}

              {selectedReview.feedback?.strengths && (
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    STRENGTHS
                  </span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedReview.feedback.strengths}
                  </p>
                </div>
              )}

              {selectedReview.feedback?.areas_to_improve && (
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    AREAS TO IMPROVE
                  </span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedReview.feedback.areas_to_improve}
                  </p>
                </div>
              )}

              {selectedReview.feedback?.recommended_drills && (
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    RECOMMENDED DRILLS
                  </span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedReview.feedback.recommended_drills}
                  </p>
                </div>
              )}

              {selectedReview.feedback?.match_advice && (
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    MATCH ADVICE
                  </span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedReview.feedback.match_advice}
                  </p>
                </div>
              )}

              {selectedReview.feedback?.additional && (
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    ADDITIONAL
                  </span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedReview.feedback.additional}
                  </p>
                </div>
              )}

              {selectedReview.feedback?.overall_assessment && (
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    OVERALL ASSESSMENT
                  </span>
                  <p className="text-sm font-medium text-forest-dark bg-forest/5 p-3 rounded-xl border border-forest/15">
                    {selectedReview.feedback.overall_assessment}
                  </p>
                </div>
              )}
            </div>

            {/* Rating if present */}
            {selectedReview.rating && (
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Student Rating</span>
                <div className="flex items-center text-gold font-bold text-sm">
                  <Star className="w-4 h-4 fill-gold text-gold mr-1" />
                  <span>{selectedReview.rating} Stars</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
};
