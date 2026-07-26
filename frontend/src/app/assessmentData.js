export const ASSESSMENT_SECTIONS = [
  {
    id: "make",
    title: "What do you make?",
    subtitle: "Choose anything you can already create, even if nobody has paid you for it yet.",
    options: [
      ["Music & audio", ["Music production", "Beat making", "Audio editing"]],
      ["Writing", ["Creative writing", "Copywriting", "Editing"]],
      ["Visuals", ["Graphic design", "Photography", "Video editing"]],
      ["Digital products", ["Web development", "UX/UI design", "No-code building"]],
      ["Physical things", ["Crafting", "Sewing", "Woodworking"]],
      ["Food", ["Cooking", "Baking", "Meal prep"]],
    ],
  },
  {
    id: "help",
    title: "What do people ask you for help with?",
    subtitle: "The things that feel easy to you can still be valuable to somebody else.",
    options: [
      ["Technology", ["Tech support", "Web development", "Digital organization"]],
      ["Learning", ["Tutoring", "Research", "Study strategy"]],
      ["Words & ideas", ["Editing", "Creative writing", "Brainstorming"]],
      ["People", ["Customer service", "Communication", "Event support"]],
      ["Organization", ["Project organization", "Scheduling", "Data entry"]],
      ["Hands-on help", ["Moving help", "Cleaning", "Home organization"]],
    ],
  },
  {
    id: "tools",
    title: "What can you work with?",
    subtitle: "Software, equipment and resources can become part of what you offer.",
    options: [
      ["Audio software", ["Ableton", "FL Studio", "Logic Pro"]],
      ["Design software", ["Photoshop", "Illustrator", "Canva"]],
      ["Video software", ["Premiere Pro", "Final Cut", "CapCut"]],
      ["Code & web", ["JavaScript", "React", "WordPress"]],
      ["Camera gear", ["Camera equipment", "Photography", "Video production"]],
      ["Transportation", ["Vehicle access", "Delivery", "Moving help"]],
    ],
  },
  {
    id: "workstyle",
    title: "How do you like to work?",
    subtitle: "This helps SHIFT CHANGE recommend the right kinds of opportunities.",
    options: [
      ["Make something from scratch", ["Creative production", "Ideation"]],
      ["Improve something that exists", ["Editing", "Quality review"]],
      ["Solve a problem", ["Problem solving", "Troubleshooting"]],
      ["Teach someone", ["Tutoring", "Coaching"]],
      ["Work with my hands", ["Hands-on work", "On-site services"]],
      ["Organize the chaos", ["Project organization", "Operations"]],
    ],
  },
  {
    id: "growth",
    title: "What do you want to get better at?",
    subtitle: "These are growth skills, not claims about what you can already sell.",
    growth: true,
    options: [
      ["Music & audio", ["Music production"]],
      ["Design", ["Graphic design"]],
      ["Photo & video", ["Photography", "Video editing"]],
      ["Coding", ["Web development"]],
      ["Business", ["Marketing", "Sales"]],
      ["Teaching", ["Tutoring", "Coaching"]],
    ],
  },
];

export const SERVICE_SUGGESTIONS = {
  "Music production": ["Custom beat production", "Song arrangement", "Audio project help"],
  "Beat making": ["Custom beats", "Beat revisions"],
  "Audio editing": ["Audio cleanup", "Podcast editing", "Vocal editing"],
  "Creative writing": ["Creative writing", "Script writing", "Writing feedback"],
  Copywriting: ["Website copy", "Social copy", "Product descriptions"],
  Editing: ["Writing edits", "Content review"],
  "Graphic design": ["Cover artwork", "Social graphics", "Flyer design"],
  Photography: ["Portrait photography", "Product photography", "Event photography"],
  "Video editing": ["Short-form video editing", "Video cleanup"],
  "Web development": ["Website builds", "Website fixes", "Frontend development"],
  "UX/UI design": ["Interface design", "UX review", "Wireframes"],
  Tutoring: ["1:1 tutoring", "Homework help"],
  Research: ["Research assistance", "Source gathering"],
  "Tech support": ["Device setup", "Tech troubleshooting"],
  "Moving help": ["Moving help", "Loading/unloading"],
  Cleaning: ["Home cleaning", "Workspace cleanup"],
  Delivery: ["Local delivery", "Pickup/drop-off help"],
};

export function buildAssessmentResult(selections) {
  const scores = new Map();
  const growth = new Set();
  const selectedLabels = new Set();

  ASSESSMENT_SECTIONS.forEach((section) => {
    const chosen = selections[section.id] || [];
    chosen.forEach((label) => {
      selectedLabels.add(label);
      const option = section.options.find(([name]) => name === label);
      if (!option) return;
      option[1].forEach((skill) => {
        if (section.growth) growth.add(skill);
        else scores.set(skill, (scores.get(skill) || 0) + 1);
      });
    });
  });

  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([skill]) => skill);

  const strongestSkills = ranked.slice(0, 8);
  const services = [];
  strongestSkills.forEach((skill) => {
    (SERVICE_SUGGESTIONS[skill] || []).forEach((service) => {
      if (!services.includes(service)) services.push(service);
    });
  });

  return {
    skills: strongestSkills,
    growthSkills: [...growth].filter((skill) => !strongestSkills.includes(skill)),
    suggestedServices: services.slice(0, 6),
    signals: [...selectedLabels],
  };
}
