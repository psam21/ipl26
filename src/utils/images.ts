export function getPlayerImageUrl(teamCode: string, playerName: string): string {
  const sanitizedName = playerName
    .toLowerCase()
    .replace(/✈️/g, '') // Remove plane icon
    .replace(/\(c\)/g, '') // Remove captain tag
    .replace(/\(wk\)/g, '') // Remove wicket keeper tag
    .replace(/[^a-z0-9\s_]/g, '') // Remove special chars except spaces and underscores
    .trim()
    .replace(/\s+/g, '_'); // Replace spaces with underscores

  return `/images/players/${teamCode}/${sanitizedName}.png`;
}
