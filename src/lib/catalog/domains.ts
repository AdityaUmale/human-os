export type DomainKey =
  | "identity"
  | "mind"
  | "emotions"
  | "relationships"
  | "energy"
  | "work"
  | "growth"
  | "season";

export type InsightLayout =
  | "narrative-3" // main + 3 bullet groups + why
  | "narrative-2" // main + 2 bullet groups + why (legacy identity authentic/mask)
  | "principles" // intro/narrative + principles + 2 bullet groups + why
  | "tension" // intro + side A/B + bullets + why both + why
  | "blind-spots"; // intro + 2 bullets + why they exist + why matters

export type BulletSection = {
  title: string;
  /** Fuzzy aliases used when reading LLM JSON fields */
  aliases: string[];
};

export type DomainInsight = {
  key: string;
  title: string;
  desc: string;
  anchorQuestion: string;
  layout: InsightLayout;
  /** Bullet section headings in display order */
  bulletSections: BulletSection[];
  /** Extra paragraph section titles (e.g. Why They Exist) */
  extraParagraphs?: Array<{ title: string; aliases: string[] }>;
};

export type DomainConfig = {
  key: DomainKey;
  title: string;
  mapDesc: string;
  subtitle: string;
  hero?: boolean;
  wide?: boolean;
  accent?: boolean;
  available: boolean;
  /** Profile JSON key for this domain */
  profileKey: string;
  /** Env / getPromptNames key */
  promptEnvKey: string;
  defaultPromptName: string;
  insights: DomainInsight[];
};

export const DOMAIN_CATALOG: DomainConfig[] = [
  {
    key: "identity",
    title: "Identity",
    mapDesc: "Who you are.",
    subtitle: "Who you are beneath your adaptations.",
    hero: true,
    available: true,
    profileKey: "identity",
    promptEnvKey: "IDENTITY_RENDERER",
    defaultPromptName: "Identity Renderer v1.0",
    insights: [
      {
        key: "authentic-self",
        title: "Authentic Self",
        desc: "Discover who you are beneath the roles you’ve learned to play.",
        anchorQuestion: "Who am I beneath the roles I've learned to play?",
        layout: "narrative-2",
        bulletSections: [
          {
            title: "You Feel Most Yourself When...",
            aliases: ["you_feel_most_yourself_when", "feelMostYourselfWhen", "You Feel Most Yourself When"],
          },
          {
            title: "What Hides This Part Of You",
            aliases: ["what_hides_this_part_of_you", "whatHidesThisPart", "What Hides This Part Of You"],
          },
        ],
      },
      {
        key: "protective-mask",
        title: "Protective Mask",
        desc: "Understand the version of yourself you built to feel safe.",
        anchorQuestion: "What version of myself did I build to feel safe?",
        layout: "narrative-2",
        bulletSections: [
          {
            title: "Common Patterns",
            aliases: ["common_patterns", "commonPatterns", "Common Patterns"],
          },
          {
            title: "Where It Usually Appears",
            aliases: ["where_it_usually_appears", "whereItUsuallyAppears", "Where It Usually Appears"],
          },
        ],
      },
      {
        key: "values-architecture",
        title: "Values Architecture",
        desc: "Understand the principles that quietly guide your choices.",
        anchorQuestion: "What quietly guides my decisions?",
        layout: "principles",
        bulletSections: [
          {
            title: "How They Shape Decisions",
            aliases: ["how_they_shape_decisions", "howTheyShapeDecisions", "How They Shape Decisions"],
          },
          {
            title: "Where They Create Friction",
            aliases: ["where_they_create_friction", "whereTheyCreateFriction", "Where They Create Friction"],
          },
        ],
      },
      {
        key: "inner-conflicts",
        title: "Inner Conflicts",
        desc: "Understand why you often feel pulled in opposite directions.",
        anchorQuestion: "Why do I often feel pulled in opposite directions?",
        layout: "tension",
        bulletSections: [
          {
            title: "When This Shows Up",
            aliases: ["when_this_shows_up", "whenThisShowsUp", "When This Shows Up"],
          },
        ],
        extraParagraphs: [
          {
            title: "Why Both Exist",
            aliases: ["why_both_exist", "whyBothExist", "Why Both Exist"],
          },
        ],
      },
    ],
  },
  {
    key: "mind",
    title: "Mind",
    mapDesc: "How you think.",
    subtitle: "How you think.",
    available: true,
    profileKey: "mind",
    promptEnvKey: "MIND_RENDERER",
    defaultPromptName: "Mind Renderer v1.0",
    insights: [
      {
        key: "cognitive-style",
        title: "Cognitive Style",
        desc: "Understand how your mind naturally makes sense of the world.",
        anchorQuestion: "How does my mind naturally make sense of the world?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "How Your Mind Naturally Works",
            aliases: [
              "how_your_mind_naturally_works",
              "howYourMindNaturallyWorks",
              "How Your Mind Naturally Works",
            ],
          },
          {
            title: "Where This Becomes A Strength",
            aliases: [
              "where_this_becomes_a_strength",
              "whereThisBecomesAStrength",
              "Where This Becomes A Strength",
            ],
          },
          {
            title: "Where It Can Struggle",
            aliases: ["where_it_can_struggle", "whereItCanStruggle", "Where It Can Struggle"],
          },
        ],
      },
      {
        key: "decision-style",
        title: "Decision Style",
        desc: "Understand how you naturally arrive at decisions.",
        anchorQuestion: "How do I naturally arrive at decisions?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "You Need Before Acting",
            aliases: ["you_need_before_acting", "youNeedBeforeActing", "You Need Before Acting"],
          },
          {
            title: "What Slows Decisions",
            aliases: ["what_slows_decisions", "whatSlowsDecisions", "What Slows Decisions"],
          },
          {
            title: "What Creates Confidence",
            aliases: ["what_creates_confidence", "whatCreatesConfidence", "What Creates Confidence"],
          },
        ],
      },
      {
        key: "attention-focus",
        title: "Attention & Focus",
        desc: "Understand what naturally captures your attention.",
        anchorQuestion: "What naturally captures my attention?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "You Naturally Notice...",
            aliases: ["you_naturally_notice", "youNaturallyNotice", "You Naturally Notice"],
          },
          {
            title: "You Easily Miss...",
            aliases: ["you_easily_miss", "youEasilyMiss", "You Easily Miss"],
          },
          {
            title: "You Focus Best When...",
            aliases: ["you_focus_best_when", "youFocusBestWhen", "You Focus Best When"],
          },
        ],
      },
      {
        key: "blind-spots",
        title: "Blind Spots",
        desc: "Understand the patterns you’re least likely to notice in yourself.",
        anchorQuestion: "What patterns am I least likely to notice in myself?",
        layout: "blind-spots",
        bulletSections: [
          {
            title: "Common Blind Spots",
            aliases: ["common_blind_spots", "commonBlindSpots", "Common Blind Spots"],
          },
          {
            title: "How They Usually Show Up",
            aliases: ["how_they_usually_show_up", "howTheyUsuallyShowUp", "How They Usually Show Up"],
          },
        ],
        extraParagraphs: [
          {
            title: "Why They Exist",
            aliases: ["why_they_exist", "whyTheyExist", "Why They Exist"],
          },
        ],
      },
    ],
  },
  {
    key: "emotions",
    title: "Emotions",
    mapDesc: "How you feel.",
    subtitle: "How you feel and restore.",
    available: true,
    profileKey: "emotions",
    promptEnvKey: "EMOTIONS_RENDERER",
    defaultPromptName: "Emotions Renderer v1.0",
    insights: [
      {
        key: "emotional-architecture",
        title: "Emotional Architecture",
        desc: "Understand how you naturally process and hold emotion.",
        anchorQuestion: "How do I naturally feel and process emotion?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "Your Default Emotional State",
            aliases: ["default_state", "defaultEmotionalState", "Your Default Emotional State"],
          },
          {
            title: "You Need Emotionally...",
            aliases: ["emotional_needs", "youNeedEmotionally", "You Need Emotionally"],
          },
          {
            title: "You Struggle When...",
            aliases: ["you_struggle_when", "youStruggleWhen", "You Struggle When"],
          },
        ],
      },
      {
        key: "emotional-triggers",
        title: "Emotional Triggers",
        desc: "Understand what consistently activates strong emotion.",
        anchorQuestion: "What consistently activates strong emotion in me?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "Common Triggers",
            aliases: ["common_triggers", "commonTriggers", "Common Triggers"],
          },
          {
            title: "Underlying Fears",
            aliases: ["underlying_fears", "underlyingFears", "Underlying Fears"],
          },
          {
            title: "How Triggers Show Up",
            aliases: ["how_triggers_show_up", "howTriggersShowUp", "How Triggers Show Up"],
          },
        ],
      },
      {
        key: "emotional-recovery",
        title: "Emotional Recovery",
        desc: "Understand how you naturally restore after emotional strain.",
        anchorQuestion: "How do I naturally recover after emotional strain?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "You Restore Through...",
            aliases: ["restores_through", "youRestoreThrough", "You Restore Through"],
          },
          {
            title: "Recovery Is Prolonged By...",
            aliases: ["prolonged_by", "recoveryIsProlongedBy", "Recovery Is Prolonged By"],
          },
          {
            title: "You Recover Faster When...",
            aliases: ["you_recover_faster_when", "youRecoverFasterWhen", "You Recover Faster When"],
          },
        ],
      },
    ],
  },
  {
    key: "relationships",
    title: "Relationships",
    mapDesc: "How you connect.",
    subtitle: "How you connect, communicate and navigate conflict.",
    available: true,
    profileKey: "relationships",
    promptEnvKey: "RELATIONSHIPS_RENDERER",
    defaultPromptName: "Relationship Renderer v1.0",
    insights: [
      {
        key: "attachment-style",
        title: "Attachment Style",
        desc: "Understand what helps you feel safe and connected.",
        anchorQuestion: "What helps me feel safe and connected with others?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "You Feel Connected When...",
            aliases: ["you_feel_connected_when", "youFeelConnectedWhen", "You Feel Connected When"],
          },
          {
            title: "You Naturally Pull Away When...",
            aliases: [
              "you_naturally_pull_away_when",
              "youNaturallyPullAwayWhen",
              "You Naturally Pull Away When",
            ],
          },
          {
            title: "Relationships Thrive For You When...",
            aliases: [
              "relationships_thrive_for_you_when",
              "relationshipsThriveForYouWhen",
              "Relationships Thrive For You When",
            ],
          },
        ],
      },
      {
        key: "communication-style",
        title: "Communication Style",
        desc: "Understand how you naturally express yourself with others.",
        anchorQuestion: "How do I naturally express myself with others?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "People Experience You As...",
            aliases: ["people_experience_you_as", "peopleExperienceYouAs", "People Experience You As"],
          },
          {
            title: "Communication Works Best When...",
            aliases: [
              "communication_works_best_when",
              "communicationWorksBestWhen",
              "Communication Works Best When",
            ],
          },
          {
            title: "Communication Breaks Down When...",
            aliases: [
              "communication_breaks_down_when",
              "communicationBreaksDownWhen",
              "Communication Breaks Down When",
            ],
          },
        ],
      },
      {
        key: "conflict-pattern",
        title: "Conflict Pattern",
        desc: "Understand how you respond when relationships become difficult.",
        anchorQuestion: "How do I naturally respond when relationships become difficult?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "Your First Instinct Is To...",
            aliases: ["your_first_instinct_is_to", "yourFirstInstinctIsTo", "Your First Instinct Is To"],
          },
          {
            title: "Conflict Escalates When...",
            aliases: ["conflict_escalates_when", "conflictEscalatesWhen", "Conflict Escalates When"],
          },
          {
            title: "Repair Happens Through...",
            aliases: ["repair_happens_through", "repairHappensThrough", "Repair Happens Through"],
          },
        ],
      },
    ],
  },
  {
    key: "energy",
    title: "Energy",
    mapDesc: "What fuels you.",
    subtitle: "What fuels you and what drains you.",
    available: true,
    profileKey: "energy",
    promptEnvKey: "ENERGY_RENDERER",
    defaultPromptName: "Energy Renderer v1.0",
    insights: [
      {
        key: "energy-generators",
        title: "Energy Generators",
        desc: "Understand what naturally creates energy for you.",
        anchorQuestion: "What naturally creates energy for me?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "Primary Sources",
            aliases: ["primary_sources", "primarySources", "Primary Sources"],
          },
          {
            title: "Secondary Sources",
            aliases: ["secondary_sources", "secondarySources", "Secondary Sources"],
          },
          {
            title: "You Leave Feeling Alive When...",
            aliases: ["you_leave_feeling_alive_when", "youLeaveFeelingAliveWhen"],
          },
        ],
      },
      {
        key: "energy-drains",
        title: "Energy Drains",
        desc: "Understand what consistently depletes you.",
        anchorQuestion: "What consistently depletes my energy?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "Recurring Drains",
            aliases: ["recurring_drains", "recurringDrains", "Recurring Drains"],
          },
          {
            title: "Early Signs",
            aliases: ["early_signs", "earlySigns", "Early Signs"],
          },
          {
            title: "You Deplete Faster When...",
            aliases: ["you_deplete_faster_when", "youDepleteFasterWhen"],
          },
        ],
      },
      {
        key: "ideal-environment",
        title: "Ideal Environment",
        desc: "Understand the conditions where your energy thrives.",
        anchorQuestion: "What environment lets my energy thrive?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "Ideal Conditions",
            aliases: ["ideal_conditions", "idealConditions", "Ideal Conditions"],
          },
          {
            title: "Disruptive Conditions",
            aliases: ["disruptive_conditions", "disruptiveConditions", "Disruptive Conditions"],
          },
          {
            title: "You Sustain Best When...",
            aliases: ["you_sustain_best_when", "youSustainBestWhen"],
          },
        ],
      },
    ],
  },
  {
    key: "work",
    title: "Work",
    mapDesc: "How you create and contribute.",
    subtitle: "How you create, execute and influence.",
    available: true,
    profileKey: "work",
    promptEnvKey: "WORK_RENDERER",
    defaultPromptName: "Work Renderer v1.0",
    insights: [
      {
        key: "leadership-style",
        title: "Leadership Style",
        desc: "Understand how you naturally lead people and situations.",
        anchorQuestion: "How do I naturally lead people and situations?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "People Naturally Look To You For...",
            aliases: [
              "people_naturally_look_to_you_for",
              "peopleNaturallyLookToYouFor",
              "People Naturally Look To You For",
            ],
          },
          {
            title: "You Lead Best When...",
            aliases: ["you_lead_best_when", "youLeadBestWhen", "You Lead Best When"],
          },
          {
            title: "Leadership Friction Appears When...",
            aliases: [
              "leadership_friction_appears_when",
              "leadershipFrictionAppearsWhen",
              "struggles_when",
            ],
          },
        ],
      },
      {
        key: "execution-style",
        title: "Execution Style",
        desc: "Understand how you naturally get work done.",
        anchorQuestion: "How do I naturally get work done?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "How You Build Momentum",
            aliases: ["how_you_build_momentum", "momentum_pattern", "How You Build Momentum"],
          },
          {
            title: "How You Complete Work",
            aliases: ["how_you_complete_work", "completion_pattern", "How You Complete Work"],
          },
          {
            title: "Execution Breaks Down When...",
            aliases: ["execution_breaks_down_when", "executionBreaksDownWhen"],
          },
        ],
      },
      {
        key: "influence-style",
        title: "Influence Style",
        desc: "Understand how you naturally build trust and influence.",
        anchorQuestion: "How do I naturally build trust and influence?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "You Build Trust By...",
            aliases: ["you_build_trust_by", "builds_trust_by", "You Build Trust By"],
          },
          {
            title: "You Lose Influence When...",
            aliases: ["you_lose_influence_when", "loses_influence_when", "You Lose Influence When"],
          },
          {
            title: "Your Influence Works Best When...",
            aliases: ["your_influence_works_best_when", "yourInfluenceWorksBestWhen"],
          },
        ],
      },
    ],
  },
  {
    key: "growth",
    title: "Growth",
    mapDesc: "How you adapt and evolve.",
    subtitle: "How you adapt under pressure and evolve.",
    available: true,
    profileKey: "growth",
    promptEnvKey: "GROWTH_RENDERER",
    defaultPromptName: "Growth Renderer v1.0",
    insights: [
      {
        key: "stress-signature",
        title: "Stress Signature",
        desc: "Understand how you change under pressure.",
        anchorQuestion: "How do I change under pressure?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "Under Stress You...",
            aliases: ["under_stress_you", "stress_response", "Under Stress You"],
          },
          {
            title: "Early Signs",
            aliases: ["early_signs", "earlySigns", "Early Signs"],
          },
          {
            title: "Stress Softens When...",
            aliases: ["stress_softens_when", "stressSoftensWhen"],
          },
        ],
      },
      {
        key: "self-sabotage",
        title: "Self-Sabotage",
        desc: "Understand the protective patterns that limit you.",
        anchorQuestion: "What protective patterns quietly limit me?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "Recurring Patterns",
            aliases: ["recurring_patterns", "recurringPatterns", "Recurring Patterns"],
          },
          {
            title: "What This Protects",
            aliases: ["what_this_protects", "protective_function", "What This Protects"],
          },
          {
            title: "It Shows Up Most When...",
            aliases: ["it_shows_up_most_when", "itShowsUpMostWhen"],
          },
        ],
      },
      {
        key: "growth-edge",
        title: "Growth Edge",
        desc: "Understand your natural developmental direction.",
        anchorQuestion: "What is my natural growth edge?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "You Need More Of...",
            aliases: ["you_need_more_of", "requires_more_of", "You Need More Of"],
          },
          {
            title: "You Need Less Of...",
            aliases: ["you_need_less_of", "requires_less_of", "You Need Less Of"],
          },
          {
            title: "Growth Accelerates When...",
            aliases: ["growth_accelerates_when", "growthAcceleratesWhen"],
          },
        ],
      },
    ],
  },
  {
    key: "season",
    title: "Current Season",
    mapDesc: "Where you are right now.",
    subtitle: "What chapter of life you are navigating right now.",
    wide: true,
    accent: true,
    available: true,
    profileKey: "current_season",
    promptEnvKey: "SEASON_RENDERER",
    defaultPromptName: "Season Renderer v1.0",
    insights: [
      {
        key: "current-season",
        title: "Current Season",
        desc: "Understand the developmental chapter you are in right now.",
        anchorQuestion: "What chapter of life am I in right now?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "This Season Feels Like...",
            aliases: ["this_season_feels_like", "thisSeasonFeelsLike", "This Season Feels Like"],
          },
          {
            title: "You May Notice...",
            aliases: ["you_may_notice", "youMayNotice", "You May Notice"],
          },
          {
            title: "What This Season Is Asking Of You",
            aliases: [
              "what_this_season_is_asking_of_you",
              "whatThisSeasonIsAskingOfYou",
              "What This Season Is Asking Of You",
            ],
          },
        ],
      },
      {
        key: "active-lessons",
        title: "Active Lessons",
        desc: "Understand the themes life keeps emphasizing.",
        anchorQuestion: "What keeps repeating for me right now?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "Current Lessons",
            aliases: ["current_lessons", "currentLessons", "Current Lessons"],
          },
          {
            title: "Current Tests",
            aliases: ["current_tests", "currentTests", "Current Tests"],
          },
          {
            title: "These Lessons Show Up As...",
            aliases: ["these_lessons_show_up_as", "theseLessonsShowUpAs"],
          },
        ],
        extraParagraphs: [
          {
            title: "Why Lessons Repeat",
            aliases: ["why_lessons_repeat", "whyLessonsRepeat", "Why Lessons Repeat"],
          },
        ],
      },
      {
        key: "current-opportunities",
        title: "Current Opportunities",
        desc: "Understand where life is creating natural momentum.",
        anchorQuestion: "Where is life naturally creating momentum for me?",
        layout: "narrative-3",
        bulletSections: [
          {
            title: "Life Is Opening Doors Through...",
            aliases: [
              "life_is_opening_doors_through",
              "lifeIsOpeningDoorsThrough",
              "Life Is Opening Doors Through",
            ],
          },
          {
            title: "You're Most Supported When...",
            aliases: [
              "youre_most_supported_when",
              "youAreMostSupportedWhen",
              "You're Most Supported When",
            ],
          },
          {
            title: "These Opportunities Can Be Missed When...",
            aliases: [
              "these_opportunities_can_be_missed_when",
              "theseOpportunitiesCanBeMissedWhen",
            ],
          },
        ],
      },
    ],
  },
];

export const MAP_DOMAINS = DOMAIN_CATALOG.map((d) => ({
  key: d.key,
  title: d.title,
  desc: d.mapDesc,
  hero: d.hero,
  wide: d.wide,
  accent: d.accent,
  available: d.available,
}));

export function getDomain(key: string): DomainConfig | undefined {
  return DOMAIN_CATALOG.find((d) => d.key === key);
}

export function isDomainKey(value: string): value is DomainKey {
  return DOMAIN_CATALOG.some((d) => d.key === value);
}

export function getInsight(domainKey: string, insightKey: string) {
  const domain = getDomain(domainKey);
  if (!domain) return null;
  const insight = domain.insights.find((i) => i.key === insightKey);
  if (!insight) return null;
  return { domain, insight };
}

/** @deprecated use DOMAIN_CATALOG identity */
export const IDENTITY_INSIGHTS = DOMAIN_CATALOG.find((d) => d.key === "identity")!.insights;

export function isIdentityInsightKey(value: string): boolean {
  return IDENTITY_INSIGHTS.some((i) => i.key === value);
}
