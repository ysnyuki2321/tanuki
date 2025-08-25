import Image from "next/image"

interface TanukiLogoProps {
  size?: number
  className?: string
}

export function TanukiLogo({ size = 40, className = "" }: TanukiLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image src="/tanuki-logo.svg" alt="Tanuki Logo" width={size} height={size} className="rounded-lg" />
      <span className="text-2xl font-bold text-foreground">tanuki</span>
    </div>
  )
}
