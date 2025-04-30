const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <svg 
      className={`w-10 h-10 ${className}`} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" fill="currentColor"/>
      <path d="M20 2H8C6.9 2 6 2.9 6 4v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor"/>
      <path d="M12 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="#FFFFFF"/>
    </svg>
  );
};

export default Logo;
