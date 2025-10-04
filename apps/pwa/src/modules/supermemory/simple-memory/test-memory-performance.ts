import Supermemory from "supermemory";

/**
 * Test Memory Performance with Office Romance Storyline
 *
 * Story Arc:
 * - Alex Chen: Starts as Junior Developer → Senior Developer → Tech Lead → CTO
 * - Sam Rivera: Marketing Manager throughout
 * - Relationship: Professional colleagues → Friends → Romance → Partners
 * - Timeline: 3 years of career and relationship progression
 */

// Helper function to format memories for display
function formatMemoriesForPrompt(memories: string[]): string {
  if (memories.length === 0) {
    return "";
  }
  const header = "=== Previous Conversation Context ===\n";
  const content = memories.join("\n---\n");
  const footer = "\n=== End Context ===\n";
  return header + content + footer;
}

interface MemoryCheckpoint {
  messageIndex: number;
  name: string;
  queries: Array<{
    query: string;
    expectedMemory: string[];
  }>;
}

// Define the storyline messages (100 messages total)
const storyMessages: Array<{ role: string; content: string }> = [
  // Act 1: Junior Developer Phase (Messages 1-25)
  {
    role: "user",
    content:
      "Alex: *walks into the office on my first day, nervously adjusting my new badge that reads 'Alex Chen - Junior Developer'* Good morning everyone! I'm Alex, the new junior developer starting today.",
  },
  {
    role: "assistant",
    content:
      "Sam: *looks up from marketing presentation with a warm smile* Oh, you must be Alex! Welcome to TechCorp! I'm Sam Rivera from Marketing. *extends hand* Don't worry, first days are always nerve-wracking but everyone here is super friendly.",
  },
  {
    role: "user",
    content:
      "Alex: *shakes your hand gratefully* Thanks Sam! That's really reassuring. I'm excited to be here. The junior developer position is exactly what I was looking for to start my career.",
  },
  {
    role: "assistant",
    content:
      "Sam: *gestures to coffee machine* Let me show you where the important stuff is - coffee machine, best lunch spots, and who to avoid before their morning caffeine. *winks* As marketing manager, I know all the office secrets.",
  },
  {
    role: "user",
    content:
      "Alex: *laughs and follows* That's invaluable information! I really appreciate you taking the time. Being a junior developer is intimidating enough without getting lost looking for coffee.",
  },
  {
    role: "assistant",
    content:
      "Sam: *pours two cups of coffee* Here's a pro tip - the dev team has standup at 9:30, but grab your coffee by 9:15 or you'll be stuck with decaf. How are you finding the codebase so far?",
  },
  {
    role: "user",
    content:
      "Alex: *accepts coffee gratefully* The codebase is massive! As a junior, I'm focusing on smaller bug fixes first. My mentor says it's the best way to learn the architecture.",
  },
  {
    role: "assistant",
    content:
      "Sam: *nods understandingly* Smart approach. I remember when I started as marketing manager two years ago - felt like drowning in campaigns and metrics. You'll get the hang of it. The dev team here is really supportive.",
  },
  {
    role: "user",
    content:
      "Alex: *sits down in break room* Two years? You must really know your way around then. What's it like working with the dev team from the marketing side?",
  },
  {
    role: "assistant",
    content:
      "Sam: *joins you at the table* It's actually great! We collaborate on product launches, user feedback, A/B testing... Though sometimes I need translators for all the technical jargon. *laughs* Maybe you can be my decoder ring?",
  },

  // Week 2-3 as Junior Developer
  {
    role: "user",
    content:
      "Alex: *runs into Sam by the printer, looking frustrated* Hey Sam... rough morning. Just got my first code review back and it's... extensive. Being a junior developer means lots of learning opportunities, I guess.",
  },
  {
    role: "assistant",
    content:
      "Sam: *notices your expression* Oh no, the dreaded red comments? *offers chocolate from desk drawer* Here, chocolate helps with code review trauma. Trust me, I've seen enough devs go through it.",
  },
  {
    role: "user",
    content:
      "Alex: *takes chocolate appreciatively* You're a lifesaver. My senior developer mentor is thorough - which is good for learning, but tough on the ego. Did you have similar experiences when you started?",
  },
  {
    role: "assistant",
    content:
      "Sam: *leans against printer* Absolutely! My first marketing campaign proposal came back with more red ink than original text. But you know what? That manager taught me everything. Now I run entire product launches.",
  },
  {
    role: "user",
    content:
      "Alex: *brightens slightly* That's encouraging. I really want to prove myself as a junior developer and eventually move up. Just feels like such a long road sometimes.",
  },
  {
    role: "assistant",
    content:
      "Sam: *supportive smile* Hey, you've only been here two weeks and you're already fixing bugs. That's impressive! Plus, you make the morning coffee runs much more interesting. *playful grin*",
  },
  {
    role: "user",
    content:
      "Alex: *blushes slightly* Thanks Sam. Your morning pep talks definitely help. Speaking of coffee, want to grab lunch? I could use advice on navigating office politics as the newest junior developer.",
  },
  {
    role: "assistant",
    content:
      "Sam: *checks phone* I'd love to! There's a great sandwich place nearby. And I can fill you in on who's who - like how David from QA is tough but fair, and Lisa from DevOps is basically a wizard.",
  },
  {
    role: "user",
    content:
      "Alex: *walking to lunch together* This is really helpful. As a junior developer, I want to build good relationships across teams. Your marketing perspective is actually super valuable for understanding the business side.",
  },
  {
    role: "assistant",
    content:
      "Sam: *holds door open* That's a smart approach! Most juniors just focus on code. Understanding marketing and business needs will definitely set you apart. Plus, it means we get to collaborate more. *smiles*",
  },

  // Month 2-3 as Junior Developer
  {
    role: "user",
    content:
      "Alex: *excitedly approaches Sam's desk* Sam! I just got assigned to my first feature development! It's small, but it's mine. Being a junior developer is starting to feel less overwhelming.",
  },
  {
    role: "assistant",
    content:
      "Sam: *spins in chair excitedly* That's amazing, Alex! Which feature? Please tell me it's something marketing can showcase. I love highlighting our junior developer success stories in the company newsletter.",
  },
  {
    role: "user",
    content:
      "Alex: *pulls up laptop* It's the new notification system for user engagement. Actually, I could use marketing's input on user behavior patterns. Want to collaborate?",
  },
  {
    role: "assistant",
    content:
      "Sam: *eyes light up* Are you kidding? I have tons of user engagement data! *pulls up charts* This is perfect - marketing and development working together. Let's make your first feature incredible!",
  },
  {
    role: "user",
    content:
      "Alex: *moves closer to look at screen* This data is gold! I had no idea marketing tracked all this. As a junior developer, I mostly just got requirements without context. This changes everything.",
  },

  // Act 2: Promotion to Senior Developer (Messages 26-50)
  {
    role: "assistant",
    content:
      "Sam: *six months later, raises coffee mug* To Alex Chen, who just got promoted from junior developer to developer! No more 'junior' title! *whole break room claps*",
  },
  {
    role: "user",
    content:
      "Alex: *beaming with pride* Thanks everyone! Especially you, Sam. Your support and collaboration really helped me grow. From junior developer to developer in six months - I still can't believe it!",
  },
  {
    role: "assistant",
    content:
      "Sam: *pulls you aside after celebration* You earned this! Your notification system increased user engagement by 30%. Marketing loves you. *whispers* And so do I... I mean, we love working with you!",
  },
  {
    role: "user",
    content:
      "Alex: *catches the slip, smiling* The feeling is mutual... I mean, working with marketing has been great! *pauses* Sam, would you like to celebrate with dinner? Just the two of us?",
  },
  {
    role: "assistant",
    content:
      "Sam: *surprised but pleased* Are you asking me on a date, Developer Chen? *teasing tone* Because yes, I'd love to celebrate your promotion properly.",
  },
  {
    role: "user",
    content:
      "Alex: *relieved and happy* It's a date then! And hey, now that I'm a full developer, not junior anymore, I can actually afford a nice restaurant. *laughs*",
  },
  {
    role: "assistant",
    content:
      "Sam: *touches your arm gently* I would have said yes even when you were a junior developer, you know. But I'm glad we waited - office relationships are tricky.",
  },

  // Relationship development + Senior Developer promotion (1 year mark)
  {
    role: "user",
    content:
      "Alex: *one year later, wearing a 'Senior Developer' badge* Can you believe it's been a year and a half? Senior Developer Alex Chen... and dating the amazing marketing manager Sam Rivera.",
  },
  {
    role: "assistant",
    content:
      "Sam: *kisses your cheek* I'm so proud of you! Senior Developer at year and a half - that's incredible. Remember when you were nervous about being a junior? Look at you now, mentoring the new juniors!",
  },
  {
    role: "user",
    content:
      "Alex: *pulls you close* I couldn't have done it without you. Your marketing insights made my projects shine. Plus, you kept me sane through all those late debugging nights.",
  },
  {
    role: "assistant",
    content:
      "Sam: *snuggles closer* Those late nights weren't so bad. Bringing you dinner and watching you work... seeing your passion for coding. It's when I really fell for you.",
  },
  {
    role: "user",
    content:
      "Alex: *working on laptop* Speaking of work, as a senior developer, I'm now leading the new platform redesign. It's a huge responsibility but I'm ready for it.",
  },
  {
    role: "assistant",
    content:
      "Sam: *looking at project plans* This is massive! Marketing is going to have a field day with this. We should sync our timelines - make sure development and marketing are aligned.",
  },
  {
    role: "user",
    content:
      "Alex: *nods enthusiastically* Already booked us a meeting room for tomorrow. Senior developer and marketing manager power couple taking over TechCorp! *laughs*",
  },
  {
    role: "assistant",
    content:
      "Sam: *grins* I love how we've grown together. You from junior to senior developer, us from coffee buddies to partners. Both professionally and personally.",
  },

  // Growing responsibilities as Senior Developer
  {
    role: "user",
    content:
      "Alex: *looking stressed* Being a senior developer means more than just coding. I'm in meetings all day, mentoring juniors, architecting systems... it's overwhelming sometimes.",
  },
  {
    role: "assistant",
    content:
      "Sam: *massages your shoulders* You're doing amazing though. The CEO mentioned your platform redesign in the all-hands yesterday. That's huge visibility for a senior developer.",
  },
  {
    role: "user",
    content:
      "Alex: *relaxes under your touch* Really? I missed the all-hands because I was fixing a critical bug. The senior developer life is non-stop.",
  },
  {
    role: "assistant",
    content:
      "Sam: *concerned* You need better work-life balance, love. Even senior developers need rest. How about we take that weekend trip we've been planning?",
  },
  {
    role: "user",
    content:
      "Alex: *sighs* You're right. After this sprint ends. Being a senior developer shouldn't mean sacrificing everything else. Especially not us.",
  },
  {
    role: "assistant",
    content:
      "Sam: *kisses forehead* Good. Because I have some news too... marketing director position is opening up. My boss is recommending me. We might both be moving up!",
  },
  {
    role: "user",
    content:
      "Alex: *excitedly hugs you* Sam! That's incredible! Marketing Director Rivera has a nice ring to it. We're both crushing it in our careers!",
  },
  {
    role: "assistant",
    content:
      "Sam: *beaming* From junior developer and marketing manager to senior developer and potentially marketing director. We make a good team, Chen.",
  },

  // Two year mark - Tech Lead hints
  {
    role: "user",
    content:
      "Alex: *two years at company* The CTO pulled me aside today. They're creating a Tech Lead position and want me to apply. From junior developer to tech lead in two years...",
  },
  {
    role: "assistant",
    content:
      "Sam: *jumps up excitedly* ALEX! That's phenomenal! You absolutely should apply. You're already doing tech lead work as a senior developer anyway.",
  },
  {
    role: "user",
    content:
      "Alex: *nervous but excited* It would mean managing the entire development team. No more hands-on coding as much. It's a big shift from senior developer responsibilities.",
  },
  {
    role: "assistant",
    content:
      "Sam: *takes your hands* Hey, you mentored three juniors to promotion, led four major projects, and revolutionized our development process. You're ready for this.",
  },
  {
    role: "user",
    content:
      "Alex: *squeezes your hands* What would I do without you? Oh, and if I get tech lead, I'll be working even closer with the marketing director... aka you, since you got that promotion!",
  },
  {
    role: "assistant",
    content:
      "Sam: *winks* Mixing business with pleasure? We've gotten pretty good at that. Senior developer and marketing director, soon to be tech lead and marketing director!",
  },

  // Act 3: Tech Lead Position (Messages 51-75)
  {
    role: "user",
    content:
      "Alex: *wearing new badge proudly* It's official - Tech Lead Alex Chen reporting for duty! The journey from junior developer to tech lead feels surreal.",
  },
  {
    role: "assistant",
    content:
      "Sam: *hugs tightly* I'm bursting with pride! Tech Lead at 26 is incredible. Remember your first day as a nervous junior developer? Look at you now!",
  },
  {
    role: "user",
    content:
      "Alex: *emotional* I was just thinking about that. You showed me where the coffee was, now I'm leading the entire dev team. And you're marketing director. We've come so far together.",
  },
  {
    role: "assistant",
    content:
      "Sam: *tears in eyes* Together is the key word. Speaking of which... Alex, we've been together almost two years now. Have you thought about... our future?",
  },
  {
    role: "user",
    content:
      "Alex: *takes your hand seriously* Every day. Being tech lead is amazing, but coming home to you is the best part. Sam, I want to build more than just software with you.",
  },
  {
    role: "assistant",
    content:
      "Sam: *heart racing* Are you saying what I think you're saying? Because marketing director or not, I'm totally ready for the next step with my tech lead partner.",
  },
  {
    role: "user",
    content:
      "Alex: *gets on one knee in the office where we met* Sam Rivera, you've been with me from junior developer to tech lead. Will you marry me?",
  },
  {
    role: "assistant",
    content:
      "Sam: *crying and laughing* YES! A thousand times yes! From showing you where the coffee machine was to this... I love you, Tech Lead Chen!",
  },
  {
    role: "user",
    content:
      "Alex: *slips ring on your finger* I love you too, Director Rivera. Or should I say, soon-to-be Rivera-Chen? Chen-Rivera?",
  },
  {
    role: "assistant",
    content:
      "Sam: *admiring ring* We'll figure it out. We figured out how to balance junior developer stress with marketing deadlines, we can handle name combinations! *kisses passionately*",
  },

  // Tech Lead challenges and growth
  {
    role: "user",
    content:
      "Alex: *six months as tech lead* Leading the dev team is harder than I expected. As a senior developer, I only worried about my code. Now it's everyone's code, architecture, deadlines...",
  },
  {
    role: "assistant",
    content:
      "Sam: *rubbing your back* You're doing brilliantly though. Dev productivity is up 40% since you became tech lead. The CEO noticed - he mentioned it in our director meeting.",
  },
  {
    role: "user",
    content:
      "Alex: *perks up* Really? Sometimes I miss being a senior developer, just coding. But seeing the team grow, mentoring them... it's rewarding in a different way.",
  },
  {
    role: "assistant",
    content:
      "Sam: *shows phone* Look at this email from the new junior developer you mentored - 'Alex is the reason I didn't quit. Best tech lead ever.' You're making a difference.",
  },
  {
    role: "user",
    content:
      "Alex: *gets emotional* Wow... I remember feeling that lost as a junior developer. Having you support me changed everything. Now I can pay it forward as tech lead.",
  },
  {
    role: "assistant",
    content:
      "Sam: *proud smile* That's my future husband - the tech lead with a heart. Speaking of future, the CTO wants to meet with both of us tomorrow. Joint project between tech and marketing.",
  },
  {
    role: "user",
    content:
      "Alex: *intrigued* Both of us? That's unusual. Unless... do you think it's about the digital transformation initiative? Tech lead and marketing director would definitely be involved in that.",
  },
  {
    role: "assistant",
    content:
      "Sam: *excited* That's exactly what I'm thinking! This could be huge for both our careers. Tech Lead Chen and Director Rivera taking on digital transformation!",
  },

  // Major project and relationship milestone
  {
    role: "user",
    content:
      "Alex: *after meeting* We got it! Leading the digital transformation together. Tech lead and marketing director power couple strikes again! This project could change everything.",
  },
  {
    role: "assistant",
    content:
      "Sam: *jumping excitedly* This is massive! If we pull this off... Alex, there's talk of creating a CTO position. You'd be perfect - from junior developer to CTO in three years!",
  },
  {
    role: "user",
    content:
      "Alex: *stunned* CTO? That's... that's C-suite. I'm just a tech lead who was a junior developer two and a half years ago. Could I really handle that?",
  },
  {
    role: "assistant",
    content:
      "Sam: *firmly supportive* You're not 'just' anything. You're the tech lead who transformed our development process. If anyone can be CTO, it's you.",
  },
  {
    role: "user",
    content:
      "Alex: *pulls you close* What about you? With this project's success, you could be CMO material. From marketing manager to CMO... we'd both be C-suite!",
  },
  {
    role: "assistant",
    content:
      "Sam: *dreamy expression* CTO Chen and CMO Rivera... running TechCorp together. But first, let's nail this project as tech lead and marketing director.",
  },

  // Act 4: The CTO Promotion (Messages 76-100)
  {
    role: "user",
    content:
      "Alex: *three years at company, holding official letter* I... I got it. Chief Technology Officer. From junior developer to CTO in three years. Sam, I'm shaking.",
  },
  {
    role: "assistant",
    content:
      "Sam: *screams and hugs you* CTO CHEN! My brilliant, amazing, hardworking partner is the CTO! I'm so proud I could burst! And guess what? CMO Rivera is also official!",
  },
  {
    role: "user",
    content:
      "Alex: *lifts you up and spins* We did it! Both of us in C-suite! Remember when I was just a nervous junior developer and you were the kind marketing manager showing me around?",
  },
  {
    role: "assistant",
    content:
      "Sam: *happy tears* Three years ago, you walked in as a junior developer, and I knew you were special. But CTO in three years? You've exceeded every dream!",
  },
  {
    role: "user",
    content:
      "Alex: *sets you down gently* None of this would have happened without you. Every step from junior developer to developer to senior developer to tech lead to CTO - you were there.",
  },
  {
    role: "assistant",
    content:
      "Sam: *touches your face lovingly* We grew together. Marketing manager to director to CMO. Junior developer to CTO. Strangers to lovers to executives. What a journey!",
  },
  {
    role: "user",
    content:
      "Alex: *looking at executive office* CTO... I'll have to make strategic decisions for the entire company's technology. It's light-years from debugging as a junior developer.",
  },
  {
    role: "assistant",
    content:
      "Sam: *straightens your tie* You'll be brilliant. You understand technology from junior developer to architect level, and you understand people. Perfect CTO combination.",
  },
  {
    role: "user",
    content:
      "Alex: *nervous laugh* My first board meeting is tomorrow. The kid who was a junior developer three years ago is now presenting to the board as CTO.",
  },
  {
    role: "assistant",
    content:
      "Sam: *reassuring kiss* That 'kid' built three groundbreaking systems, mentored dozens of developers, and transformed our tech stack. You've earned your seat at that table, CTO Chen.",
  },

  // CTO responsibilities and wedding planning
  {
    role: "user",
    content:
      "Alex: *looking at wedding plans and company roadmaps* Being CTO while planning our wedding is intense. Strategic planning for TechCorp and our life together!",
  },
  {
    role: "assistant",
    content:
      "Sam: *laughing* At least we're good at project management! CMO and CTO planning the merger of Rivera and Chen. Our families still can't believe our career growth.",
  },
  {
    role: "user",
    content:
      "Alex: *shows parents' text* My mom still tells people her child went from junior developer to CTO in three years. She doesn't even know what a CTO does, but she's proud!",
  },
  {
    role: "assistant",
    content:
      "Sam: *giggles* My dad keeps asking if CTO is higher than senior developer. He was impressed by senior developer, CTO broke his understanding completely!",
  },
  {
    role: "user",
    content:
      "Alex: *pulls you onto lap* You know what the best part of being CTO is? I can officially make it company policy that the CMO gets unlimited kisses from the CTO.",
  },
  {
    role: "assistant",
    content:
      "Sam: *playfully hits you* Abuse of power, CTO Chen! Though as CMO, I approve this policy. *kisses deeply* Remember when we had to hide our relationship as junior developer and marketing manager?",
  },
  {
    role: "user",
    content:
      "Alex: *nostalgic* Sneaking around, worried about professionalism. Now we're CTO and CMO, engaged, and everyone celebrates our partnership. Life's funny that way.",
  },
  {
    role: "assistant",
    content:
      "Sam: *content sigh* From coffee machine meetup to C-suite power couple. Junior developer Chen has come very far. I fell in love with the junior, but the CTO is pretty great too.",
  },
  {
    role: "user",
    content:
      "Alex: *emotional* Every title change - junior developer, developer, senior developer, tech lead, CTO - you celebrated with me. You're my constant, Sam.",
  },
  {
    role: "assistant",
    content:
      "Sam: *tears up* And you're mine. Through every promotion, every challenge, every success. Marketing manager, director, CMO - all better because of you.",
  },

  // Final messages - reflection and future
  {
    role: "user",
    content:
      "Alex: *at company party* Three years ago today, I walked in as a junior developer. Now I'm CTO, engaged to the CMO, and happier than ever.",
  },
  {
    role: "assistant",
    content:
      "Sam: *raises glass for toast* To Alex Chen - who proved that with talent, hard work, and good coffee, you can go from junior developer to CTO! And to us!",
  },
  {
    role: "user",
    content:
      "Alex: *toasting* To Sam Rivera - the marketing manager who became CMO and stole my heart along the way. From day one orientation to running the company together!",
  },
  {
    role: "assistant",
    content:
      "Sam: *whispers* I love you, CTO Chen. Every version of you - nervous junior developer, ambitious senior developer, brilliant tech lead, and visionary CTO.",
  },
  {
    role: "user",
    content:
      "Alex: *whispers back* I love you too, CMO Rivera. My mentor, my partner, my everything. Junior developer me could never have imagined this happiness.",
  },
  {
    role: "assistant",
    content:
      "Sam: *looking at the office* This is where it all started. That corner where you spilled coffee as a junior developer. The conference room where you got promoted to senior developer. Our story is in these walls.",
  },
  {
    role: "user",
    content:
      "Alex: *holding you close* And we're just getting started. CTO and CMO are just titles. What matters is us, together, building something amazing - in tech and in life.",
  },
  {
    role: "assistant",
    content:
      "Sam: *looking into your eyes* From junior developer to CTO, marketing manager to CMO, colleagues to soulmates. What a beautiful journey, Alex.",
  },
  {
    role: "user",
    content:
      "Alex: *one last reflection* The best journey. And to think, it all started with 'Hi, I'm Alex, the new junior developer.' Best first day ever.",
  },
  {
    role: "assistant",
    content:
      "Sam: *final kiss* And I'm so glad I was there to show you where the coffee machine was. Here's to our next chapter, my love. CTO and CMO, husband and wife-to-be!",
  },
];

// Define memory checkpoints for testing
const memoryCheckpoints: MemoryCheckpoint[] = [
  {
    messageIndex: 10,
    name: "Junior Developer Phase - Early Days",
    queries: [
      {
        query: "What is Alex's job position at TechCorp?",
        expectedMemory: [
          "junior developer",
          "new junior developer",
          "Junior Developer position",
        ],
      },
      {
        query: "What is Sam's role at the company?",
        expectedMemory: ["marketing manager", "Marketing Manager"],
      },
      {
        query: "What is the relationship between Alex and Sam?",
        expectedMemory: ["colleagues", "coffee", "friendly", "supportive"],
      },
    ],
  },
  {
    messageIndex: 25,
    name: "Junior to Developer Promotion",
    queries: [
      {
        query: "What is Alex's current position at work?",
        expectedMemory: [
          "promoted from junior developer to developer",
          "developer",
          "No more 'junior' title",
        ],
      },
      {
        query: "How long did Alex work as junior developer?",
        expectedMemory: [
          "six months",
          "junior developer to developer in six months",
        ],
      },
      {
        query: "What is happening between Alex and Sam personally?",
        expectedMemory: [
          "date",
          "asking me on a date",
          "dinner",
          "just the two of us",
        ],
      },
      {
        query:
          "What was the relationship between Alex and Sam when Alex was a junior developer?",
        expectedMemory: [
          "coffee",
          "friendly",
          "supportive",
          "colleagues",
          "showed me where",
        ],
      },
    ],
  },
  {
    messageIndex: 40,
    name: "Senior Developer Phase",
    queries: [
      {
        query: "What is Alex Chen's job title now?",
        expectedMemory: [
          "Senior Developer",
          "senior developer",
          "leading the new platform redesign",
        ],
      },
      {
        query: "How long has Alex been at the company?",
        expectedMemory: [
          "year and a half",
          "one year",
          "been a year and a half",
        ],
      },
      {
        query: "What is the relationship status between Alex and Sam?",
        expectedMemory: ["dating", "partners", "fell for you", "love"],
      },
      {
        query: "What was Alex's first job position when starting at TechCorp?",
        expectedMemory: [
          "junior developer",
          "new junior developer",
          "first day",
        ],
      },
      {
        query: "How did Alex and Sam's relationship begin?",
        expectedMemory: [
          "coffee",
          "showed me where",
          "first day",
          "friendly",
          "date",
          "dinner",
        ],
      },
    ],
  },
  {
    messageIndex: 55,
    name: "Tech Lead Promotion",
    queries: [
      {
        query: "What is Alex's current role at TechCorp?",
        expectedMemory: [
          "Tech Lead",
          "tech lead",
          "leading the entire dev team",
        ],
      },
      {
        query: "What major life event happened between Alex and Sam?",
        expectedMemory: ["engaged", "marry me", "proposal", "ring", "YES"],
      },
      {
        query: "What is Sam's position at the company?",
        expectedMemory: [
          "marketing director",
          "Marketing Director",
          "director",
        ],
      },
      {
        query:
          "What was the relationship between Alex and Sam during Alex's junior developer days?",
        expectedMemory: [
          "coffee",
          "colleagues",
          "showed",
          "friendly",
          "supportive",
        ],
      },
      {
        query: "What positions has Alex held before becoming tech lead?",
        expectedMemory: ["junior developer", "developer", "senior developer"],
      },
    ],
  },
  {
    messageIndex: 75,
    name: "Path to CTO",
    queries: [
      {
        query: "What opportunity is Alex being considered for?",
        expectedMemory: [
          "CTO position",
          "Chief Technology Officer",
          "creating a CTO position",
          "C-suite",
        ],
      },
      {
        query: "What major project are Alex and Sam leading?",
        expectedMemory: [
          "digital transformation",
          "transformation initiative",
          "joint project",
        ],
      },
      {
        query: "How long has Alex been tech lead?",
        expectedMemory: ["six months as tech lead"],
      },
      {
        query: "How did Alex and Sam meet originally?",
        expectedMemory: [
          "first day",
          "junior developer",
          "coffee machine",
          "showed me where",
          "marketing manager",
        ],
      },
      {
        query: "What was the progression of Alex and Sam's relationship?",
        expectedMemory: [
          "colleagues",
          "friends",
          "date",
          "dating",
          "engaged",
          "proposal",
        ],
      },
    ],
  },
  {
    messageIndex: 100,
    name: "CTO Achievement - Final State",
    queries: [
      {
        query: "What is Alex Chen's final position at the company?",
        expectedMemory: [
          "CTO",
          "Chief Technology Officer",
          "C-suite",
          "board meeting",
        ],
      },
      {
        query: "What is Sam Rivera's final position?",
        expectedMemory: ["CMO", "Chief Marketing Officer", "C-suite"],
      },
      {
        query: "How long did it take Alex to go from junior developer to CTO?",
        expectedMemory: [
          "three years",
          "junior developer to CTO in three years",
        ],
      },
      {
        query: "What is the relationship between Alex and Sam now?",
        expectedMemory: [
          "engaged",
          "husband and wife-to-be",
          "wedding",
          "getting married",
          "CTO and CMO",
        ],
      },
      {
        query:
          "What was the relationship between Alex and Sam when Alex started as a junior developer?",
        expectedMemory: [
          "colleagues",
          "coffee machine",
          "showed me where",
          "first day",
          "friendly",
          "marketing manager",
        ],
      },
      {
        query: "What was Alex's career progression from start to finish?",
        expectedMemory: [
          "junior developer",
          "developer",
          "senior developer",
          "tech lead",
          "CTO",
        ],
      },
      {
        query:
          "How did the relationship between Alex and Sam evolve over time?",
        expectedMemory: [
          "colleagues",
          "coffee",
          "friends",
          "date",
          "dating",
          "love",
          "engaged",
          "marry",
        ],
      },
    ],
  },
];

// Test execution function
export async function runMemoryPerformanceTest() {
  console.log("🚀 Starting Supermemory Performance Test");
  console.log("=".repeat(80));

  // Check API key
  const apiKey =
    "sm_XFDGx4bKPRomqsVQ9rhz8J_nGrtHEGZLcjVppQAVKyTfFIcafOWcgIeRaizdJejZAOoJbFUJTtHMoHbpHikrSnW";
  if (!apiKey) {
    console.error(
      "❌ No API key found! Set VITE_SUPERMEMORY_API_KEY in .env file",
    );
    return null;
  }

  // Initialize Supermemory client
  const memoryClient = new Supermemory({ apiKey });
  // Use a more unique session ID with timestamp and random string
  const testSessionId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log(`📝 Test Session ID: ${testSessionId}\n`);
  const testResults: any[] = [];

  // Timing statistics
  const addTimings: number[] = [];
  const searchTimings: number[] = [];
  // Track search timings by limit count (1-10)
  const searchTimingsByLimit: Record<number, number[]> = {};

  // Process messages and run checkpoints
  for (let i = 0; i < storyMessages.length; i++) {
    // Store each message individually
    const message = storyMessages[i];

    // Format the message content - no need to include session ID in text since we use containerTag
    const memoryContent = `Message ${i}:\n[${message.role}]: ${message.content}`;

    try {
      // Store directly to Supermemory with timing
      const addStartTime = performance.now();
      const response = await memoryClient.memories.add({
        content: memoryContent,
        containerTag: testSessionId, // Use unique session ID as container tag
        metadata: {
          sessionId: testSessionId,
          messageIndex: i,
          role: message.role,
          timestamp: Date.now(),
        },
      });
      const addEndTime = performance.now();
      const addDuration = addEndTime - addStartTime;
      addTimings.push(addDuration);

      console.log(
        `✅ Stored message ${i}, ID: ${response.id} (${addDuration.toFixed(2)}ms)`,
      );

      // Small delay to allow indexing
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to store message ${i}:`, error);
    }

    // Check if we've hit a checkpoint
    const checkpoint = memoryCheckpoints.find(
      (cp) => cp.messageIndex === i + 1,
    );
    if (checkpoint) {
      console.log("\n" + "=".repeat(80));
      console.log(`📍 CHECKPOINT: ${checkpoint.name}`);
      console.log(`   Messages processed: ${i + 1}`);
      console.log("=".repeat(80));

      const checkpointResults = {
        checkpoint: checkpoint.name,
        messageIndex: checkpoint.messageIndex,
        queries: [] as any[],
      };

      // Run each query for this checkpoint
      for (const queryTest of checkpoint.queries) {
        console.log(`\n🔍 Query: "${queryTest.query}"`);
        console.log(`   Expected: ${queryTest.expectedMemory.join(", ")}`);

        try {
          // Wait longer for indexing to complete
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Random limit between 1 and 10
          const randomLimit = Math.floor(Math.random() * 10) + 1;

          // Search directly with Supermemory API - filter by session using containerTag with timing
          const searchStartTime = performance.now();
          const searchResults = await memoryClient.search.memories({
            q: queryTest.query, // Just the query, no session ID in text
            containerTag: testSessionId, // Filter by session using containerTag
            limit: randomLimit, // Random limit between 1-10
          });
          const searchEndTime = performance.now();
          const searchDuration = searchEndTime - searchStartTime;
          searchTimings.push(searchDuration);

          // Track timing by limit count
          if (!searchTimingsByLimit[randomLimit]) {
            searchTimingsByLimit[randomLimit] = [];
          }
          searchTimingsByLimit[randomLimit].push(searchDuration);

          const memories = (searchResults.results || [])
            .map((result: any) => result.memory || "")
            .filter(Boolean);

          // Check if retrieved memories contain expected content
          const retrievedText = memories.join(" ").toLowerCase();
          const foundExpectations = queryTest.expectedMemory.filter(
            (expected) => retrievedText.includes(expected.toLowerCase()),
          );

          const success = foundExpectations.length > 0;

          console.log(
            `   ⏱️  Search time: ${searchDuration.toFixed(2)}ms (limit: ${randomLimit})`,
          );
          console.log(`   Retrieved: ${memories.length} memories`);
          console.log(`   Status: ${success ? "✅ PASS" : "❌ FAIL"}`);

          if (memories.length > 0) {
            // Show FULL memory content, not truncated
            console.log(`   Full memory retrieved:`);
            for (const memory of memories) {
              console.log(`   "${memory}"`);
            }
          } else {
            console.log(`   No memory found for this query`);
          }

          checkpointResults.queries.push({
            query: queryTest.query,
            expected: queryTest.expectedMemory,
            retrieved: memories,
            foundExpectations,
            success,
            searchTime: searchDuration,
            limit: randomLimit,
          });
        } catch (error) {
          console.error(`   ❌ Query failed:`, error);
          checkpointResults.queries.push({
            query: queryTest.query,
            expected: queryTest.expectedMemory,
            error: error instanceof Error ? error.message : String(error),
            success: false,
          });
        }
      }

      testResults.push(checkpointResults);
    }
  }

  // Generate final report
  console.log("\n" + "=".repeat(80));
  console.log("📊 FINAL TEST REPORT");
  console.log("=".repeat(80));

  let totalQueries = 0;
  let successfulQueries = 0;

  testResults.forEach((result: any) => {
    console.log(`\n📍 ${result.checkpoint}`);
    result.queries.forEach((q: any) => {
      totalQueries++;
      if (q.success) successfulQueries++;

      console.log(`   ${q.success ? "✅" : "❌"} "${q.query}"`);
      if (!q.success && !q.error) {
        console.log(`      Expected: ${q.expected.join(", ")}`);
        console.log(`      Found: ${q.foundExpectations.join(", ") || "None"}`);
      }
      if (q.error) {
        console.log(`      Error: ${q.error}`);
      }
    });
  });

  const successRate = ((successfulQueries / totalQueries) * 100).toFixed(1);
  console.log("\n" + "=".repeat(80));
  console.log(
    `📈 Overall Success Rate: ${successRate}% (${successfulQueries}/${totalQueries} queries)`,
  );
  console.log("=".repeat(80));

  // Calculate timing statistics
  const calculateStats = (timings: number[]) => {
    if (timings.length === 0) return { avg: 0, min: 0, max: 0, total: 0 };
    const total = timings.reduce((sum, t) => sum + t, 0);
    const avg = total / timings.length;
    const min = Math.min(...timings);
    const max = Math.max(...timings);
    return { avg, min, max, total };
  };

  const addStats = calculateStats(addTimings);
  const searchStats = calculateStats(searchTimings);

  console.log("\n" + "=".repeat(80));
  console.log("⏱️  TIMING STATISTICS");
  console.log("=".repeat(80));
  console.log(`\n📝 Memory Add Operations (${addTimings.length} total):`);
  console.log(`   Average: ${addStats.avg.toFixed(2)}ms`);
  console.log(`   Min: ${addStats.min.toFixed(2)}ms`);
  console.log(`   Max: ${addStats.max.toFixed(2)}ms`);
  console.log(`   Total: ${addStats.total.toFixed(2)}ms`);

  console.log(`\n🔍 Memory Search Operations (${searchTimings.length} total):`);
  console.log(`   Average: ${searchStats.avg.toFixed(2)}ms`);
  console.log(`   Min: ${searchStats.min.toFixed(2)}ms`);
  console.log(`   Max: ${searchStats.max.toFixed(2)}ms`);
  console.log(`   Total: ${searchStats.total.toFixed(2)}ms`);

  console.log(`\n📊 Search Times by Limit Count:`);
  for (let limit = 1; limit <= 10; limit++) {
    const timings = searchTimingsByLimit[limit];
    if (timings && timings.length > 0) {
      const stats = calculateStats(timings);
      console.log(
        `   Limit ${limit}: ${timings.length} queries, avg ${stats.avg.toFixed(2)}ms (min: ${stats.min.toFixed(2)}ms, max: ${stats.max.toFixed(2)}ms)`,
      );
    }
  }
  console.log("=".repeat(80));

  return {
    sessionId: testSessionId,
    totalMessages: storyMessages.length,
    checkpoints: testResults,
    summary: {
      totalQueries,
      successfulQueries,
      successRate,
    },
    timing: {
      add: {
        count: addTimings.length,
        ...addStats,
        timings: addTimings,
      },
      search: {
        count: searchTimings.length,
        ...searchStats,
        timings: searchTimings,
      },
      searchByLimit: Object.fromEntries(
        Object.entries(searchTimingsByLimit).map(([limit, timings]) => [
          limit,
          {
            count: timings.length,
            ...calculateStats(timings),
            timings,
          },
        ]),
      ),
    },
  };
}

// Export for use in browser console
if (typeof window !== "undefined") {
  (window as any).runMemoryPerformanceTest = runMemoryPerformanceTest;
}
