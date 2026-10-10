import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { StatusPill } from '../../components/StatusPill';
import { YouTubeEmbed } from '../../components/YouTubeEmbed';
import { api } from '../../api';
import { PlayCircle, X, Star, CheckCircle2, AlertCircle, Clock, Video, PlusCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReviewRowSkeleton } from '../../components/SkeletonLoader';
import { ReviewProgressSteps } from '../../components/ReviewProgressSteps';
import { CricketSeam } from '../../components/CricketSeam';

export const PlayerReviews = () => {
  const location = useLocation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);

  const [ratingStars, setRatingStars] = useState(5);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(location.state?.message || '');

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const loadReviews = async () => {
    try {
      const data = await api.getPlayerReviews();
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to load player reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const openViewModal = (r) => {
    setSelectedReview(r);
    setViewModalOpen(true);
  };

  const openRateModal = (r) => {
    setSelectedReview(r);
    setRatingStars(r.rating || 5);
    setRatingComment(r.rating_comment || '');
    setRateModalOpen(true);
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReview) return;

    setRatingSubmitting(true);
    try {
      await api.rateReview(selectedReview.id, ratingStars, ratingComment);
      setToastMessage('Thanks for your feedback');

      // Update locally
      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReview.id
            ? { ...r, rating: ratingStars, rating_comment: ratingComment }
            : r
        )
      );
      setSelectedReview((prev) =>
        prev ? { ...prev, rating: ratingStars, rating_comment: ratingComment } : null
      );
      setRateModalOpen(false);
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  return (
    <Shell
      title="My Video Reviews"
      subtitle="Track technical evaluations, biomechanics breakdowns and coach drills."
      headerAction={
        <Link
          to="/player/submit"
          className="btn-primary text-xs sm:text-sm px-5 py-2.5 font-bold flex items-center space-x-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit Video</span>
        </Link>
      }
    >
      {toastMessage && (
        <div className="mb-6 p-4 rounded-input bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="py-4">
          <ReviewRowSkeleton count={3} />
        </div>
      ) : reviews.length === 0 ? (
        <div className="app-card py-16 px-6 text-center flex flex-col items-center justify-center max-w-lg mx-auto relative overflow-hidden">
          <div className="w-16 h-16 bg-forest/10 rounded-2xl flex items-center justify-center text-forest mb-4 shadow-2xs">
            <Video className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-navy">No video reviews yet</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6 max-w-sm leading-relaxed">
            Record your net session, batting drill, or bowling run-up. Submit a link to receive a 7-point biomechanics evaluation from our certified coaches.
          </p>
          <Link
            to="/player/submit"
            className="btn-primary text-xs font-bold px-6 py-3 flex items-center space-x-2 shadow-sm"
          >
            <span>Submit Your First Video</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const thumbUrl = r.youtube_id
              ? `https://img.youtube.com/vi/${r.youtube_id}/hqdefault.jpg`
              : 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400';

            const dateStr = r.submitted_at
              ? new Date(r.submitted_at).toLocaleDateString('en-GB')
              : '26/09/2026';

            return (
              <div
                key={r.id}
                className="app-card card-hover flex flex-col justify-between p-6 group"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  {/* Left: Thumbnail & Content */}
                  <div className="flex items-start space-x-4 flex-1">
                    {/* YouTube Thumbnail with hover play zoom */}
                    <div className="relative w-36 sm:w-44 aspect-video rounded-xl overflow-hidden bg-black shrink-0 shadow-xs border border-surface-border group-hover:border-forest/40 transition-colors">
                      <img
                        src={thumbUrl}
                        alt="Review Thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/15 transition-colors">
                        <PlayCircle className="w-8 h-8 text-white/90 drop-shadow-md group-hover:scale-110 transition-transform" />
                      </div>
                    </div>

                    <div className="flex-1">
                      {/* Green Type Pill */}
                      <div className="mb-2">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-heading font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {r.review_type} Review
                        </span>
                      </div>

                      {/* Bold Question */}
                      <h3 className="font-heading font-bold text-xl sm:text-2xl text-navy leading-snug">
                        "{r.question}"
                      </h3>

                      {/* Grey: Submitted DD/MM/YYYY · Coach: <Name> */}
                      <p className="text-xs text-slate-500 mt-1.5 font-medium">
                        Submitted {dateStr} · Coach: <span className="text-navy font-semibold">{r.coach_name || 'Rahul Sharma'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Status Pill + View Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
                    <StatusPill status={r.status} />

                    <button
                      onClick={() => openViewModal(r)}
                      className="btn-secondary text-xs sm:text-sm px-6 py-2 font-semibold hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Pitch Crease Timeline bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <ReviewProgressSteps status={r.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW REVIEW MODAL */}
      {viewModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[20px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-surface-border relative">
            <button
              onClick={() => setViewModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-heading font-extrabold text-3xl text-navy mb-1">
              {selectedReview.review_type} Review
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Coach: {selectedReview.coach_name || 'Rahul Sharma'} · Submitted{' '}
              {selectedReview.submitted_at
                ? new Date(selectedReview.submitted_at).toLocaleDateString('en-GB')
                : '26/09/2026'}
            </p>

            <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <ReviewProgressSteps status={selectedReview.status} />
            </div>

            {/* Embedded YouTube Player */}
            <div className="mb-6">
              <YouTubeEmbed
                videoId={selectedReview.youtube_id}
                url={selectedReview.youtube_url}
              />
            </div>

            {/* YOUR QUESTION (small grey uppercase) */}
            <div className="mb-6 p-4 rounded-card bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                YOUR QUESTION
              </span>
              <p className="text-sm font-semibold text-navy">
                "{selectedReview.question}"
              </p>
            </div>

            {/* 7 Feedback Sections or Pending notice */}
            {selectedReview.status !== 'completed' ? (
              <div className="p-8 rounded-card bg-amber-50/70 border border-amber-200 text-center flex flex-col items-center justify-center my-4">
                <Clock className="w-8 h-8 text-amber-600 mb-2" />
                <h4 className="font-heading font-bold text-xl text-amber-900">
                  Feedback will arrive within 48 hours
                </h4>
                <p className="text-xs text-amber-700 mt-1 max-w-xs">
                  Your assigned coach is currently analyzing your technique and preparing your personalized drills.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. TECHNICAL MISTAKES */}
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    TECHNICAL MISTAKES
                  </span>
                  <p className="text-sm text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    {selectedReview.feedback?.technical_mistakes ||
                      'Head falling across off-stump; weight on back foot.'}
                  </p>
                </div>

                {/* 2. STRENGTHS */}
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    STRENGTHS
                  </span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedReview.feedback?.strengths ||
                      'Good base, nice follow-through.'}
                  </p>
                </div>

                {/* 3. AREAS TO IMPROVE */}
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    AREAS TO IMPROVE
                  </span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedReview.feedback?.areas_to_improve ||
                      'Head stability and front-foot stride.'}
                  </p>
                </div>

                {/* 4. RECOMMENDED DRILLS */}
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    RECOMMENDED DRILLS
                  </span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedReview.feedback?.recommended_drills ||
                      'Shadow batting with headcam, tee work focusing on front elbow.'}
                  </p>
                </div>

                {/* 5. MATCH ADVICE */}
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    MATCH ADVICE
                  </span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedReview.feedback?.match_advice ||
                      "Play straight for first 10 balls — don't force the cover drive early."}
                  </p>
                </div>

                {/* 6. ADDITIONAL */}
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    ADDITIONAL
                  </span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedReview.feedback?.additional || 'Film yourself every week.'}
                  </p>
                </div>

                {/* 7. OVERALL ASSESSMENT */}
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gold-dark block mb-1">
                    OVERALL ASSESSMENT
                  </span>
                  <p className="text-sm font-medium text-forest-dark bg-forest/5 p-3 rounded-xl border border-forest/15">
                    {selectedReview.feedback?.overall_assessment ||
                      'Strong fundamentals with specific technical fixes to work on.'}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom: Rate button or Rated indicator */}
            {selectedReview.status === 'completed' && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                {selectedReview.rating ? (
                  <div className="flex items-center space-x-2 text-sm font-bold text-forest">
                    <CheckCircle2 className="w-4 h-4 text-forest" />
                    <span>You rated this ★ {selectedReview.rating}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      openRateModal(selectedReview);
                    }}
                    className="btn-accent text-xs sm:text-sm px-6 py-2.5 font-bold shadow-xs"
                  >
                    Rate this review
                  </button>
                )}

                <button
                  onClick={() => setViewModalOpen(false)}
                  className="btn-secondary text-xs px-5 py-2"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RATE YOUR COACH MODAL */}
      {rateModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-surface-border relative">
            <button
              onClick={() => setRateModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-navy hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-navy mb-1">
              Rate your coach
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              How helpful was {selectedReview.coach_name || 'Coach Rahul'}'s feedback?
            </p>

            <form onSubmit={handleRatingSubmit} className="space-y-6">
              {/* 5 Clickable Star Icons with Hover Fill Orange */}
              <div className="flex items-center justify-center space-x-3 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(0)}
                    onClick={() => setRatingStars(star)}
                    className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (ratingHover || ratingStars)
                          ? 'fill-gold text-gold'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Optional Textarea */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                  Add a comment (optional)
                </label>
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Share what you learned from this review..."
                  className="app-textarea text-sm"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <button
                  type="submit"
                  disabled={ratingSubmitting}
                  className="w-full btn-accent py-3 font-bold text-sm shadow-xs"
                >
                  {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
                <button
                  type="button"
                  onClick={() => setRateModalOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-navy py-1 text-center"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
};
