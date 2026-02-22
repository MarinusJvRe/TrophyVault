import trophyVaultLogo from "@assets/1771685444234_edit_63733598053289_1771685576340.png";

interface TrophyVaultLogoProps {
  className?: string;
}

export default function TrophyVaultLogo({ className }: TrophyVaultLogoProps) {
  return (
    <img
      src={trophyVaultLogo}
      alt="TrophyVault"
      className={`object-contain ${className ?? ""}`}
    />
  );
}
