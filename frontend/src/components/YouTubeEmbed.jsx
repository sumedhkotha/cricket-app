import React from 'react';

export const YouTubeEmbed = ({ videoId, url, className = '' }) => {
  let id = videoId;
  if (!id && url) {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (match) id = match[1];
  }

  if (!id) {
    return (
      <div className={`aspect-video w-full bg-slate-900 rounded-card flex items-center justify-center text-slate-400 ${className}`}>
        No video available
      </div>
    );
  }

  return (
    <div className={`relative aspect-video w-full rounded-card overflow-hidden bg-black shadow-elevated border border-surface-border ${className}`}>
      <iframe
        src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
        title="Cricket Vault Review Video"
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};
