import trophyVaultLogo from "@assets/trophy_vault_logo_transparent.png";

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
