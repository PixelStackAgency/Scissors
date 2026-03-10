// src/components/Logo.tsx
'use client';
import Image from 'next/image';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 48, showText = false, className = '' }: LogoProps) {
  if (showText) {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <Image src="/logo.png" alt="Scissors Men's Beauty Lounge" width={size} height={size}
          style={{ width: size, height: size, objectFit: 'contain' }} priority />
      </div>
    );
  }
  return (
    <Image src="/logo.png" alt="Scissors" width={size} height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      priority />
  );
}
