import trophyVaultLogo from "@assets/honor_the_hunt_logo.png";

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
