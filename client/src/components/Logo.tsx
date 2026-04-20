import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 'md', 
  showText = true,
  textColor = "text-white"
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12"
  };

  const textClasses = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative overflow-hidden rounded-lg flex items-center justify-center bg-yellow-500/10`}>
        {!imgError ? (
          <img 
            src="/assets/logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain animate-pulse"
            onError={() => setImgError(true)}
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))',
            }}
          />
        ) : (
          <span className="text-yellow-500 font-black text-xl animate-pulse">₿</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-transparent animate-pulse pointer-events-none"></div>
      </div>
      {showText && (
        <span className={`${textClasses[size]} font-black tracking-tighter ${textColor} uppercase`}>
          DIGGING <span className="text-orange-500">POOL</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
