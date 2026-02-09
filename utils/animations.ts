export const globalStyles = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  .custom-shake {
    animation: shake var(--anim-duration, 0.5s) cubic-bezier(.36,.07,.19,.97) both;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .custom-fade-in {
    animation: fadeIn var(--anim-duration, 1s) ease-out forwards;
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .custom-slide-up {
    animation: slideUp var(--anim-duration, 0.5s) ease-out forwards;
  }

  @keyframes pulseScale {
    0% { transform: scale(1); }
    50% { transform: scale(var(--anim-scale, 1.05)); }
    100% { transform: scale(1); }
  }
  .custom-pulse {
    animation: pulseScale var(--anim-duration, 2s) infinite ease-in-out;
  }

  /* Tailwind mappings to support custom duration */
  .animate-spin {
    animation: spin var(--anim-duration, 1s) linear infinite;
  }
  .animate-ping {
    animation: ping var(--anim-duration, 1s) cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  .animate-bounce {
    animation: bounce var(--anim-duration, 1s) infinite;
  }

  /* Carousel Slide Animations */
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .slide-in-right {
    animation: slideInRight 0.5s ease-out forwards;
  }

  @keyframes slideOutLeft {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(-100%); opacity: 0; }
  }
  .slide-out-left {
    animation: slideOutLeft 0.5s ease-out forwards;
  }

  @keyframes slideInLeft {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .slide-in-left {
    animation: slideInLeft 0.5s ease-out forwards;
  }

  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  .slide-out-right {
    animation: slideOutRight 0.5s ease-out forwards;
  }
`;