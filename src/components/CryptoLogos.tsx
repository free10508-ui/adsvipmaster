import React from 'react';

interface LogoProps {
  className?: string;
}

export const TetherLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path
      fill="#FFFFFF"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-1.005-6.79-2.003 0-1.001 2.902-1.836 6.79-2.003v3.238c.25.014.965.044 1.978.044 1.258 0 1.825-.035 1.935-.044V13.38c3.88.17 6.772 1.002 6.772 2 0 .997-2.892 1.83-6.772 2m0-6.49V8.082h5.597V4.5H8.461v3.582h5.51v2.811c-4.48.204-7.85 1.258-7.85 2.527 0 1.27 3.37 2.325 7.85 2.529v8.471h3.951v-8.47c4.473-.204 7.834-1.259 7.834-2.53 0-1.269-3.361-2.323-7.834-2.527"
    />
  </svg>
);

export const BinanceLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#F0B90B" />
    <path
      fill="#1E2026"
      d="M16 7.5L19.2 10.7L16 13.9L12.8 10.7L16 7.5ZM9.6 13.9L12.8 17.1L9.6 20.3L6.4 17.1L9.6 13.9ZM22.4 13.9L25.6 17.1L22.4 20.3L19.2 17.1L22.4 13.9ZM16 15.3L17.7 17L16 18.7L14.3 17L16 15.3ZM16 20.1L19.2 23.3L16 26.5L12.8 23.3L16 20.1Z"
    />
  </svg>
);

export const TronLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#EB0029" />
    <path
      fill="#FFFFFF"
      d="M7.2 8.6L24.8 12.6L16.2 26.2L7.2 8.6ZM9.7 10.7L21.3 13.3L11.5 14.7L9.7 10.7ZM13 16.1L20.6 15L15.5 23L13 16.1ZM9.1 12.9L11.4 18L13.1 22.7L9.1 12.9Z"
    />
  </svg>
);

export const PolygonLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#8247E5" />
    <path
      fill="#FFFFFF"
      d="M21.5 13.2L17.8 11V7L21.5 9.2V13.2ZM14.2 17.5L10.5 15.3V11.3L14.2 13.5V17.5ZM14.2 25L10.5 22.8V18.8L14.2 21V25ZM21.5 21L17.8 18.8V14.8L21.5 17V21ZM17.8 18.8L21.5 16.6L17.8 14.4L14.2 16.6L17.8 18.8Z"
    />
  </svg>
);

export const EthereumLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#627EEA" />
    <path fill="#FFFFFF" fillOpacity="0.6" d="M16 5V13.8L23.2 17.1L16 5Z" />
    <path fill="#FFFFFF" d="M16 5L8.8 17.1L16 13.8V5Z" />
    <path fill="#FFFFFF" fillOpacity="0.6" d="M16 22.1V27.7L23.2 17.5L16 22.1Z" />
    <path fill="#FFFFFF" d="M16 27.7V22.1L8.8 17.5L16 27.7Z" />
    <path fill="#FFFFFF" fillOpacity="0.2" d="M16 20.8L23.2 17.1L16 13.8V20.8Z" />
    <path fill="#FFFFFF" fillOpacity="0.6" d="M8.8 17.1L16 20.8V13.8L8.8 17.1Z" />
  </svg>
);

export const UsdcLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#2775CA" />
    <path
      fill="#FFFFFF"
      d="M16 5.5C10.2 5.5 5.5 10.2 5.5 16C5.5 21.8 10.2 26.5 16 26.5C21.8 26.5 26.5 21.8 26.5 16C26.5 10.2 21.8 5.5 16 5.5ZM16.2 22.6C14.1 22.6 12.6 21.8 11.9 20.5L13.5 19.4C14 20.3 15 20.8 16.2 20.8C17.5 20.8 18.2 20.2 18.2 19.3C18.2 18.4 17.5 17.9 15.9 17.4C13.8 16.8 12.4 16.1 12.4 14.3C12.4 12.7 13.7 11.6 15.6 11.3V9.5H17V11.3C18.8 11.6 20 12.5 20.6 13.5L19 14.5C18.5 13.8 17.8 13.2 16.7 13.2C15.5 13.2 14.9 13.8 14.9 14.6C14.9 15.4 15.5 15.9 17.1 16.3C19.4 16.9 20.7 17.7 20.7 19.5C20.7 21.2 19.3 22.4 17.3 22.7V24.5H16.2V22.6Z"
    />
  </svg>
);

export const BitcoinLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#F7931A" />
    <path
      fill="#FFFFFF"
      d="M22.8 13.9C23.2 11.6 21.4 10.4 19 9.6L19.8 6.5L17.9 6L17.1 9.1C16.6 9 16.1 8.8 15.6 8.7L16.4 5.6L14.5 5.1L13.7 8.3C13.3 8.2 12.8 8.1 12.4 8L9.8 7.3L9.3 9.4C9.3 9.4 10.7 9.7 10.7 9.8C11.5 10 11.7 10.5 11.6 10.9L10.6 14.7C10.7 14.7 10.7 14.7 10.8 14.8L10.6 14.7L9.4 19.8C9.3 20.1 9 20.5 8.4 20.4C8.4 20.4 7 20 7 20L6 22.2L8.5 22.9C9 23 9.5 23.2 9.9 23.3L9.1 26.5L11 27L11.8 23.8C12.3 23.9 12.8 24.1 13.3 24.2L12.5 27.4L14.4 27.9L15.2 24.6C18.6 25.3 21.1 25 22.1 21.9C22.9 19.5 22.1 18 20.2 17.1C21.5 16.5 22.5 14.9 22.8 13.9ZM19.5 20.4C18.9 22.9 14.8 21.5 13.5 21.1L14.5 16.8C15.8 17.1 20.1 17.8 19.5 20.4ZM20.1 13.8C19.5 16 16.1 14.8 14.9 14.5L15.8 10.6C17 10.9 20.6 11.6 20.1 13.8Z"
    />
  </svg>
);
