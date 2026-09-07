/**
 * Dashboard fixture for the hackathon prototype.
 * This replaces the backend API call so the frontend runs standalone.
 */
export const DASHBOARD_FIXTURE = {
  weather: {
    current: {
      temperature_c: 28,
      rain_chance_pct: 20,
      humidity_pct: 68,
      wind_kmh: 12,
    },
    advisories: [
      {
        tone: 'warning',
        text: 'Rain expected tonight — consider delaying irrigation on Vegetable Field until morning.',
      },
    ],
  },

  alerts: [
    {
      tone: 'warning',
      type: 'weather',
      text: 'High temperatures expected tomorrow afternoon. Monitor cotton for signs of water stress.',
    },
    {
      tone: 'info',
      type: 'disease',
      text: 'Recent warm, humid conditions increase leaf disease risk. Scout lower leaves on tomato plants.',
    },
  ],

  fields: [
    { id: 'field-north', name: 'North Field', crop: 'Wheat', area_ha: 4.8, status: 'Ready for Harvest' },
    { id: 'field-main', name: 'Main Farm', crop: 'Cotton', area_ha: 8.6, status: 'Healthy' },
    { id: 'field-vegetable', name: 'Vegetable Field', crop: 'Tomato', area_ha: 2.4, status: 'Needs Attention' },
  ],

  recommendations: [
    {
      id: 'rec-001',
      category: 'irrigation',
      priority: 'high',
      title: 'Delay irrigation for 12 hours due to expected rainfall',
      text: 'Rain is likely within the next 24 hours. Watering now may waste water and risk waterlogged roots.',
    },
    {
      id: 'rec-002',
      category: 'crop-care',
      priority: 'high',
      title: 'Inspect lower leaves for possible fungal infection',
      text: 'A few lower leaves on the Vegetable Field are showing spots. Review after the next dry morning.',
    },
    {
      id: 'rec-003',
      category: 'weather',
      priority: 'medium',
      title: 'High temperatures expected — monitor crop stress',
      text: 'Warm afternoons may increase water loss. Water early in the morning and check shade cloth.',
    },
  ],

  recent_activity: {
    last_conversation: {
      conversation_id: 'conv-demo-01',
      question: 'My wheat leaves are turning yellow. What should I check?',
      answer_preview: 'Yellowing in wheat can have several causes. Check soil moisture first — both waterlogging and drought stress can cause yellowing. Next, examine the pattern across the field…',
    },
    last_scan: {
      scan_id: 'scan-demo-01',
      disease: 'Early blight',
      is_healthy: false,
      confidence: 0.87,
      scanned_at: '2026-09-03T08:55:00',
    },
  },

  ai_insights: [
    {
      id: 'insight-1',
      type: 'irrigation',
      title: 'Smart irrigation suggestion',
      description: 'Based on tonight\'s expected rainfall and your current soil moisture levels, delaying irrigation by 12 hours could save up to 40% of water usage across your fields.',
      action: 'View recommendation',
      link: '/recommendations',
      tone: 'info',
    },
    {
      id: 'insight-2',
      type: 'crop-health',
      title: 'Crop health observation',
      description: 'Your tomato plants are entering a key growth stage. The combination of warm days and evening moisture creates conditions worth watching for fungal development.',
      action: 'Check Vegetable Field',
      link: '/fields',
      tone: 'warning',
    },
    {
      id: 'insight-3',
      type: 'weather',
      title: 'Weather-related warning',
      description: 'A warm spell is building through the week. Cotton fields may need extra attention — consider morning irrigation and afternoon shade checks for the most exposed rows.',
      action: 'See forecast',
      link: '/weather',
      tone: 'warning',
    },
    {
      id: 'insight-4',
      type: 'disease',
      title: 'Disease risk alert',
      description: 'Recent scans detected early blight on tomato leaves. Warm, humid conditions this week could accelerate spread. Scout the lower canopy and remove affected leaves promptly.',
      action: 'View disease info',
      link: '/diseases',
      tone: 'danger',
    },
    {
      id: 'insight-5',
      type: 'action',
      title: 'Next recommended action',
      description: 'North Field wheat is ready for harvest. Check grain moisture content this morning — if below 14%, scheduling the combine this week would avoid over-ripening risk.',
      action: 'View field details',
      link: '/fields',
      tone: 'success',
    },
  ],
};
