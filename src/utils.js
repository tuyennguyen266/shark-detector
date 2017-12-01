const averageOf = (values) => {
  const sum = values.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  return sum / values.length;
}

const getCurrentTimestamp = () => {
  return Math.round((new Date()).getTime() / 1000);
}

module.exports = {
  averageOf,
  getCurrentTimestamp
}
