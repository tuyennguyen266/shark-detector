
// Return: level of unusual from 0 -> n times
const detectUnusualVolume = (volume, volumeAverage) => {
  if (volume < volumeAverage * 2) {
    return 0;
  }
  return Math.round(volume / volumeAverage);
}

module.exports = {
    detectUnusualVolume
}