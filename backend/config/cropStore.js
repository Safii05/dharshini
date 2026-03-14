let crops = [
  { id: 1, name: 'Tomatoes', stage: 'Flowering', health: 'Healthy', type: 'Vegetable', image: '/crops/tomato.png' },
  { id: 2, name: 'Green Chillies', stage: 'Harvesting', health: 'Healthy', type: 'Vegetable', image: '/crops/chilli.png' },
  { id: 3, name: 'Eggplant', stage: 'Fruiting', health: 'At Risk', type: 'Vegetable', image: '/crops/eggplant.png' },
  { id: 4, name: 'Cabbage', stage: 'Growth', health: 'Healthy', type: 'Vegetable', image: '/crops/cabbage.png' }
];

const getCrops = () => crops;

const addCrop = (crop) => {
  const newCrop = { ...crop, id: crops.length > 0 ? Math.max(...crops.map(c => c.id)) + 1 : 1 };
  crops.push(newCrop);
  return newCrop;
};

const deleteCrop = (id) => {
  const initialLength = crops.length;
  crops = crops.filter(c => c.id !== parseInt(id));
  return crops.length < initialLength;
};

module.exports = { getCrops, addCrop, deleteCrop };
