import React from 'react';

/**
 * CricketSeam - A restrained, authentic cricket ball seam motif.
 * Uses subtle gold/white stitches to give the interface an elevated, authentic cricket identity.
 */
export const CricketSeam = ({ className = '', height = 6 }) => {
  return (
    <div className={`w-full overflow-hidden flex items-center opacity-70 ${className}`} aria-hidden="true">
      <svg
        className="w-full"
        height={height}
        viewBox="0 0 400 8"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Central seam groove */}
        <line x1="0" y1="4" x2="400" y2="4" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        
        {/* Upper diagonal stitch pattern */}
        <line x1="0" y1="1.5" x2="400" y2="1.5" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 6" />
        
        {/* Lower diagonal stitch pattern offset */}
        <line x1="2" y1="6.5" x2="402" y2="6.5" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 6" />
      </svg>
    </div>
  );
};
