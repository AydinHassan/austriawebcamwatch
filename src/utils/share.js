export const createShareLink = (cams) => {
  const camIds = cams.map(cam => cam.id)
  const compressed = btoa(JSON.stringify(camIds))
  const shareUrl = `${window.location.origin}/share?c=${compressed}`

  navigator.clipboard.writeText(shareUrl)

  return shareUrl;
}
