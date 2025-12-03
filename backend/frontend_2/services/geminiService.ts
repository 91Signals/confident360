
import { AnalysisResult, ProjectCategory } from '../types';

// In a real scenario, we would use the GoogleGenAI SDK here.
// Since we cannot scrape a URL client-side directly due to CORS, 
// this service mocks the response as if the content was successfully retrieved and analyzed.

export const extractPortfolioDetails = async (url: string) => {
  // Simulate scanning the website for contact info
  // Ultra fast delay: 50ms
  await new Promise(resolve => setTimeout(resolve, 50));

  // Return mock extracted details
  return {
    name: "Alex Morgan",
    email: "alex.morgan@design.co",
    mobile: "+1 (555) 012-3456",
    linkedin: "https://linkedin.com/in/alexmorgan-ux"
  };
};

export const mockGoogleLogin = async () => {
  // Simulate popup and auth delay
  // Ultra fast delay: 100ms
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    name: "Alex Morgan",
    email: "alex.morgan@gmail.com",
    avatar: "https://i.pravatar.cc/150?u=alex",
    mobile: "",
    linkedin: ""
  };
};

export const extractProjectLinks = async (portfolioUrl: string): Promise<string[]> => {
  // Simulate scanning the portfolio page for project links
  // Ultra fast delay: 100ms
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const cleanUrl = portfolioUrl.replace(/\/$/, '');
  
  // Return mock project links found on the portfolio
  return [
    `${cleanUrl}/project/design-compass`,
    `${cleanUrl}/project/fintech-dashboard`,
    `${cleanUrl}/project/ecostream-app`,
    `${cleanUrl}/project/lumina-branding`
  ];
};

const MOCK_TITLES = [
  "Design Compass: UX Learning Buddy",
  "FinTech Dashboard Redesign",
  "EcoStream: Sustainability App",
  "Lumina: Brand Identity System",
  "FreshBox: Packaging Design",
  "Quarterly Campaign Assets"
];

const MOCK_ROLES = [
  "Product Designer",
  "UX Researcher",
  "Lead Designer",
  "UI/UX Designer",
  "Visual Designer"
];

export const analyzeCaseStudy = async (url: string): Promise<AnalysisResult> => {
  // Simulate network delay for the "Analyzing" animation
  // Snappy: Random delay between 100ms and 300ms
  const delay = Math.floor(Math.random() * 200) + 100;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Generate somewhat random but consistent data based on string length
  const seed = url.length;
  
  // Pick a title and category based on the URL content if possible, else random
  let titleIndex = seed % MOCK_TITLES.length;
  let category: ProjectCategory = "UX/UI";
  let domains: string[] = ["General"];
  let finalScore = 45; // Default poor score
  let walkthroughScore = 0; // Default not taken

  if (url.includes('design-compass')) { 
    titleIndex = 0; 
    category = "UX/UI"; 
    domains = ["EdTech", "Mobile", "Social"];
    finalScore = 70; // Requested: 70/100
    walkthroughScore = 3; // Taken
  }
  else if (url.includes('fintech')) { 
    titleIndex = 1; 
    category = "UX/UI"; 
    domains = ["Fintech", "Enterprise", "Data Viz"];
    finalScore = 42; // Poor
    walkthroughScore = 0;
  }
  else if (url.includes('ecostream')) { 
    titleIndex = 2; 
    category = "UX/UI"; 
    domains = ["Sustainability", "Consumer", "IoT"];
    finalScore = 38; // Poor
    walkthroughScore = 0;
  }
  else if (url.includes('lumina')) { 
    titleIndex = 3; 
    category = "Branding"; 
    domains = ["Fashion", "E-commerce", "Identity"];
    finalScore = 48; // Poor
    walkthroughScore = 0;
  }
  else if (url.includes('freshbox')) { 
    titleIndex = 4; 
    category = "Package Design"; 
    domains = ["Food & Bev", "Retail", "Logistics"];
    finalScore = 45;
    walkthroughScore = 0;
  }
  else if (url.includes('campaign')) { 
    titleIndex = 5; 
    category = "Marketing Design"; 
    domains = ["Advertising", "Social Media", "Growth"];
    finalScore = 52;
    walkthroughScore = 0;
  }
  // Random fallback
  else {
    const cats: ProjectCategory[] = ["UX/UI", "UX/UI", "Branding", "Marketing Design"]; // weighted towards UX
    category = cats[seed % cats.length];
    const potentialDomains = ["HealthTech", "SaaS", "B2B", "Travel", "Entertainment", "Real Estate", "AI"];
    domains = [potentialDomains[seed % potentialDomains.length], potentialDomains[(seed + 1) % potentialDomains.length]];
    finalScore = 40 + (seed % 15);
    walkthroughScore = 0;
  }

  // Return a mock result based on the user's example images
  return {
    url,
    category,
    domains,
    overallScore: finalScore,
    walkthroughScore,
    summary: "The case study presents a well-structured and logical account of the design process. The author effectively defines the problem and follows a comprehensive methodology. However, visual documentation of the early iteration phases could be improved.",
    keywords: [
      "User Research", "Competitive Analysis", "User Personas", 
      "Ideation", "High-Fidelity UI", "Usability Testing", "EdTech"
    ],
    projectDetails: {
      title: MOCK_TITLES[titleIndex],
      role: MOCK_ROLES[seed % MOCK_ROLES.length],
      timeline: `${(seed % 8) + 2} Weeks`
    },
    sections: [
      {
        name: "Research & Insights",
        score: Math.floor(finalScore * 0.15), // approx proportional
        maxScore: 15,
        feedback: "Strong primary and secondary research methods. Key pain points are listed clearly. Lacks raw artifacts like affinity maps or user quotes.",
        subSections: [
          { name: "Secondary Research", score: 3 },
          { name: "Primary Research", score: 4 },
          { name: "Depth of Insights", score: 4 }
        ]
      },
      {
        name: "Problem Definition",
        score: Math.floor(finalScore * 0.18),
        maxScore: 15,
        feedback: "Problem statement and HMW questions are well-defined. Personas are mentioned but could be more detailed."
      },
      {
        name: "Ideation & Process",
        score: Math.floor(finalScore * 0.20),
        maxScore: 20,
        feedback: "Good flow, but lacks visual evidence of brainstorming (Crazy 8s, sketches) which detracts from the narrative."
      },
      {
        name: "Visual Design",
        score: Math.floor(finalScore * 0.15),
        maxScore: 20,
        feedback: "Clean final UI, but lacks a dedicated design system section or accessibility breakdown."
      },
      {
        name: "Validation",
        score: Math.floor(finalScore * 0.16),
        maxScore: 15,
        feedback: "Validation phase demonstrates feedback incorporation. Metrics are defined but not fully measured."
      },
      {
        name: "Storytelling",
        score: Math.floor(finalScore * 0.1),
        maxScore: 10,
        feedback: "Narrative flow is smooth, but slightly text-heavy."
      },
      {
        name: "Bonus",
        score: 1,
        maxScore: 5,
        feedback: "Standard presentation. No interactive prototypes linked."
      }
    ],
    improvements: [
      {
        phase: "Research",
        issue: "Lack of visual evidence",
        recommendation: "Include photos of affinity mapping sessions or direct user quotes to humanize the data.",
        priority: "High"
      },
      {
        phase: "Visual Design",
        issue: "Accessibility missing",
        recommendation: "Add a section on color contrast checks and screen reader compatibility.",
        priority: "High"
      },
      {
        phase: "Ideation",
        issue: "Missing low-fi sketches",
        recommendation: "Show the 'messy' part of the process. Sketches validate that you explored multiple solutions.",
        priority: "Medium"
      }
    ]
  };
};
