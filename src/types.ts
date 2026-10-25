export interface WorkItem {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  year: string;
  description: string;
  longDescription: string;
  technologies: string[];
  image: string;
  link: string;
  githubUrl?: string;
  featured: boolean;
  metrics?: string;
}

export interface SkillItem {
  name: string;
  level: string;
  experience: string;
}

export interface SkillCategory {
  category: string;
  description: string;
  skills: SkillItem[];
}
