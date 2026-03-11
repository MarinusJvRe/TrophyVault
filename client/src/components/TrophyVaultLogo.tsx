import trophyVaultLogo from "@assets/honor_hunt_logo_v2.png";

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
