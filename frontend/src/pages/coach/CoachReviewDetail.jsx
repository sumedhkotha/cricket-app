import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Shell } from '../../components/Shell';
import { YouTubeEmbed } from '../../components/YouTubeEmbed';
import { api } from '../../api';
import { ArrowLeft, Save, Send, AlertCircle, CheckCircle2, User, HelpCircle } from 'lucide-react';

export const CoachReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const [feedback, setFeedback] = useState({
    technical_mistakes: '',
    strengths: '',
    areas_to_improve: '',
    recommended_drills: '',
    match_advice: '',
    additional: '',
    overall_assessment: '',
  });

  useEffect(() => {
    const loadReview = async () => {
      try {
        const data = await api.getCoachReviewDetail(id);
        setReview(data);
        if (data.feedback) {
          setFeedback((prev) => ({
            ...prev,
            ...data.feedback,
          }));
        }
        // Start review if in assigned state
        if (data.status === 'assigned') {
          api.startCoachReview(id).catch(console.error);
        }
      } catch (err) {
        setError(err.message || 'Failed to load review details');
      } finally {
        setLoading(false);
      }
    };
    loadReview();
  }, [id]);

  const handleFeedbackChange = (field, value) => {
    setFeedback((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    setError('');
    setSaving(true);
    try {
      await api.saveCoachDraft(id, feedback);
      setToastMessage('Draft saved successfully.');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation: Technical Mistakes & Overall Assessment required
    if (!feedback.technical_mistakes.trim()) {
      setError('Technical Mistakes section is required.');
      return;
    }
    if (!feedback.overall_assessment.trim()) {
      setError('Overall Assessment section is required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitCoachReview(id, feedback);
      navigate('/coach/completed', {
        state: { message: 'Review completed and submitted successfully!' },
      });
    } catch (err) {
      setError(err.message || 'Failed to submit review');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      </Shell>
    );
  }

  if (!review) {
    return (
      <Shell>
        <div className="app-card py-12 text-center text-red-500">
          Review not found or you are not authorized to view it.
        </div>
      </Shell>
    );
  }

  const player = review.player || {};

  return (
    <Shell>
      {/* Back Link */}
      <div className="mb-6">
        <Link
          to="/coach/pending"
          className="inline-flex items-center text-sm font-bold text-forest hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Pending Reviews
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-4xl text-navy tracking-tight">
          Review: {review.review_type} - {player.name || 'Player'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Evaluate player biomechanics and prescribe corrective drills.
        </p>
      </div>

      {toastMessage && (
        <div className="mb-6 p-4 rounded-input bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-input bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Two Column Layout: Left Video/Question + Right Player Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Video + Question Card (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <YouTubeEmbed videoId={review.youtube_id} url={review.youtube_url} />

          <div className="app-card">
            <div className="flex items-center space-x-2 mb-3">
              <HelpCircle className="w-5 h-5 text-forest" />
              <h2 className="font-heading font-bold text-xl text-navy">Player's Question</h2>
            </div>
            <p className="text-base font-semibold text-navy leading-relaxed">
              "{review.question}"
            </p>
            {review.notes && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Additional Player Notes:
                </span>
                <p className="text-sm text-slate-600 italic leading-relaxed">{review.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Player Profile Card */}
        <div className="app-card h-fit">
          <div className="flex items-center space-x-2 mb-5 pb-3 border-b border-surface-border">
            <User className="w-5 h-5 text-forest" />
            <h2 className="font-heading font-bold text-xl text-navy">Player Profile</h2>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 text-xs font-bold uppercase">Name</span>
              <span className="font-semibold text-navy">{player.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 text-xs font-bold uppercase">Age</span>
              <span className="font-semibold text-navy">{player.age || '17'} yrs</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 text-xs font-bold uppercase">Location</span>
              <span className="font-semibold text-navy">{player.location || 'Pune, India'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 text-xs font-bold uppercase">Playing Role</span>
              <span className="font-semibold text-navy">{player.playing_role || 'Batter'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 text-xs font-bold uppercase">Batting Style</span>
              <span className="font-semibold text-navy">{player.batting_style || 'Right Hand'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 text-xs font-bold uppercase">Bowling Style</span>
              <span className="font-semibold text-navy">{player.bowling_style || 'None'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 text-xs font-bold uppercase">Experience</span>
              <span className="font-semibold text-forest">{player.experience || 'Intermediate'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Your Feedback Card with 7 labelled textareas */}
      <div className="app-card">
        <h2 className="font-heading font-extrabold text-3xl text-navy mb-6">
          Your Feedback
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. TECHNICAL MISTAKES (required) */}
          <div>
            <label className="block text-xs uppercase font-extrabold tracking-wider text-gold-dark mb-2">
              TECHNICAL MISTAKES *
            </label>
            <textarea
              rows={3}
              required
              value={feedback.technical_mistakes}
              onChange={(e) => handleFeedbackChange('technical_mistakes', e.target.value)}
              placeholder="e.g. Head falling across off-stump; weight on back foot."
              className="app-textarea"
            />
          </div>

          {/* 2. STRENGTHS */}
          <div>
            <label className="block text-xs uppercase font-extrabold tracking-wider text-gold-dark mb-2">
              STRENGTHS
            </label>
            <textarea
              rows={2}
              value={feedback.strengths}
              onChange={(e) => handleFeedbackChange('strengths', e.target.value)}
              placeholder="e.g. Good base, nice follow-through."
              className="app-textarea"
            />
          </div>

          {/* 3. AREAS TO IMPROVE */}
          <div>
            <label className="block text-xs uppercase font-extrabold tracking-wider text-gold-dark mb-2">
              AREAS TO IMPROVE
            </label>
            <textarea
              rows={2}
              value={feedback.areas_to_improve}
              onChange={(e) => handleFeedbackChange('areas_to_improve', e.target.value)}
              placeholder="e.g. Head stability and front-foot stride."
              className="app-textarea"
            />
          </div>

          {/* 4. RECOMMENDED DRILLS */}
          <div>
            <label className="block text-xs uppercase font-extrabold tracking-wider text-gold-dark mb-2">
              RECOMMENDED DRILLS
            </label>
            <textarea
              rows={3}
              value={feedback.recommended_drills}
              onChange={(e) => handleFeedbackChange('recommended_drills', e.target.value)}
              placeholder="e.g. Shadow batting with headcam, tee work focusing on front elbow."
              className="app-textarea"
            />
          </div>

          {/* 5. MATCH ADVICE */}
          <div>
            <label className="block text-xs uppercase font-extrabold tracking-wider text-gold-dark mb-2">
              MATCH ADVICE
            </label>
            <textarea
              rows={2}
              value={feedback.match_advice}
              onChange={(e) => handleFeedbackChange('match_advice', e.target.value)}
              placeholder="e.g. Play straight for first 10 balls — don't force the cover drive early."
              className="app-textarea"
            />
          </div>

          {/* 6. ADDITIONAL */}
          <div>
            <label className="block text-xs uppercase font-extrabold tracking-wider text-gold-dark mb-2">
              ADDITIONAL
            </label>
            <textarea
              rows={2}
              value={feedback.additional}
              onChange={(e) => handleFeedbackChange('additional', e.target.value)}
              placeholder="e.g. Film yourself every week."
              className="app-textarea"
            />
          </div>

          {/* 7. OVERALL ASSESSMENT (required) */}
          <div>
            <label className="block text-xs uppercase font-extrabold tracking-wider text-gold-dark mb-2">
              OVERALL ASSESSMENT *
            </label>
            <textarea
              rows={3}
              required
              value={feedback.overall_assessment}
              onChange={(e) => handleFeedbackChange('overall_assessment', e.target.value)}
              placeholder="e.g. Strong fundamentals with specific technical fixes to work on."
              className="app-textarea"
            />
          </div>

          {/* Buttons: Save Draft & Submit Review */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || submitting}
              className="w-full sm:w-auto btn-secondary px-8 font-semibold"
            >
              <Save className="w-4 h-4 mr-2 text-slate-500" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              type="submit"
              disabled={submitting || saving}
              className="w-full sm:w-auto btn-primary px-10 font-bold shadow-md"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting Review...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
};
