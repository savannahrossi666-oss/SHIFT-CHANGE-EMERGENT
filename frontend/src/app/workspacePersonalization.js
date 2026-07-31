const WORKSPACE_MODES = [
  {
    key: "audio",
    label: "Audio Studio",
    match: ["music", "audio", "beat", "vocal", "podcast", "ableton", "logic", "fl studio"],
    modules: [
      { title: "Versions", description: "Keep drafts, mixes and final exports organized in one place." },
      { title: "References", description: "Collect reference tracks, creative direction and client notes." },
      { title: "Deliverables", description: "Track stems, masters, alternate versions and final files." },
    ],
    prompts: ["Upload the latest draft", "Confirm reference direction", "Prepare final deliverables"],
  },
  {
    key: "visual",
    label: "Visual Studio",
    match: ["photo", "photography", "video", "design", "graphic", "camera", "photoshop", "illustrator"],
    modules: [
      { title: "Creative brief", description: "Keep the look, references and must-have shots visible." },
      { title: "Selects + revisions", description: "Organize review rounds and what still needs editing." },
      { title: "Delivery", description: "Track final sizes, formats, exports and approved assets." },
    ],
    prompts: ["Confirm creative brief", "Upload selects", "Package final exports"],
  },
  {
    key: "digital",
    label: "Build Room",
    match: ["code", "web", "react", "javascript", "ux", "ui", "software", "wordpress", "digital"],
    modules: [
      { title: "Requirements", description: "Turn the shift into clear features, constraints and acceptance criteria." },
      { title: "Build checklist", description: "Track implementation, QA and fixes without losing context." },
      { title: "Handoff", description: "Keep links, credentials notes, documentation and final delivery together." },
    ],
    prompts: ["Confirm requirements", "Break work into milestones", "Run final QA"],
  },
  {
    key: "teaching",
    label: "Learning Room",
    match: ["tutor", "teaching", "coaching", "learning", "study", "research"],
    modules: [
      { title: "Goals", description: "Define what the learner needs to understand or accomplish." },
      { title: "Session plan", description: "Keep topics, exercises and resources organized by session." },
      { title: "Progress", description: "Capture wins, sticking points and what comes next." },
    ],
    prompts: ["Set the learning goal", "Add session resources", "Record progress"],
  },
  {
    key: "onsite",
    label: "Field Room",
    match: ["moving", "cleaning", "delivery", "vehicle", "hands-on", "on-site", "onsite", "event"],
    modules: [
      { title: "Where + when", description: "Keep location, arrival details and schedule easy to find." },
      { title: "Equipment", description: "Track what each person needs to bring or have ready." },
      { title: "Completion proof", description: "Use photos, checklist items and notes to confirm the job is done." },
    ],
    prompts: ["Confirm arrival details", "Check equipment", "Add completion proof"],
  },
];

const DEFAULT_MODE = {
  key: "general",
  label: "Project Room",
  modules: [
    { title: "Brief", description: "Keep the goal, scope and expectations visible." },
    { title: "Milestones", description: "Break the work into clear steps and track progress." },
    { title: "Deliverables", description: "Keep final work and completion requirements together." },
  ],
  prompts: ["Confirm the brief", "Add the next milestone", "Define final deliverables"],
};

export function getWorkspaceMode(ws, user) {
  const haystack = [
    ws?.shift_title,
    ws?.shift_kind,
    ws?.shift_description,
    ...(ws?.shift_tags || []),
    ...(user?.skills || []),
    ...(user?.services || []),
  ].filter(Boolean).join(" ").toLowerCase();

  let best = DEFAULT_MODE;
  let bestScore = 0;
  for (const mode of WORKSPACE_MODES) {
    const score = mode.match.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0);
    if (score > bestScore) {
      best = mode;
      bestScore = score;
    }
  }
  return best;
}
