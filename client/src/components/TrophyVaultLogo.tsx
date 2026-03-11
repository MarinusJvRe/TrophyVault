import trophyVaultLogo from "@assets/image_1773256452663.png";

interface TrophyVaultLogoProps {
  className?: string;
}

export default function TrophyVaultLogo({ className }: TrophyVaultLogoProps) {
  return (
    <img
      src={trophyVaultLogo}
      alt="Trophy Vault"
      className={`object-contain ${className ?? ""}`}
    />
  );
}
