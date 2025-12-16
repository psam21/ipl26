export function getPlayerImageUrl(teamCode: string, playerName: string): string {
  // Special cases mapping
  const specialCases: Record<string, string> = {
    'rasikh salam': 'rasikh_dar',
    // Add more special cases here if needed
  };

  const sanitizedName = playerName
    .toLowerCase()
    .replace(/✈️/g, '') // Remove plane icon
    .replace(/\(c\)/g, '') // Remove captain tag
    .replace(/\(wk\)/g, '') // Remove wicket keeper tag
    .replace(/[^a-z0-9\s_]/g, '') // Remove special chars except spaces and underscores
    .trim()
    .replace(/\s+/g, '_'); // Replace spaces with underscores

  // Check if we have a special mapping for this name (replacing underscores with spaces for lookup)
  const lookupName = sanitizedName.replace(/_/g, ' ');
  if (specialCases[lookupName]) {
    return `/images/players/${teamCode}/${specialCases[lookupName]}.png`;
  }

  return `/images/players/${teamCode}/${sanitizedName}.png`;
}
