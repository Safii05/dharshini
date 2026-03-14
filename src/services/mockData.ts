export const traineesData = [
  { id: 1, name: "Arun Kumar", group: "Morning A", efficiency: "92%", status: "Active" },
  { id: 2, name: "Priya S.", group: "Evening B", efficiency: "88%", status: "On Leave" },
  { id: 3, name: "Karthik R.", group: "Morning A", efficiency: "95%", status: "Active" },
  { id: 4, name: "Lakshmi M.", group: "Morning B", efficiency: "79%", status: "Training" },
  { id: 5, name: "Rahul Dev", group: "Evening B", efficiency: "91%", status: "Active" },
];

export const tasksData = [
  { id: 1, title: "Soil Preparation", zone: "Zone A", urgency: "Urgent", status: "In Progress", scheduled_date: "2026-03-14", assignee: "Arjun Das" },
  { id: 2, title: "Organic Spray", zone: "Zone C", urgency: "Medium", status: "Pending", scheduled_date: "2026-03-14", assignee: "Priya Singh" },
  { id: 3, title: "Seed Sowing", zone: "Zone B", urgency: "Low", status: "Completed", scheduled_date: "2026-03-13", assignee: "Rohan Mehra" },
  { id: 4, title: "Irrigation Check", zone: "General", urgency: "Urgent", status: "In Progress", scheduled_date: "2026-03-15", assignee: "Sita Devi" },
];

export const cropStatusData = [
  { name: "Tomatoes", stage: "Flowering", health: "Healthy", type: "Vegetable" },
  { name: "Green Chillies", stage: "Harvesting", health: "Healthy", type: "Spice" },
  { name: "Eggplant", stage: "Seedling", health: "Pests Detected", type: "Vegetable" },
  { name: "Cabbage", stage: "Growth", health: "Healthy", type: "Vegetable" },
];

export const attendanceProductionData = [
  { date: "2024-05-10", attendance: "42/45", yield: "120 kg", quality: "8.5/10" },
  { date: "2024-05-09", attendance: "40/45", yield: "115 kg", quality: "8.2/10" },
  { date: "2024-05-08", attendance: "44/45", yield: "135 kg", quality: "9.0/10" },
  { date: "2024-05-07", attendance: "39/45", yield: "100 kg", quality: "7.8/10" },
];

export const inventoryData = [
  { item: "Hybrid Tomato Seeds", category: "Seeds", stock: "45", unit: "Packets" },
  { item: "Organic Compost", category: "Fertilizer", stock: "120", unit: "kg" },
  { item: "Hand Trowel", category: "Tools", stock: "15", unit: "Units" },
  { item: "Bio-Pesticide", category: "Chemicals", stock: "8", unit: "Liters" },
];

export const userAttendanceData = [
  { date: "2024-05-14", status: "Present", activity: "Module 1 Assessment" },
  { date: "2024-05-13", status: "Present", activity: "Field Training Zone A" },
  { date: "2024-05-12", status: "Present", activity: "Plantation Basics" },
  { date: "2024-05-11", status: "Absent", activity: "-" },
];

export const quizQuestions = [
  { 
    id: 1,
    q: "What is the best time to water crops?", 
    options: ["Evening", "Noon", "Early Morning", "Midnight"], 
    correct: 2 
  },
  { 
    id: 2,
    q: "Which tool is used for loosening soil?", 
    options: ["Spade", "Hoe", "Scissors", "Rake"], 
    correct: 1 
  },
  { 
    id: 3,
    q: "What does N-P-K stand for in fertilizers?", 
    options: ["New Plant Killer", "Nitrogen-Phosphorus-Potassium", "Natural-Pure-Kind", "None"], 
    correct: 1 
  }
];
